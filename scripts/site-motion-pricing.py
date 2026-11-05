"""CI-only pricing journeys, motion accessibility and scroll-performance guards."""
import functools
import http.server
import json
from pathlib import Path
import threading
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs/screenshots/wave909/motion-pricing"
OUT.mkdir(parents=True, exist_ok=True)

class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(Handler, directory=str(ROOT / "dist/client")))
threading.Thread(target=server.serve_forever, daemon=True).start()
base = f"http://127.0.0.1:{server.server_address[1]}"
report = {"checks": [], "failures": []}
with sync_playwright() as pw:
    browser = pw.chromium.launch()
    for width in (390, 768, 1280, 1440):
        context = browser.new_context(viewport={"width": width, "height": 900}, has_touch=width < 1024, is_mobile=width < 1024)
        context.route("**/*", lambda route: route.abort() if route.request.method == "POST" else route.continue_())
        context.add_init_script("""(() => {
          window.__frames=0; const raf=requestAnimationFrame;
          window.requestAnimationFrame=cb=>raf(t=>{window.__frames++;cb(t)});
          window.__arrivals=[];
          document.addEventListener('animationstart', e=>{
            if(e.animationName==='friendly-arrive') __arrivals.push(e.target.textContent.trim());
          });
        })()""")
        page = context.new_page()
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        try:
            page.goto(base + "/", wait_until="networkidle")
            page.wait_for_timeout(1400)
            before = page.evaluate("__frames")
            page.wait_for_timeout(700)
            assert page.evaluate("__frames") - before < 4, "Idle frame loop returned"
            js_bytes = page.evaluate("performance.getEntriesByType('resource').filter(r=>r.name.endsWith('.js')).reduce((sum,r)=>sum+r.decodedBodySize,0)")
            assert js_bytes < 780000, "Homepage JavaScript exceeds the wave 1003 allowance"
            assert not page.evaluate("document.documentElement.classList.contains('lenis')")
            if width >= 1280:
                role = page.locator('.hero-role-link').first
                role.hover()
                assert role.locator('.role-plate').evaluate("n=>getComputedStyle(n).animationName") == 'friendly-icon-hello'
                page.screenshot(path=str(OUT / f"role-hover-{width}.png"))
                role.focus()
                assert role.locator('.role-plate').evaluate("n=>getComputedStyle(n).animationName") == 'friendly-icon-hello'
            # Real delayed scrolling must still trigger an entrance after the page has settled.
            target = page.locator('[data-arrival="waiting"]').first
            expect(target).to_have_count(1)
            target.evaluate("n=>n.dataset.motionTestTarget='true'")
            target = page.locator('[data-motion-test-target="true"]')
            target.scroll_into_view_if_needed()
            expect(target).to_have_attribute('data-arrival', 'entered')
            page.wait_for_function("__arrivals.length > 0")
            page.wait_for_timeout(700)
            assert target.evaluate("n=>getComputedStyle(n).opacity") == '1'
            page.evaluate("scrollTo({top:0,behavior:'instant'})")
            if width < 1280:
                page.get_by_role('button', name='Open menu', exact=True).click()
                nav = page.get_by_role('navigation', name='Mobile', exact=True)
            else:
                nav = page.get_by_role('navigation', name='Main', exact=True)
            nav.get_by_role('link', name='Pricing', exact=True).click()
            page.wait_for_url('**/pricing')
            expect(page.locator('[data-pricing-status]')).to_have_text('Coming soon')
            expect(page.locator('[data-pricing-page]')).to_contain_text('transparent')
            expect(page.locator('main')).not_to_contain_text('£')
            expect(page.locator('main')).not_to_contain_text('/month')
            for name in ('included', 'additional'):
                row = page.locator(f'details[data-pricing-point="{name}"]')
                row.locator('summary').focus()
                page.keyboard.press('Enter')
                expect(row).to_have_attribute('open', '')
                expect(row.locator('p')).to_be_visible()
            page.evaluate("scrollTo({top:0,behavior:'instant'})")
            page.wait_for_timeout(700)
            page.screenshot(path=str(OUT / f"pricing-{width}.png"), full_page=True)
            # No overlap within the newly longer desktop navigation.
            if width >= 1280:
                boxes = page.locator('header.site-header nav[aria-label="Main"] .nav-link').evaluate_all("ns=>ns.map(n=>{const r=n.getBoundingClientRect();return {left:r.left,right:r.right}})")
                assert all(a['right'] <= b['left'] + 1 for a, b in zip(boxes, boxes[1:])), 'Navigation overlaps'
                assert page.locator('header.site-header').evaluate("n=>n.scrollWidth<=n.clientWidth+1")
            expect(page.locator('footer').get_by_role('link', name='Pricing', exact=True)).to_have_attribute('href', '/pricing')
            expect(page.get_by_role('link', name='Explore our services', exact=True)).to_have_attribute('href', '/platform')
            page.get_by_role('link', name='Talk to our team', exact=True).click()
            page.wait_for_url('**/contact')
            expect(page.locator('h1')).to_be_visible()
            page.emulate_media(reduced_motion='reduce')
            page.goto(base + '/pricing', wait_until='networkidle')
            row = page.locator('details[data-pricing-point="included"]')
            row.locator('summary').click()
            expect(row.locator('p')).to_be_visible()
            assert row.locator('.pricing-disclosures__content').evaluate("n=>getComputedStyle(n).animationName") == 'none'
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1')
            assert not errors, errors
            report['checks'].append({'width':width, 'homepage_js_bytes':js_bytes, 'status':'pass'})
        except Exception as error:
            report['failures'].append({'width':width, 'error':str(error)})
            page.screenshot(path=str(OUT / f'failure-{width}.png'))
        finally:
            context.close()
    context = browser.new_context(java_script_enabled=False, viewport={'width':390,'height':900})
    page = context.new_page()
    try:
        page.goto(base + '/pricing')
        expect(page.locator('h1')).to_be_visible()
        expect(page.locator('[data-pricing-status]')).to_have_text('Coming soon')
        for name in ('included', 'additional'):
            row = page.locator(f'details[data-pricing-point="{name}"]')
            row.locator('summary').click()
            expect(row.locator('p')).to_be_visible()
        report['checks'].append({'javascript':False, 'status':'pass'})
    except Exception as error:
        report['failures'].append({'javascript':False, 'error':str(error)})
    browser.close()
server.shutdown()
(OUT / 'report.json').write_text(json.dumps(report, indent=2))
print(json.dumps(report, indent=2))
raise SystemExit(1 if report['failures'] else 0)

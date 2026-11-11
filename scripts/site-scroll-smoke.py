"""CI-only scrolling and navigation checks in Firefox and WebKit."""
import functools
import http.server
import json
from pathlib import Path
import threading
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs/screenshots/wave909/cross-browser"
OUT.mkdir(parents=True, exist_ok=True)

class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(Handler, directory=str(ROOT / "dist/client")))
threading.Thread(target=server.serve_forever, daemon=True).start()
base = f"http://127.0.0.1:{server.server_address[1]}"
snapshot = json.loads((ROOT / "src/data/public-property-stock.json").read_text())
report = {"checks": [], "failures": []}
with sync_playwright() as pw:
    for engine, width in (("firefox", 1280), ("webkit", 390), ("webkit", 1280)):
        browser = getattr(pw, engine).launch()
        options = {"viewport": {"width": width, "height": 900}, "reduced_motion": "no-preference"}
        if width == 390:
            options.update(has_touch=True, is_mobile=True)
        context = browser.new_context(**options)
        context.route("**/*", lambda route: route.abort() if route.request.method == "POST" else route.continue_())
        context.route("**/public/showcase-counts*", lambda route: route.fulfill(status=200, content_type="application/json", headers={"Access-Control-Allow-Origin":"*"}, body=json.dumps(snapshot)))
        page = context.new_page()
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        try:
            page.goto(base + "/", wait_until="networkidle")
            assert not page.evaluate("document.documentElement.classList.contains('lenis')")
            if width == 390:
                page.get_by_role("button", name="Next photograph", exact=True).click()
                page.wait_for_function("document.querySelector('.hero-band').scrollLeft > 100")
                page.get_by_role("button", name="Previous photograph", exact=True).click()
                page.wait_for_function("document.querySelector('.hero-band').scrollLeft < 2")
            page.locator("[data-property-map]").scroll_into_view_if_needed()
            page.wait_for_function("document.querySelector('[data-property-map] canvas').width > 300")
            expect(page.locator("[data-property-map]")).to_have_attribute("data-motion", "running")
            page.emulate_media(reduced_motion="reduce")
            expect(page.locator("[data-property-map]")).to_have_attribute("data-motion", "paused")
            page.emulate_media(reduced_motion="no-preference")
            expect(page.locator("[data-property-map]")).to_have_attribute("data-motion", "running")
            page.locator("[data-property-map]").screenshot(path=str(OUT / f"map-{engine}-{width}.png"), animations="disabled")
            if width == 390:
                # The existing mobile design omits this floating control so it
                # cannot cover text. Return using the browser's scroll API.
                expect(page.get_by_role("button", name="Back to top", exact=True)).to_have_count(0)
                page.evaluate("scrollTo({top:0,behavior:'smooth'})")
            else:
                page.get_by_role("button", name="Back to top", exact=True).click()
            page.wait_for_function("scrollY < 2")
            expect(page.locator("[data-property-map]")).to_have_attribute("data-motion", "paused")
            if width == 390:
                page.get_by_role("button", name="Open menu", exact=True).click()
                page.get_by_role("navigation", name="Mobile", exact=True).get_by_role("link", name="About Us", exact=True).click()
            else:
                page.get_by_role("navigation", name="Main", exact=True).get_by_role("link", name="About Us", exact=True).click()
            page.wait_for_url("**/about")
            page.wait_for_timeout(500)
            outline = page.get_by_role("navigation", name="On this page", exact=True)
            if width == 390:
                outline.locator("summary").click()
            outline.get_by_role("link", name="What we do", exact=True).click()
            page.wait_for_function("document.querySelector('#what-heading').getBoundingClientRect().top < 300")
            assert page.locator("#what-heading").bounding_box()["y"] >= 0
            if width == 390:
                expect(outline.locator("summary")).to_contain_text("What we do")
            else:
                expect(outline.get_by_role("link", name="What we do", exact=True)).to_have_attribute("aria-current", "location")
            page.screenshot(path=str(OUT / f"anchor-{engine}-{width}.png"))
            page.goto(base + "/platform", wait_until="networkidle")
            page.locator("#platform-guide-role").select_option("management-agent")
            expect(page.locator("#platform-guides article")).to_have_attribute("data-role", "management-agent")
            page.evaluate("scrollTo({top:700,behavior:'instant'})")
            page.wait_for_function("scrollY >= 650")
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth + 1")
            page.goto(base + "/pricing", wait_until="networkidle")
            expect(page.locator("[data-pricing-status]")).to_have_text("Coming soon")
            pricing_page = page.locator('[data-pricing-page]')
            expect(pricing_page).to_contain_text('transparent')
            expect(pricing_page).not_to_contain_text('£')
            expect(pricing_page).not_to_contain_text('/month')
            expect(pricing_page.locator('[data-package], .pricing-calculator, [data-estimated-fee], [data-worked-example]')).to_have_count(0)
            expect(pricing_page.get_by_role('link', name='Talk to our team', exact=True)).to_have_attribute('href', '/contact')
            row = page.locator('details[data-pricing-point="included"]')
            row.locator("summary").click()
            expect(row.locator("p")).to_be_visible()
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth + 1")
            assert not errors, errors
            report["checks"].append({"engine":engine,"width":width,"status":"pass"})
        except Exception as error:
            report["failures"].append({"engine":engine,"width":width,"error":str(error)})
            page.screenshot(path=str(OUT / f"failure-{engine}-{width}.png"))
        finally:
            browser.close()
server.shutdown()
(OUT / "report.json").write_text(json.dumps(report, indent=2))
print(json.dumps(report, indent=2))
raise SystemExit(1 if report["failures"] else 0)

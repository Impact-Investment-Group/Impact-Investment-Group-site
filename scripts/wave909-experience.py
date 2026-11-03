"""GitHub Actions browser checks and review images for the marketing site.

Uses the real static build. No enquiry or registration is ever submitted.
"""
import functools
import http.server
import json
import re
import threading
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs/screenshots/wave909"
OUT.mkdir(parents=True, exist_ok=True)
roles_source = (ROOT / "src/content/audiences.ts").read_text(encoding="utf-8")
roles_block = roles_source.split("export const registerRoles", 1)[1].split("\n];", 1)[0]
roles = [re.search(r'id:\s*"([a-z0-9-]+)"', block).group(1)
         for block in re.findall(r'\{([^{}]+)\}', roles_block)
         if 'href:' not in block and re.search(r'id:\s*"([a-z0-9-]+)"', block)]
partners = ["/" + p.stem for p in sorted((ROOT / "src/routes").glob("partner-with-*.tsx"))]
paths = ["/", "/about", "/platform", "/the-problem", "/solutions", "/partners", "/contact", "/register", "/legal"]
paths += partners + ["/register/" + role for role in roles] + ["/this-route-does-not-exist"]


class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def send_error(self, code, message=None, explain=None):
        fallback = ROOT / "dist/client/404.html"
        if code == 404 and fallback.exists():
            body = fallback.read_bytes()
            self.send_response(404)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        else:
            super().send_error(code, message, explain)


server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(Handler, directory=str(ROOT / "dist/client")))
threading.Thread(target=server.serve_forever, daemon=True).start()
base = f"http://127.0.0.1:{server.server_address[1]}"
report = {"pages": [], "interactions": [], "failures": []}


def check(condition, message):
    if not condition:
        raise AssertionError(message)


with sync_playwright() as pw:
    browser = pw.chromium.launch()
    for width in [390, 1280]:
        context = browser.new_context(viewport={"width": width, "height": 900}, reduced_motion="reduce")
        context.route("**/*", lambda route: route.abort() if route.request.method == "POST" else route.continue_())
        page = context.new_page()
        for path in paths:
            errors = []
            listener = lambda error: errors.append(str(error))
            page.on("pageerror", listener)
            row = {"path": path, "width": width}
            try:
                response = page.goto(base + path, wait_until="networkidle")
                check(response.status == (404 if path == "/this-route-does-not-exist" else 200), f"HTTP {response.status}")
                page.wait_for_timeout(350)
                check(len(page.locator("body").inner_text()) > 60, "Empty page")
                check(page.locator("main").count() == 1, "Expected exactly one main landmark")
                check(page.locator("h1").count() == 1, "Expected exactly one h1")
                expect(page.locator("h1")).to_be_visible()
                check(page.evaluate("document.documentElement.scrollWidth <= innerWidth + 1"), "Horizontal overflow")
                # Visit lazy images and sections before taking the complete reading view.
                page.evaluate("document.querySelectorAll('img[loading=lazy]').forEach(img => img.loading='eager')")
                page.wait_for_function("Array.from(document.images).every(img => img.complete)")
                broken = page.locator("img").evaluate_all("nodes => nodes.filter(n => !n.naturalWidth).map(n => n.src)")
                check(not broken, f"Broken images: {broken}")
                for figure in page.locator(".partner-craft-guides").all():
                    caption_top = figure.locator("figcaption").bounding_box()["y"]
                    for guide in figure.locator("img").all():
                        box = guide.bounding_box()
                        check(box["y"] + box["height"] + 8 <= caption_top, "Guide artwork overlaps its caption")
                for link in page.locator(".page-outline a").all():
                    check(page.locator(link.get_attribute("href")).count() == 1, "Missing or duplicate section target")
                page.add_script_tag(path=str(ROOT / "node_modules/axe-core/axe.min.js"))
                axe = page.evaluate("async () => await axe.run(document, {runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})")
                violations = [{"id": v["id"], "impact": v["impact"], "nodes": [{"target": n["target"], "summary": n.get("failureSummary", "")} for n in v["nodes"]]} for v in axe["violations"]]
                row["accessibility"] = violations
                row["contrast_incomplete"] = sum(len(v["nodes"]) for v in axe["incomplete"] if v["id"] == "color-contrast")
                check(not violations, f"Accessibility: {json.dumps(violations)}")
                check(not errors, f"Browser errors: {errors}")
                row["status"] = "pass"
            except Exception as error:
                row["status"] = "fail"
                row["error"] = str(error)
                report["failures"].append(f"{path} at {width}: {error}")
            finally:
                page.screenshot(path=str(OUT / f"{path.strip('/').replace('/', '-') or 'home'}-{width}.png"), full_page=True, animations="disabled")
                page.remove_listener("pageerror", listener)
                row["browser_errors"] = errors
                report["pages"].append(row)
                print(json.dumps({"path": path, "width": width, "status": row["status"], "error": row.get("error", "")}), flush=True)

        def interaction(name, action):
            try:
                action()
                report["interactions"].append({"name": name, "width": width, "status": "pass"})
            except Exception as error:
                report["interactions"].append({"name": name, "width": width, "status": "fail", "error": str(error)})
                report["failures"].append(f"{name} at {width}: {error}")

        def outline():
            page.goto(base + "/about", wait_until="networkidle")
            nav = page.get_by_role("navigation", name="On this page")
            if width == 390:
                nav.locator("summary").click()
            nav.get_by_role("link", name="What we do").click()
            if width == 390:
                expect(nav.locator("summary")).to_contain_text("What we do")
            else:
                expect(nav.get_by_role("link", name="What we do")).to_have_attribute("aria-current", "location")
            check(page.locator("#what-heading").bounding_box()["y"] >= page.locator(".page-outline").bounding_box()["y"], "Section obscured")
            page.get_by_role("link", name="About Us", exact=True).first.click() if width == 1280 else None

        def partner_search():
            page.goto(base + "/partners", wait_until="networkidle")
            field = page.locator("#partner-search")
            field.fill("investor")
            results = page.locator("#partner-results")
            expect(results.locator('a[href="/partner-with-investor"]')).to_be_visible()
            field.fill("zzqnomatch")
            check(results.locator('a[href^="/partner-with-"]').count() == 0, "Search did not filter")
            page.get_by_role("button", name="Clear partner search").click()
            check(results.locator('a[href^="/partner-with-"]').count() == len(partners), "Reset did not restore every partner")

        def journey():
            page.goto(base + "/partner-with-investor", wait_until="networkidle")
            tabs = page.get_by_role("tablist").get_by_role("tab")
            tabs.first.focus()
            page.keyboard.press("ArrowRight")
            expect(tabs.nth(1)).to_be_focused()
            expect(tabs.nth(1)).to_have_attribute("aria-selected", "true")
            page.locator("#journey-panel").get_by_role("button", name="Next step", exact=True).click()
            expect(tabs.last).to_have_attribute("aria-selected", "true")
            expect(page.locator("#journey-panel").get_by_role("button", name="Next step", exact=True)).to_be_disabled()
            page.locator("#journey-panel").get_by_role("button", name="Previous step", exact=True).click()
            page.locator("#journey-panel").get_by_role("button", name="Previous step", exact=True).click()
            expect(tabs.first).to_have_attribute("aria-selected", "true")
            expect(page.locator("#journey-panel").get_by_role("button", name="Previous step", exact=True)).to_be_disabled()
            trigger = page.get_by_role("button", name="View full diagram")
            trigger.click()
            expect(page.get_by_role("dialog")).to_be_visible()
            page.keyboard.press("Escape")
            expect(page.get_by_role("dialog")).to_have_count(0)
            expect(trigger).to_be_focused()

        def services():
            page.goto(base + "/platform", wait_until="networkidle")
            choices = page.locator(".friendly-journey-choice")
            before = page.locator("#service-journey-detail").inner_text()
            choices.last.click()
            expect(choices.last).to_have_attribute("aria-pressed", "true")
            check(page.locator("#service-journey-detail").inner_text() != before, "Service journey detail did not change")
            page.locator("#service-journey-detail").get_by_role("button", name="Next step", exact=True).click()
            expect(choices.first).to_have_attribute("aria-pressed", "true")
            tabs = page.get_by_role("tablist").get_by_role("tab")
            tabs.first.focus()
            page.keyboard.press("End")
            expect(tabs.last).to_be_focused()
            expect(tabs.last).to_have_attribute("aria-selected", "true")
            expect(page.get_by_role("tablist")).to_have_count(1)
            check(not re.search(r"Option [24]|Tool online|Activate their tool", page.locator("main").inner_text()), "Draft or simulated-operation labels remain")
            for index in range(tabs.count()):
                tabs.nth(index).click()
                expect(page.get_by_role("tabpanel")).to_have_count(1)
                expect(page.get_by_role("tabpanel")).to_have_attribute("aria-labelledby", tabs.nth(index).get_attribute("id"))
            check_crafted_state("services-tool")
            trigger = page.get_by_role("button", name="View larger platform preview")
            trigger.click()
            expect(page.get_by_role("dialog")).to_be_visible()
            page.keyboard.press("Escape")
            expect(trigger).to_be_focused()

        def photos():
            page.goto(base + "/", wait_until="networkidle")
            page.get_by_role("button", name="Next photograph").click()
            check(page.locator(".hero-band").evaluate("n => n.scrollLeft > 0"), "Photo strip did not advance")
            page.get_by_role("button", name="Previous photograph").click()
            expect(page.locator(".hero-band")).to_have_js_property("scrollLeft", 0)

        def contact_validation():
            page.goto(base + "/contact", wait_until="networkidle")
            page.locator('form button[type="submit"]').click()
            expect(page.locator('[aria-invalid="true"]').first).to_be_visible()
            page.locator("textarea").fill("A test message that stays in this browser.")
            expect(page.locator("textarea")).to_have_value("A test message that stays in this browser.")
            check(page.locator("form").count() == 1, "Contact form missing")

        def mobile_menu():
            page.goto(base + "/", wait_until="networkidle")
            trigger = page.locator('header button[aria-controls="site-drawer"]')
            trigger.click()
            expect(page.locator("#site-drawer")).to_be_visible()
            page.keyboard.press("Escape")
            expect(trigger).to_be_focused()

        def registration_feedback():
            page.goto(base + "/register/investor", wait_until="networkidle")
            expect(page.locator('li[aria-current="step"]')).to_contain_text("Your account")
            page.locator('#password').fill("LocalOnly-Example-42!")
            page.locator('#confirmPassword').fill("LocalOnly-Example-42!")
            expect(page.locator('#password-match')).to_have_text("Passwords match")
            page.locator('#confirmPassword').fill("Different-Example-42!")
            expect(page.locator('#password-match')).to_have_count(0)
            for field in page.locator('.registration-account input').all():
                field.focus()
                field.scroll_into_view_if_needed()
                check(field.evaluate("n => { const a=n.getBoundingClientRect(); const b=document.querySelector('.registration-account .registration-actions').getBoundingClientRect(); return a.bottom<=b.top || a.top>=b.bottom; }"), "Account action overlaps a field")

        def contact_deep_links():
            for query, label in [("investor", "Investor enquiry"), ("support", "Support"), ("demo", "Talk to the team")]:
                errors = []
                listener = lambda error: errors.append(str(error))
                page.on("pageerror", listener)
                try:
                    page.goto(base + "/contact/?enquiry=" + query, wait_until="networkidle")
                    expect(page.locator("#enquiry-form-title")).to_have_text(label)
                    check(not errors, f"Enquiry deep link hydration: {errors}")
                finally:
                    page.remove_listener("pageerror", listener)
            page.goto(base + "/contact/?enquiry=investor&role=Investor", wait_until="networkidle")
            expect(page.locator("#enquiry-form-title")).to_have_text("Investor enquiry")
            expect(page.locator("#role")).to_have_value("Investor")

        def check_crafted_state(name):
            check(page.evaluate("document.documentElement.scrollWidth <= innerWidth + 1"), "Interactive state overflows")
            page.add_script_tag(path=str(ROOT / "node_modules/axe-core/axe.min.js"))
            violations = page.evaluate("async () => (await axe.run(document, {runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v => ({id:v.id, nodes:v.nodes.map(n=>n.target)}))")
            check(not violations, f"Interactive accessibility: {violations}")
            page.screenshot(path=str(OUT / f"interactive-{name}-{width}.png"), full_page=True, animations="disabled")

        def home_mission():
            page.goto(base + "/", wait_until="networkidle")
            expect(page.locator(".hero-role-grid a")).to_have_count(10)
            check(page.locator("#hero-heading .text-teal-600").evaluate("n => getComputedStyle(n).color") == "rgb(38, 121, 119)", "Hero sample teal changed")
            tabs = page.get_by_role("tablist", name="Our mission").get_by_role("tab")
            tabs.first.focus()
            page.keyboard.press("End")
            expect(tabs.last).to_be_focused()
            expect(tabs.last).to_have_attribute("aria-selected", "true")
            expect(page.locator("#mission-panel-need")).to_be_hidden()
            expect(page.locator("#mission-panel-response")).to_be_visible()
            expect(page.locator("#mission-panel-response")).to_contain_text("Illustrative")
            check_crafted_state("home-response")
            page.keyboard.press("Home")
            expect(tabs.first).to_be_focused()
            expect(page.locator("#mission-panel-need")).to_be_visible()
            expect(page.locator("#mission-panel-need")).to_contain_text("176,130")
            expect(page.locator("#mission-panel-need")).to_contain_text("not cumulative")
            expect(page.get_by_text("Platform snapshot recorded 3 August 2026", exact=True)).to_be_visible()

        def connection_journey():
            page.goto(base + "/", wait_until="networkidle")
            tabs = page.get_by_role("tablist", name="How the connection works").get_by_role("tab")
            expect(tabs).to_have_count(4)
            panel = page.locator("#connection-detail")
            initial = panel.inner_text()
            for index in range(4):
                tabs.nth(index).click()
                expect(tabs.nth(index)).to_have_attribute("aria-selected", "true")
                expect(panel).to_have_attribute("aria-labelledby", tabs.nth(index).get_attribute("id"))
                expect(panel).to_contain_text(f"Step {index + 1} of 4")
                link = panel.get_by_role("link", name="Explore this stage")
                check(link.get_attribute("href").startswith("/partner-with-"), "Stage has no real partner destination")
                page.wait_for_function("() => {const n=document.querySelector('#connection-detail .connection-picture > img');return n && n.complete && n.naturalWidth > 0;}")
                check(panel.locator(".connection-picture > img").evaluate("n => n.complete && n.naturalWidth > 0"), "Journey photograph missing")
            check(panel.inner_text() != initial, "Journey changes no explanatory content")
            check_crafted_state("connection-home")
            page.get_by_role("button", name="Replay the journey", exact=True).click()
            expect(tabs.first).to_have_attribute("aria-selected", "true")
            page.locator(".connection-navigation").get_by_role("button", name="Next step", exact=True).click()
            expect(tabs.nth(1)).to_have_attribute("aria-selected", "true")
            page.locator(".connection-navigation").get_by_role("button", name="Previous step", exact=True).click()
            expect(tabs.first).to_have_attribute("aria-selected", "true")
            tabs.first.focus()
            page.keyboard.press("End")
            expect(tabs.last).to_be_focused()
            expect(tabs.last).to_have_attribute("aria-selected", "true")
            page.keyboard.press("ArrowRight")
            expect(tabs.first).to_be_focused()
            expect(tabs.first).to_have_attribute("aria-selected", "true")

        def photo_variants():
            page.goto(base + "/", wait_until="networkidle")
            names = ["providing homes", "delivering support", "transforming lives"]
            for index, name in enumerate(names):
                control = page.get_by_role("button", name="Show " + name, exact=True)
                control.click()
                expect(control).to_have_attribute("aria-pressed", "true")
                visible = page.locator(".welcome-photo").nth(index)
                check(visible.evaluate("n => {const p=n.getBoundingClientRect(),b=n.parentElement.getBoundingClientRect();return p.left >= b.left-2 && p.right <= b.right+2}"), "Selected photograph is clipped")
                check_crafted_state("photo-" + str(index))

        def solution_layers():
            page.goto(base + "/solutions", wait_until="networkidle")
            tabs = page.get_by_role("tablist", name="Deal layers").get_by_role("tab")
            expect(tabs).to_have_count(5)
            for index in range(5):
                tabs.nth(index).click()
                expect(tabs.nth(index)).to_have_attribute("aria-selected", "true")
                expect(page.locator("#layer-detail")).to_have_attribute("aria-labelledby", tabs.nth(index).get_attribute("id"))
                check(page.locator("#layer-detail dl dt").count() > 0, "Layer has no responsible roles")
            page.keyboard.press("Home")
            expect(tabs.first).to_be_focused()
            page.keyboard.press("ArrowDown")
            expect(tabs.nth(1)).to_be_focused()
            check_crafted_state("solution-layer")

        def partner_stages():
            page.goto(base + "/partners", wait_until="networkidle")
            control = page.get_by_label("Filter by stage", exact=True)
            for stage in ["need", "property", "delivery", "outcome"]:
                control.select_option(stage)
                expect(page.locator("#partner-results [data-stage]")).to_have_count(1)
                expect(page.locator("#partner-results [data-stage]")).to_have_attribute("data-stage", stage)
                check(page.locator('#partner-results a[href^="/partner-with-"]').count() > 0, f"Empty stage {stage}")
            page.locator("#partner-search").fill("zzqnomatch")
            expect(page.locator('#partner-results a[href^="/partner-with-"]')).to_have_count(0)
            page.get_by_role("button", name="Show all partners", exact=True).click()
            expect(control).to_have_value("all")
            expect(page.locator("#partner-search")).to_have_value("")
            expect(page.locator('#partner-results a[href^="/partner-with-"]')).to_have_count(len(partners))
            check_crafted_state("partner-directory")

        def partner_connections():
            page.goto(base + "/partner-with-investor", wait_until="networkidle")
            controls = page.get_by_role("group", name="Partner connections").get_by_role("button")
            check(controls.count() > 1, "No relationship choices")
            first = page.locator("#partner-relationship-detail").inner_text()
            controls.nth(1).focus()
            page.keyboard.press("Enter")
            expect(controls.nth(1)).to_have_attribute("aria-pressed", "true")
            expect(controls.first).to_have_attribute("aria-pressed", "false")
            check(page.locator("#partner-relationship-detail").inner_text() != first, "Relationship detail did not change")
            check_crafted_state("partner-relationship")

        def contact_switch_preserves_draft():
            page.goto(base + "/contact", wait_until="networkidle")
            if width == 390:
                check(page.locator("#enquiry-form-title").bounding_box()["y"] < 1200, "Contact form is still too far down on mobile")
            page.locator("#name").fill("Browser example")
            page.locator("#email").fill("example@example.com")
            page.locator("#message").fill("An unsent browser-only example message.")
            if width < 1024:
                control = page.get_by_role("combobox", name="What do you need?", exact=True)
                control.select_option("investor")
            else:
                page.get_by_role("radio", name="Investor enquiry", exact=True).check()
            expect(page.locator("#enquiry-form-title")).to_have_text("Investor enquiry")
            if width < 1024:
                control.select_option("support")
            else:
                page.get_by_role("radio", name="Support", exact=True).check()
            expect(page.locator("#enquiry-form-title")).to_have_text("Support")
            expect(page.locator("#name")).to_have_value("Browser example")
            expect(page.locator("#email")).to_have_value("example@example.com")
            expect(page.locator("#message")).to_have_value("An unsent browser-only example message.")
            faq = page.locator(".contact-faq details").first
            faq.locator("summary").focus()
            page.keyboard.press("Enter")
            expect(faq).to_have_attribute("open", "")
            check_crafted_state("contact-selection")
            page.keyboard.press("Enter")
            check(not faq.evaluate("n => n.open"), "FAQ did not close from keyboard")

        def password_visibility():
            page.goto(base + "/register/investor", wait_until="networkidle")
            page.get_by_role("button", name="Show password", exact=True).click()
            expect(page.locator("#password")).to_have_attribute("type", "text")
            expect(page.locator("#confirmPassword")).to_have_attribute("type", "password")
            page.get_by_role("button", name="Show password confirmation", exact=True).click()
            expect(page.locator("#confirmPassword")).to_have_attribute("type", "text")
            page.get_by_role("button", name="Hide password", exact=True).click()
            expect(page.locator("#password")).to_have_attribute("type", "password")
            expect(page.locator("#confirmPassword")).to_have_attribute("type", "text")
            check_crafted_state("registration-controls")

        def legal_copy():
            page.goto(base + "/legal", wait_until="networkidle")
            context.grant_permissions(["clipboard-read", "clipboard-write"], origin=base)
            for label in ["company registration number", "registered office"]:
                page.get_by_role("button", name="Copy " + label, exact=True).click()
                expect(page.get_by_role("button", name="Copied " + label, exact=True)).to_be_visible()
                value = page.evaluate("navigator.clipboard.readText()")
                check(bool(value.strip()), "Copy action wrote an empty value")
                expect(page.locator("main")).to_contain_text(value)
            check_crafted_state("legal-records")

        interaction("need to home explanatory journey", connection_journey)
        interaction("all three hero photograph states", photo_variants)
        interaction("company record copy controls", legal_copy)
        interaction("home evidence and response tabs", home_mission)
        interaction("solution layer responsibilities", solution_layers)
        interaction("partner stage filtering and reset", partner_stages)
        interaction("partner relationship selection", partner_connections)
        interaction("contact switching preserves unsent draft", contact_switch_preserves_draft)
        interaction("independent password visibility", password_visibility)

        interaction("section navigation", outline)
        interaction("partner search and reset", partner_search)
        interaction("partner keyboard tabs and diagram", journey)
        interaction("services tabs and preview", services)
        interaction("contact validation without submission", contact_validation)
        interaction("registration progress and password feedback", registration_feedback)
        interaction("contact enquiry deep links", contact_deep_links)
        if width == 390:
            interaction("home photo controls", photos)
            interaction("mobile menu focus return", mobile_menu)
        context.close()
    # The page navigation and progress also work with desktop motion enabled.
    motion_context = browser.new_context(viewport={"width": 1280, "height": 900}, reduced_motion="no-preference")
    motion_page = motion_context.new_page()
    try:
        motion_page.goto(base + "/about/", wait_until="networkidle")
        motion_page.get_by_role("navigation", name="On this page").get_by_role("link", name="What we do").click()
        motion_page.wait_for_function("new DOMMatrixReadOnly(getComputedStyle(document.querySelector('.reading-progress')).transform).a > 0")
        expect(motion_page.get_by_role("navigation", name="On this page").get_by_role("link", name="What we do")).to_have_attribute("aria-current", "location")
        report["interactions"].append({"name": "desktop motion and reading progress", "width": 1280, "status": "pass"})
    except Exception as error:
        report["failures"].append(f"Desktop motion: {error}")
    motion_context.close()
    browser.close()
server.shutdown()
(OUT / "report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
print(json.dumps({"pages": len(report["pages"]), "interactions": len(report["interactions"]), "failures": report["failures"]}, indent=2))
raise SystemExit(1 if report["failures"] else 0)

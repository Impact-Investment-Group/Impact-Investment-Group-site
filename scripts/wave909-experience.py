"""GitHub Actions browser checks and review images for the marketing site.

Uses the real static build. No enquiry or registration is ever submitted.
"""
import functools
import http.server
import json
import re
import threading
from urllib.parse import urlparse, parse_qs
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
paths = ["/", "/about", "/platform", "/pricing", "/the-problem", "/solutions", "/partners", "/contact", "/faqs", "/register", "/legal"]
paths += partners + ["/register/" + role for role in roles] + ["/this-route-does-not-exist"]


stock_snapshot = json.loads((ROOT / "src/data/public-property-stock.json").read_text(encoding="utf-8"))
data_providers = json.loads((ROOT / "scripts/fixtures/data-service-inventory.json").read_text(encoding="utf-8"))["providers"]
stock_fixture = {"as_of": "2026-11-05T09:00:00Z", "total": 4321, "regions": {"North West": {"count": 4000}, "London": {"count": 231}, "Northern Ireland": {"count": 0}, "Unmapped": {"count": 90}}, "basis": "Demonstration aggregate for browser verification."}
charity_pledge = "10% of all profits made go to Metro World Child UK to bring hope and joy to children today and change lives for tomorrow."
charity_capture_style = ".site-header,.page-outline,.back-to-top{visibility:hidden!important}"
def answer_stock(route):
    route.fulfill(status=200, content_type="application/json", headers={"Access-Control-Allow-Origin": "*"}, body=json.dumps(stock_fixture))


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
        context.route("**/public/showcase-counts*", answer_stock)
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
                lives = page.locator("span, figcaption").filter(has_text=re.compile(r"^\s*Transforming Lives\.?\s*$"))
                if not path.startswith("/register") and path != "/this-route-does-not-exist":
                    check(lives.count() > 0, "Expected the shared closing statement")
                for statement in lives.all():
                    check(statement.evaluate("n => getComputedStyle(n).color") == "rgb(38, 121, 119)", "Transforming Lives differs from the supplied teal")
                row["teal_statement_count"] = lives.count()
                charity_footer = page.locator("footer [data-charity-footer]")
                if path == "/this-route-does-not-exist":
                    expect(charity_footer).to_have_count(0)
                    expect(page.locator("footer")).to_have_count(0)
                    row["charity_footer"] = "standalone error page has no site footer"
                else:
                    email = page.locator('footer a[href="mailto:enquiries@impactig.co.uk"]')
                    expect(email).to_have_count(1)
                    expect(email).to_have_text("enquiries@impactig.co.uk")
                    check("enquires@impactig.co.uk" not in page.content(), "Retired enquiry address remains on the page")
                    expect(charity_footer).to_have_count(1)
                    expect(charity_footer.get_by_text(charity_pledge, exact=True)).to_be_visible()
                    charity_logo = charity_footer.get_by_role("img", name="Metro World Child", exact=True)
                    expect(charity_logo).to_have_attribute("src", "/images/charity/metro-world-child-80.png")
                    expect(charity_logo).to_be_visible()
                    expect(charity_footer.get_by_role("link", name="Read about our commitment", exact=True)).to_have_attribute("href", "/about#charity-impact")
                    row["charity_footer"] = "canonical pledge, original logo and commitment link"
                check(page.evaluate("document.documentElement.scrollWidth <= innerWidth + 1"), "Horizontal overflow")
                check(not re.search(r"\b(?:Peter|Petra|Pippa)\b", page.locator("body").inner_text()), "A retired mascot name remains on the page")
                expect(page.locator("img[src*='/images/ai-team/'], img[srcset*='/images/ai-team/']")).to_have_count(0)
                # Visit lazy images and sections before taking the complete reading view.
                page.evaluate("document.querySelectorAll('img[loading=lazy]').forEach(img => img.loading='eager')")
                page.wait_for_function("Array.from(document.images).every(img => img.complete)")
                broken = page.locator("img").evaluate_all("nodes => nodes.filter(n => !n.naturalWidth).map(n => n.src)")
                check(not broken, f"Broken images: {broken}")
                if path == "/":
                    page.locator("footer img[src*='logo-lockup']").screenshot(path=str(OUT / f"logo-footer-{width}.png"), animations="disabled")
                if path == "/about":
                    roster = page.get_by_role("list", name="Leadership team", exact=True)
                    members = roster.locator(":scope > li")
                    expect(members).to_have_count(6)
                    expect(roster.get_by_role("heading", level=3)).to_have_text([
                        "Israel Silgram", "Maria Avallone", "Laurie Hale", "Josh Howard", "Callum Saxon", "Tommy Lam"
                    ])
                    supplied = [
                        (0, "Israel Silgram", "Impact Director", "israel-silgram", []),
                        (2, "Laurie Hale", "Housing Manager", "laurie-hale", [
                            "20+ years in residential property management",
                            "Landlord & investor relations, portfolio growth, compliance and asset management",
                        ]),
                        (3, "Josh Howard", "Partnership Manager", "josh-howard", ["15+ years experience in strategic partnership management and contract growth"]),
                        (4, "Callum Saxon", "Chief Technology Officer", "callum-saxon-v2", []),
                        (5, "Tommy Lam", "Software Engineer & AI Specialist", "tommy-lam", ["Software engineering · AI & LLMs", "4 years professional experience"]),
                    ]
                    for index, name, role, portrait, credentials in supplied:
                        member = members.nth(index)
                        expect(member.get_by_text(role, exact=True)).to_be_visible()
                        expect(member.get_by_role("img", name=name + ", " + role, exact=True)).to_have_attribute("src", "/images/team/" + portrait + ".webp")
                        for credential in credentials:
                            expect(member.get_by_text(credential, exact=True)).to_be_visible()
                    text = page.locator("main").inner_text()
                    check(all(retired not in text for retired in ["Jonathan", "Shahab", "$100m"]), "Retired team member or fundraising claim remains")
                    rows = [round(member.bounding_box()["y"]) for member in members.all()]
                    check(len(set(rows)) == (6 if width == 390 else 2), "Team layout has an unexpected number of rows")
                    roster.screenshot(path=str(OUT / f"team-{width}.png"), animations="disabled", style=charity_capture_style)
                    row["team"] = "Six supplied profiles, current portraits and balanced rows"
                if path == "/platform":
                    page.locator("#platform-guides").scroll_into_view_if_needed()
                    page.evaluate("async () => { await Promise.all([...document.images].map(img => img.decode().catch(() => {}))); scrollTo({top:0,behavior:'instant'}); }")
                    page.wait_for_timeout(100)
                for figure in page.locator(".partner-craft-guides").all():
                    caption_top = figure.locator("figcaption").bounding_box()["y"]
                    for guide in figure.locator("img, [data-buddy-slot=page]").all():
                        box = guide.bounding_box()
                        check(box["y"] + box["height"] + 8 <= caption_top, "Guide artwork overlaps its caption")
                expect(page.locator("main [data-buddy-form]")).to_have_count(0)
                if path != "/this-route-does-not-exist":
                    expect(page.locator("[data-buddy-actor]")).to_have_count(1)
                    expect(page.locator("[data-buddy-form]")).to_have_count(1)
                    character = page.locator("[data-buddy-actor] [data-buddy-form]")
                    expect(character).to_have_attribute("data-buddy-version", "v4-vector")
                    expect(character).to_have_attribute("data-buddy-artwork", "vector")
                    expect(character).to_have_attribute("data-buddy-hands", "vector")
                    expect(character).to_have_attribute("data-buddy-status", "ready")
                    check(character.locator("canvas").evaluate("n => n.width > 0 && n.height > 0"), "Replacement Buddy artwork has no canvas size")
                    slot = page.locator('main [data-buddy-slot="page"]:visible').first
                    if slot.count():
                        slot.evaluate("node => {const b=node.getBoundingClientRect();scrollTo({top:scrollY+b.top+b.height/2-innerHeight*.46,behavior:'instant'})}")
                        expect(page.locator("[data-buddy-actor]")).to_have_attribute("data-buddy-placement", "page")
                        expect(page.locator("[data-buddy-form]")).to_have_count(1)
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
            expect(page.locator(".friendly-editorial")).to_have_count(0)
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
            page.locator("[data-services-more] > summary").click()
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

        def platform_role_guides():
            page.goto(base + "/platform", wait_until="networkidle")
            section = page.locator("#platform-guides")
            picker = page.locator("#platform-guide-role")
            expect(picker.locator('optgroup[label="Platform workspaces"] option')).to_have_count(12)
            expect(picker.locator('optgroup[label="Partner pathways"] option')).to_have_count(5)
            outline = page.get_by_role("navigation", name="On this page")
            if width == 390:
                outline.locator("summary").click()
            outline.get_by_role("link", name="Your role").click()
            expect(section).to_be_in_viewport()
            options = picker.locator("option").evaluate_all("nodes => nodes.map(n => ({id:n.value,label:n.textContent.trim()}))")
            reviewed_crop_keys = {"investor", "resident", "care-provider", "local-authority", "housing-association", "housing-provider"}
            captured_crops = set()
            for option in options:
                picker.select_option(option["id"])
                article = section.locator("article")
                expect(article).to_have_attribute("data-role", option["id"])
                expect(section.get_by_role("status")).to_contain_text("Step 1 of")
                expect(section.get_by_role("button", name="Previous", exact=True)).to_be_disabled()
                preview = section.locator('[data-testid="platform-guide-screenshot"]')
                preview.scroll_into_view_if_needed()
                expect(preview.locator("img")).to_be_visible()
                page.wait_for_function("document.querySelector('[data-testid=platform-guide-screenshot] img').naturalWidth === 1300")
                expect(article.locator("figcaption")).to_contain_text(re.compile("demonstration data", re.I))
                image_key = Path(preview.locator("img").get_attribute("src")).stem
                if image_key in reviewed_crop_keys and image_key not in captured_crops:
                    frame = preview.locator("[data-platform-guide-crop]")
                    expect(frame).to_have_attribute("data-platform-guide-crop", image_key)
                    check(frame.evaluate("n => getComputedStyle(n).overflow") == "hidden", "Retired assistant overlay is not clipped in the preview")
                    preview.click()
                    detail = page.get_by_role("dialog").locator("[data-platform-guide-crop]")
                    expect(detail).to_have_attribute("data-platform-guide-crop", image_key)
                    check(detail.evaluate("n => getComputedStyle(n).overflow") == "hidden", "Enlarged preview exposes the retired assistant overlay")
                    page.get_by_role("dialog").screenshot(path=str(OUT / f"platform-detail-{image_key}-{width}.png"), animations="disabled")
                    page.keyboard.press("Escape")
                    expect(preview).to_be_focused()
                    captured_crops.add(image_key)
                choices = section.get_by_role("navigation", name=option["label"] + " walkthrough steps").get_by_role("button")
                first_title = page.locator("#platform-guide-step-title").inner_text()
                rail = choices.first.locator("xpath=ancestor::nav")
                geometry = rail.evaluate("n => { const r=n.getBoundingClientRect(); return {left:r.left,right:r.right,steps:[...n.querySelectorAll('button')].map(b => { const box=b.getBoundingClientRect();return {title:b.textContent,left:box.left,right:box.right}; })}; }")
                check(all(b["left"] >= geometry["left"] - 1 and b["right"] <= geometry["right"] + 1 for b in geometry["steps"]), "Walkthrough steps clipped for " + option["id"] + ": " + json.dumps(geometry))
                check(choices.first.get_attribute("aria-current") == "step", "New role does not start at its first visible step: " + option["id"])
                choices.last.click()
                expect(choices.last).to_have_attribute("aria-current", "step")
                check(page.locator("#platform-guide-step-title").inner_text() != first_title, "Role walkthrough did not advance")
                expect(section.get_by_role("button", name="Next", exact=True)).to_be_disabled()
                section.get_by_role("button", name="Previous", exact=True).click()
                expect(section.get_by_role("button", name="Next", exact=True)).to_be_enabled()
                if article.get_attribute("data-kind") == "partner":
                    expect(section.get_by_role("link", name="Open this step in the platform", exact=True)).to_have_count(0)
                    expect(article.locator("figcaption")).to_contain_text("not a separate")
                check(page.evaluate("document.documentElement.scrollWidth <= innerWidth + 1"), "Role guide overflows")
            check(captured_crops == reviewed_crop_keys, "Not every retired-assistant screenshot received a detail view")
            picker.select_option("management-agent")
            screens = section.get_by_role("group", name="Management Agent screens").get_by_role("button")
            expect(screens).to_have_count(6)
            seen = set()
            for screen in screens.all():
                screen.click()
                expect(screen).to_have_attribute("aria-pressed", "true")
                page.wait_for_function("document.querySelector('[data-testid=platform-guide-screenshot] img').naturalWidth === 1300")
                seen.add(section.locator('[data-testid="platform-guide-screenshot"] img').get_attribute("src"))
            check(len(seen) == 6, "CRM screens reuse the same image")
            section.screenshot(path=str(OUT / f"platform-guides-crm-{width}.png"), animations="disabled", style="header,.page-outline,.back-to-top{visibility:hidden!important}")
            check_crafted_state("platform-role-guides")
            preview = section.locator('[data-testid="platform-guide-screenshot"]')
            preview.click()
            expect(page.get_by_role("dialog")).to_be_visible()
            expect(page.get_by_role("region", name="Full-size platform screenshot")).to_be_visible()
            page.get_by_role("dialog").screenshot(path=str(OUT / f"platform-guide-dialog-{width}.png"), animations="disabled")
            check_crafted_state("platform-guide-dialog")
            page.keyboard.press("Escape")
            expect(preview).to_be_focused()
            picker.select_option("investor")
            expect(section.get_by_role("status")).to_contain_text("Step 1 of")
            page.goto(base + "/platform#role-care-provider", wait_until="networkidle")
            expect(picker).to_have_value("care-provider")
            expect(section.locator("article")).to_have_attribute("data-role", "care-provider")

        def current_property_map():
            page.goto(base + "/", wait_until="networkidle")
            panel = page.locator("[data-property-map]")
            expect(panel.locator('[data-stock-status="current"]')).to_be_visible()
            expect(panel.locator("[data-property-total]")).to_have_text("4,321")
            picker = panel.locator("select[data-region-picker]")
            picker.select_option("London")
            expect(panel.locator("[data-region-count]")).to_have_text("231")
            expect(panel.locator('[data-region-marker="London"]')).to_have_attribute("data-selected", "true")
            expect(panel.locator("[data-stock-as-of]")).to_have_attribute("datetime", stock_fixture["as_of"])
            picker.select_option("Northern Ireland")
            expect(panel.locator("[data-region-count]")).to_have_text("0")
            picker.select_option("Unmapped")
            expect(panel.locator("[data-region-count]")).to_have_text("90")
            expect(panel.locator('[data-region-marker="Unmapped"]')).to_have_count(0)
            picker.select_option("North West")
            panel.screenshot(path=str(OUT / f"property-map-{width}.png"), animations="disabled", style="header,.page-outline,.back-to-top{visibility:hidden!important}")
            check_crafted_state("current-property-map")
            page.route("**/public/showcase-counts*", lambda route: route.fulfill(status=503, headers={"Access-Control-Allow-Origin":"*"}, body="unavailable"))
            page.reload(wait_until="networkidle")
            expect(panel.locator('[data-stock-status="unavailable"]')).to_contain_text("last recorded counts")
            expect(panel.locator("[data-property-total]")).to_have_text(f"{stock_snapshot['total']:,}")
            page.unroute("**/public/showcase-counts*")
            malformed = dict(stock_fixture, total=1)
            page.route("**/public/showcase-counts*", lambda route: route.fulfill(status=200, content_type="application/json", headers={"Access-Control-Allow-Origin":"*"}, body=json.dumps(malformed)))
            page.reload(wait_until="networkidle")
            expect(panel.locator('[data-stock-status="unavailable"]')).to_be_visible()
            expect(panel.locator("[data-property-total]")).to_have_text(f"{stock_snapshot['total']:,}")
            page.unroute("**/public/showcase-counts*")

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
            page.locator("#site-drawer").screenshot(path=str(OUT / f"logo-menu-{width}.png"), animations="disabled")
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

        def charity_commitment():
            states = [
                ("Everyday essentials", "Practical help for everyday needs"),
                ("Personal support", "A familiar face, week after week"),
                ("Learning and hope", "Encouragement for the future"),
            ]
            for path, label in [("/", "home"), ("/about", "about")]:
                page.goto(base + path, wait_until="networkidle")
                section = page.locator("#charity-impact")
                expect(section).to_have_count(1)
                expect(page.locator("#charity-impact-heading")).to_have_count(1)
                expect(section.get_by_role("heading", name="Helping children build brighter futures.", exact=True)).to_have_attribute("id", "charity-impact-heading")
                expect(section.get_by_text("10%", exact=True)).to_be_visible()
                expect(section.get_by_text("of our profits", exact=True)).to_be_visible()
                expect(section.get_by_text(charity_pledge, exact=True)).to_be_visible()
                cta = section.get_by_role("link", name="View the charity record (opens in a new tab)", exact=True)
                expect(cta).to_have_attribute("href", "https://register-of-charities.charitycommission.gov.uk/en/charity-search/-/charity-details/3963704")
                expect(section.get_by_text("Registered charity 1079863", exact=True)).to_be_visible()
                expect(cta).to_have_attribute("target", "_blank")
                check("noopener" in (cta.get_attribute("rel") or "").split(), "Charity link lacks noopener")
                group = section.get_by_role("group", name="How Metro World Child helps", exact=True)
                buttons = group.get_by_role("button")
                expect(buttons).to_have_count(3)
                panel = section.locator("#charity-work-detail")
                expect(panel).to_have_attribute("role", "region")
                expect(panel).to_have_attribute("aria-labelledby", "charity-work-title")
                expect(panel.locator("#charity-work-title")).to_have_text(states[0][1])
                section.locator("img").evaluate_all("nodes => nodes.forEach(img => img.loading='eager')")
                page.wait_for_function("() => [...document.querySelectorAll('#charity-impact img')].every(img => img.complete && img.naturalWidth > 0)")
                for index, (name, _) in enumerate(states):
                    button = group.get_by_role("button", name=name, exact=True)
                    expect(button).to_have_attribute("aria-controls", "charity-work-detail")
                    expect(button).to_have_attribute("aria-pressed", "true" if index == 0 else "false")
                descriptions = []
                for index, (name, title) in enumerate(states):
                    group.get_by_role("button", name=name, exact=True).click()
                    expect(panel.locator("#charity-work-title")).to_have_text(title)
                    expect(section.get_by_role("region", name=title, exact=True)).to_be_visible()
                    expect(group.locator('[aria-pressed="true"]')).to_have_count(1)
                    for other, (other_name, _) in enumerate(states):
                        expect(group.get_by_role("button", name=other_name, exact=True)).to_have_attribute("aria-pressed", "true" if other == index else "false")
                    description = " ".join(panel.locator("p").all_text_contents()).strip()
                    check(bool(description), "Charity work explanation is empty")
                    check(description not in descriptions, "Charity selection changed its title without replacing the explanation")
                    descriptions.append(description)
                    section.screenshot(path=str(OUT / f"charity-{label}-{index + 1}-{width}.png"), animations="disabled", style=charity_capture_style)
                    check_crafted_state(f"charity-{label}-{index + 1}")
                # These are ordinary toggle buttons, so native Tab, Space and
                # Enter must operate them without assuming tab-list semantics.
                buttons.first.focus()
                page.keyboard.press("Space")
                expect(buttons.first).to_have_attribute("aria-pressed", "true")
                expect(panel.locator("#charity-work-title")).to_have_text(states[0][1])
                page.keyboard.press("Tab")
                expect(buttons.nth(1)).to_be_focused()
                page.keyboard.press("Enter")
                expect(buttons.nth(1)).to_have_attribute("aria-pressed", "true")
                expect(panel.locator("#charity-work-title")).to_have_text(states[1][1])
                page.keyboard.press("Tab")
                expect(buttons.last).to_be_focused()
                page.keyboard.press("Space")
                expect(buttons.last).to_have_attribute("aria-pressed", "true")
                expect(panel.locator("#charity-work-title")).to_have_text(states[2][1])
                if path == "/about":
                    outline = page.get_by_role("navigation", name="On this page")
                    if width == 390:
                        outline.locator("summary").click()
                    link = outline.get_by_role("link", name="Giving back", exact=True)
                    expect(link).to_have_attribute("href", "#charity-impact")
                    link.click()
                    expect(section).to_be_in_viewport()
                    if width == 390:
                        expect(outline.locator("summary")).to_contain_text("Giving back")
                    else:
                        expect(link).to_have_attribute("aria-current", "location")
                else:
                    footer = page.locator("footer [data-charity-footer]")
                    footer.scroll_into_view_if_needed()
                    footer.screenshot(path=str(OUT / f"charity-footer-{width}.png"), animations="disabled", style=charity_capture_style)
                    footer.get_by_role("link", name="Read about our commitment", exact=True).click()
                    expect(page).to_have_url(re.compile(r"/about/?#charity-impact$"))
                    expect(page.locator("#charity-impact")).to_be_in_viewport()

        def home_mission():
            page.goto(base + "/", wait_until="networkidle")
            expect(page.locator(".hero-role-grid a")).to_have_count(10)
            plates = page.locator(".hero-role-grid .role-plate")
            expect(plates).to_have_count(10)
            check(plates.evaluate_all("nodes => nodes.every(n => {const b=n.getBoundingClientRect(),c=getComputedStyle(n).backgroundColor; return b.width >= 48 && b.height >= 48 && c !== 'transparent' && c !== 'rgba(0, 0, 0, 0)';})"), "Role icon tint or original size missing")
            check(plates.locator("svg").evaluate_all("nodes => nodes.every(n => ['rgb(20, 54, 106)', 'rgb(204, 74, 34)'].includes(getComputedStyle(n).color))"), "Role glyph is outside the navy/orange palette")
            expect(page.locator(".mission-friendly")).to_have_count(0)
            check(page.locator(".hero-panel figcaption.text-teal-600").evaluate("n => getComputedStyle(n).color") == "rgb(38, 121, 119)", "Hero sample teal changed")
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
            expect(page.get_by_text("Platform snapshot recorded 3 August 2026", exact=True)).to_have_count(0)
            expect(page.locator("[data-stock-as-of]")).to_have_attribute("datetime", stock_fixture["as_of"])

        def restored_home_layout():
            page.goto(base + "/", wait_until="networkidle")
            expect(page.locator(".connection-section, #connection-detail, #connection-heading")).to_have_count(0)
            expect(page.get_by_role("tablist", name="How the connection works")).to_have_count(0)
            expect(page.locator('a[href="#connection-heading"]')).to_have_count(0)
            expect(page.locator(".hero-panel")).to_have_count(3)
            sources = page.locator("#data-sources")
            sources.scroll_into_view_if_needed()
            lane = sources.locator(".logo-marquee")
            originals = lane.locator(".logo-marquee__track > :not([data-clone])")
            clones = lane.locator(".logo-marquee__track > [data-clone]")
            expect(originals).to_have_count(len(data_providers))
            expect(clones).to_have_count(len(data_providers))
            expected_credits = [provider["name"] + ": " + provider["blurb"] for provider in data_providers]
            check(originals.evaluate_all("nodes => nodes.map(n => n.title)") == expected_credits, "Data providers do not match the verified catalogue")
            check(lane.locator("ul li").all_text_contents()[1:] == expected_credits, "Data provider descriptions are not accessible")
            expect(sources.get_by_role("button")).to_have_count(0)
            page.wait_for_function("""() => {
              const lane=document.querySelector('#data-sources .logo-marquee'),box=lane.getBoundingClientRect();
              const visible=[...lane.querySelectorAll('img')].filter(n=>{const b=n.getBoundingClientRect();return b.width>0&&b.right>box.left+1&&b.left<box.right-1});
              return visible.length>0&&visible.every(n=>n.complete&&n.naturalWidth>0);
            }""")
            check(sources.locator("h3").evaluate("n => getComputedStyle(n).textAlign") == "center", "Data heading is not centred")
            check(sources.locator("p").evaluate("n => getComputedStyle(n).textAlign") == "center", "Data attribution is not centred")
            check(originals.evaluate_all("nodes => new Set(nodes.map(n => {const b=n.getBoundingClientRect();return `${b.width},${b.height}`;})).size === 1"), "Data logo display areas are inconsistent")
            check(originals.evaluate_all("nodes => nodes.every(n => {const b=n.getBoundingClientRect();return b.width>=224&&b.height>=112;})"), "Data logo plates are too small")
            check(originals.locator("img").evaluate_all("nodes => nodes.every(n => getComputedStyle(n).objectFit === 'contain')"), "Data logos are cropped or distorted")
            check(originals.evaluate_all("nodes => new Set(nodes.map(n => Math.round(n.getBoundingClientRect().top))).size === 1"), "Data providers are not a single carousel row")
            expect(sources).to_contain_text("Data used under licence. These publishers do not endorse this platform.")
            check_crafted_state("restored-home")

        def photo_variants():
            page.goto(base + "/", wait_until="networkidle")
            names = ["providing homes", "delivering support", "transforming lives"]
            for index, name in enumerate(names):
                if width < 768:
                    control = page.get_by_role("button", name="Show " + name, exact=True)
                    control.click()
                    expect(control).to_have_attribute("aria-pressed", "true")
                else:
                    expect(page.get_by_role("group", name="Photograph controls", include_hidden=True)).to_be_hidden()
                visible = page.locator(".hero-panel").nth(index)
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

        def zoopla_discovery():
            page.goto(base + "/", wait_until="networkidle")
            trigger = page.get_by_role("button", name="Powered by Zoopla", exact=True)
            reveal = page.locator("#zoopla-discovery")
            expect(trigger).to_have_attribute("aria-expanded", "false")
            check(96 <= trigger.locator("img").bounding_box()["width"] <= 116, "Zoopla logo is outside the compact size range")
            trigger_box = trigger.bounding_box()
            check(trigger_box["width"] <= 220 and 44 <= trigger_box["height"] <= 48, "Zoopla badge is oversized or its touch target is too small")
            check(trigger.evaluate("n => getComputedStyle(n).borderTopWidth === '0px' && getComputedStyle(n).boxShadow === 'none' && getComputedStyle(n).backgroundColor === 'rgba(0, 0, 0, 0)'"), "Zoopla attribution is boxed")
            trigger.hover()
            expect(trigger).to_have_attribute("aria-expanded", "true")
            expect(reveal).to_be_visible()
            expect(reveal).to_contain_text("Your next best investment could be right under your nose.")
            expect(reveal).to_contain_text("Explore the potential in on-market property.")
            box = reveal.bounding_box()
            check(box["x"] >= 0 and box["x"] + box["width"] <= width + 1, "Zoopla reveal leaves the viewport")
            check(reveal.evaluate("n => n.getAnimations({subtree:true}).every(a => a.playState !== 'running')"), "Reduced-motion reveal still animates")
            reveal.screenshot(path=str(OUT / f"zoopla-reveal-{width}.png"), animations="disabled")
            check_crafted_state("zoopla-discovery")
            page.mouse.move(0, 0)
            expect(trigger).to_have_attribute("aria-expanded", "false")
            trigger.focus()
            expect(trigger).to_have_attribute("aria-expanded", "true")
            page.keyboard.press("Escape")
            expect(trigger).to_have_attribute("aria-expanded", "false")
            expect(trigger).to_be_focused()
            page.keyboard.press("Enter")
            expect(trigger).to_have_attribute("aria-expanded", "true")
            page.keyboard.press("Tab")
            expect(reveal.get_by_role("link", name="See how the Property Finder works")).to_be_focused()
            expect(trigger).to_have_attribute("aria-expanded", "true")
            page.keyboard.press("Tab")
            expect(trigger).to_have_attribute("aria-expanded", "false")

        def faq_journey():
            page.goto(base + "/", wait_until="networkidle")
            preview = page.locator("#faqs")
            expect(preview.locator("details")).to_have_count(4 + min(2, len(json.loads((ROOT / "src/content/faq-community.json").read_text()))))
            preview.get_by_role("link", name="Explore all FAQs").click()
            expect(page).to_have_url(re.compile(r"/faqs/?$"))
            search = page.get_by_role("searchbox", name="Search frequently asked questions")
            search.fill("numbers honest")
            expect(page.locator("#faq-numbers summary")).to_contain_text("How do you keep the numbers honest?")
            row = page.locator("#faq-numbers")
            row.locator("summary").focus()
            page.keyboard.press("Enter")
            expect(row).to_have_attribute("open", "")
            expect(row.locator(".faq-answer")).to_contain_text("named source")
            page.keyboard.press("Enter")
            check(not row.evaluate("n => n.open"), "FAQ keyboard close failed")
            row.locator("summary").click()
            expect(row).to_have_attribute("open", "")
            search.fill("no-matching-question-975")
            expect(page.locator(".faq-results")).to_contain_text("No answers found")
            page.get_by_role("button", name="Clear FAQ search").click()
            expect(search).to_be_focused()
            expect(page.locator(".faq-item")).to_have_count(7 + len(json.loads((ROOT / "src/content/faq-community.json").read_text())))
            page.get_by_role("link", name="Ask a new question", exact=True).click()
            question = page.get_by_role("textbox", name="Your question", exact=True)
            page.get_by_role("link", name="Email my question", exact=True).click()
            expect(question).to_be_focused()
            expect(page.get_by_role("alert")).to_contain_text("at least 10 characters")
            sample = "Can a housing provider ask about a home & local needs?"
            question.fill(sample)
            consent = page.get_by_role("checkbox", name=re.compile("You may publish"))
            expect(consent).not_to_be_checked()
            email = page.get_by_role("link", name="Email my question", exact=True)
            link = urlparse(email.get_attribute("href"))
            check(link.scheme == "mailto" and link.path == "enquiries@impactig.co.uk", "Question is not addressed to the canonical enquiry mailbox")
            draft = parse_qs(link.query)
            check(sample in draft["body"][0] and "No, please reply privately only" in draft["body"][0], "Draft lost question or default private preference")
            check(draft["subject"] == ["Website FAQ question"], "Question lacks inbox subject")
            consent.check()
            draft = parse_qs(urlparse(email.get_attribute("href")).query)
            check("as an FAQ: Yes." in draft["body"][0], "Draft lost publication permission")
            context.grant_permissions(["clipboard-read", "clipboard-write"], origin=base)
            page.get_by_role("button", name="Copy question", exact=True).click()
            expect(page.locator("#ask-a-question [role=status]")).to_contain_text("Question copied")
            check(page.evaluate("navigator.clipboard.readText()") == draft["body"][0], "Copy differs from email draft")
            expect(page.locator("#ask-a-question")).to_contain_text("Nothing is sent or published automatically.")
            page.locator("#ask-a-question").screenshot(path=str(OUT / f"faq-question-{width}.png"), animations="disabled")
            check_crafted_state("faq-question")
            # Explicitly deny clipboard to exercise the webmail fallback.
            page.evaluate("() => { navigator.clipboard.writeText = async () => { throw new Error('denied') }; }")
            page.get_by_role("button", name="Copy question", exact=True).click()
            expect(page.locator("#ask-a-question [role=status]")).to_contain_text("Copy the full email draft")
            expect(page.get_by_role("textbox", name="Email draft", exact=True)).to_have_value(draft["body"][0])
            expect(page.get_by_role("textbox", name="Email draft", exact=True)).to_be_focused()
            expect(question).to_have_value(sample)
            page.goto(base + "/contact", wait_until="networkidle")
            page.locator(".contact-faq").get_by_role("link", name="Ask a new question").click()
            expect(page).to_have_url(re.compile(r"/faqs#ask-a-question$"))
            expect(page.locator("#ask-question-heading")).to_be_in_viewport()

        interaction("charity pledge, work selection, keyboard and commitment links", charity_commitment)
        interaction("FAQ search, disclosure, email draft and copy fallback", faq_journey)
        interaction("Zoopla hover, keyboard and reduced motion", zoopla_discovery)
        interaction("restored hero and centred data credits", restored_home_layout)
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
        interaction("all platform roles, walkthroughs and screen viewer", platform_role_guides)
        interaction("current property counts and unavailable fallback", current_property_map)
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
    try:
        motion_page.goto(base + "/", wait_until="networkidle")
        motion_page.get_by_role("button", name="Powered by Zoopla", exact=True).hover()
        expect(motion_page.locator("#zoopla-discovery")).to_be_visible()
        motion_page.wait_for_function("document.querySelector('#zoopla-discovery').getAnimations({subtree:true}).some(a => a.playState === 'running')")
        motion_page.wait_for_timeout(450)
        motion_page.locator("#zoopla-discovery").screenshot(path=str(OUT / "zoopla-motion-midpoint.png"))
        motion_page.wait_for_function("document.querySelector('#zoopla-discovery').getAnimations({subtree:true}).every(a => a.playState !== 'running')", timeout=5000)
        report["interactions"].append({"name": "Zoopla animation completes", "width": 1280, "status": "pass"})
    except Exception as error:
        report["failures"].append(f"Zoopla motion: {error}")
    motion_context.close()
    touch_context = browser.new_context(viewport={"width": 390, "height": 900}, has_touch=True, is_mobile=True, reduced_motion="reduce")
    touch_context.route("**/*", lambda route: route.abort() if route.request.method == "POST" else route.continue_())
    touch_page = touch_context.new_page()
    try:
        touch_page.goto(base + "/", wait_until="networkidle")
        trigger = touch_page.get_by_role("button", name="Powered by Zoopla", exact=True)
        trigger.tap()
        expect(trigger).to_have_attribute("aria-expanded", "true")
        expect(touch_page.locator("#zoopla-discovery")).to_be_visible()
        trigger.tap()
        expect(trigger).to_have_attribute("aria-expanded", "false")
        report["interactions"].append({"name": "Zoopla tap toggle", "width": 390, "status": "pass"})
    except Exception as error:
        report["failures"].append(f"Zoopla touch: {error}")
    touch_context.close()
    browser.close()
server.shutdown()
(OUT / "report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
print(json.dumps({"pages": len(report["pages"]), "interactions": len(report["interactions"]), "failures": report["failures"]}, indent=2))
raise SystemExit(1 if report["failures"] else 0)

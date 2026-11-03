"""CI-only proof of the public role ecosystem, using the actual static build."""
import functools
import http.server
import json
import threading
from pathlib import Path

from playwright.sync_api import expect, sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs/screenshots/wave921"
OUT.mkdir(parents=True, exist_ok=True)
ROLE_IDS = ["local-authority", "social-worker", "housing-association", "care-provider",
            "support-provider", "investor", "landlord", "developer", "broker", "resident", "co-sourcer"]


class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(Handler, directory=str(ROOT / "dist/client")))
threading.Thread(target=server.serve_forever, daemon=True).start()
base = f"http://127.0.0.1:{server.server_address[1]}"
report = {"views": [], "failures": []}


def check(condition, message):
    if not condition:
        raise AssertionError(message)


def audit(page):
    page.add_script_tag(path=str(ROOT / "node_modules/axe-core/axe.min.js"))
    result = page.evaluate("async () => await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})")
    check(not result["violations"], str([{"id": v["id"], "targets": [n["target"] for n in v["nodes"]]} for v in result["violations"]]))


with sync_playwright() as pw:
    browser = pw.chromium.launch()
    for width in [360, 390, 768, 1280]:
        errors = []
        row = {"width": width, "roles": []}
        context = browser.new_context(viewport={"width": width, "height": 900}, reduced_motion="reduce")
        context.route("**/*", lambda route: route.abort() if route.request.method == "POST" else route.continue_())
        page = context.new_page()
        page.on("pageerror", lambda error: errors.append(str(error)))
        try:
            page.goto(base + "/partners/", wait_until="networkidle")
            page.get_by_role("link", name="Explore the ecosystem", exact=True).click()
            expect(page).to_have_url(base + "/partners/#ecosystem-map")
            graph = page.get_by_role("group", name="Interactive role ecosystem")
            nodes = graph.locator("button[data-role]")
            check(nodes.count() == len(ROLE_IDS), "Not every public role appears exactly once")
            check(page.evaluate("document.documentElement.scrollWidth <= innerWidth+1"), "Page overflow")
            centre = graph.locator(".partner-ecosystem__centre")
            expect(centre).to_contain_text("ImpactInvestmentGroup")
            bounds = graph.bounding_box()
            hub = centre.bounding_box()
            check(abs(hub["x"] + hub["width"] / 2 - bounds["x"] - bounds["width"] / 2) < 2, "IIG is not centred")
            rectangles = [node.bounding_box() for node in nodes.all()] + [hub]
            for i, rect in enumerate(rectangles):
                check(rect["width"] >= 44 and rect["height"] >= 44, "Small map target")
                check(rect["x"] >= bounds["x"] and rect["x"] + rect["width"] <= bounds["x"] + bounds["width"], "Node clipped horizontally")
                check(rect["y"] >= bounds["y"] and rect["y"] + rect["height"] <= bounds["y"] + bounds["height"], "Node clipped vertically")
                for other in rectangles[i + 1:]:
                    overlaps = rect["x"] < other["x"] + other["width"] and rect["x"] + rect["width"] > other["x"] and rect["y"] < other["y"] + other["height"] and rect["y"] + rect["height"] > other["y"]
                    check(not overlaps, "Role nodes overlap each other or IIG")
            audit(page)
            graph.screenshot(path=str(OUT / f"ecosystem-{width}.png"), animations="disabled")
            page.screenshot(path=str(OUT / f"partners-{width}.png"), full_page=True, animations="disabled")

            for role_id in ROLE_IDS:
                trigger = graph.locator(f'button[data-role="{role_id}"]')
                trigger.focus()
                page.keyboard.press("Enter")
                dialog = page.get_by_role("dialog")
                expect(dialog).to_be_visible()
                check(dialog.locator("h2").inner_text().strip(), "Dialog has no heading")
                if role_id == "co-sourcer":
                    expect(dialog).to_contain_text("Source homes with us")
                    expect(dialog.get_by_role("link", name="Join as a co-sourcer")).to_have_attribute("href", "https://app.impactinvestmentgroup.co.uk/sourcer/join")
                else:
                    expect(dialog.get_by_role("heading", name="How you work with IIG")).to_be_visible()
                    check(dialog.locator("ol li").count() == 3, "Missing existing role steps")
                    expect(dialog.get_by_role("link", name="Explore this role")).to_have_attribute("href", f"/partner-with-{role_id}")
                check(page.evaluate("document.documentElement.scrollWidth <= innerWidth+1"), "Open dialog overflow")
                # Audit every role's real text, including the longest labels.
                audit(page)
                if role_id in ["investor", "resident", "co-sourcer"]:
                    dialog.screenshot(path=str(OUT / f"{role_id}-dialog-{width}.png"), animations="disabled")
                page.keyboard.press("Escape")
                expect(dialog).to_have_count(0)
                expect(trigger).to_be_focused()
                row["roles"].append(role_id)

            # Mouse/touch activation, focus containment and the real internal destination.
            graph.locator('button[data-role="investor"]').click()
            dialog = page.get_by_role("dialog")
            for _ in range(4):
                page.keyboard.press("Tab")
                check(dialog.evaluate("node => node.contains(document.activeElement)"), "Focus escaped the dialog")
            dialog.get_by_role("link", name="Explore this role").click()
            expect(page).to_have_url(base + "/partner-with-investor")
            expect(page.get_by_role("heading", level=1)).to_be_visible()
            check(not errors, f"Browser errors: {errors}")
            row["status"] = "pass"
        except Exception as error:
            row["status"] = "fail"
            row["error"] = str(error)
            report["failures"].append(f"{width}: {error}")
            page.screenshot(path=str(OUT / f"failure-{width}.png"), full_page=True)
        finally:
            report["views"].append(row)
            context.close()
            print(json.dumps(row), flush=True)
    browser.close()
server.shutdown()
(OUT / "report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
raise SystemExit(1 if report["failures"] else 0)

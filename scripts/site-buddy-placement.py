"""CI-only single-actor travel, route continuity and accessibility evidence."""
import functools
import http.server
import json
from pathlib import Path
import threading
from urllib.parse import urlparse

from playwright.sync_api import expect, sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs/screenshots/wave909/buddy-placement"
OUT.mkdir(parents=True, exist_ok=True)


class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(Handler, directory=str(ROOT / "dist/client")))
threading.Thread(target=server.serve_forever, daemon=True).start()
BASE = f"http://127.0.0.1:{server.server_address[1]}"
REPORT = []


def requests(route):
    request = route.request
    if urlparse(request.url).path == "/public/buddy/status":
        route.fulfill(status=200, content_type="application/json", headers={"Access-Control-Allow-Origin": "*"}, body='{"configured":true}')
    elif request.url.startswith(BASE) and request.method == "GET":
        route.continue_()
    else:
        route.abort()


def one_actor(page, placement):
    expect(page.locator("[data-buddy-actor]")).to_have_count(1)
    expect(page.locator("[data-buddy-form]")).to_have_count(1)
    expect(page.locator("[data-buddy-form] canvas")).to_have_count(1)
    expect(page.locator("[data-buddy-actor]")).to_have_attribute("data-buddy-placement", placement)
    assert page.evaluate("window.__buddyActorCanvas === document.querySelector('[data-buddy-actor] canvas')"), "Travel or chat replaced the persistent actor"
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth + 1"), "Actor introduced page overflow"


def settled_in_slot(page, kind):
    try:
        page.wait_for_function("""kind => {
          const actor = document.querySelector('[data-buddy-actor]');
          const slot = document.querySelector(`[data-buddy-slot='${kind}'][data-buddy-occupied]`);
          if (!actor || !slot || actor.dataset.buddyTravelling !== 'false') return false;
          const a = actor.getBoundingClientRect(), s = slot.getBoundingClientRect();
          return Math.abs(a.x + a.width / 2 - s.x - s.width / 2) < 1 &&
            Math.abs(a.y + a.height / 2 - s.y - s.height / 2) < 1;
        }""", arg=kind)
    except Exception:
        evidence = page.evaluate("""() => ({scrollY, width:innerWidth, height:innerHeight,
          elements:[...document.querySelectorAll('[data-buddy-actor], [data-buddy-slot]')].map(el => ({
            data:{...el.dataset}, rect:el.getBoundingClientRect().toJSON(),
            visibility:getComputedStyle(el).visibility, display:getComputedStyle(el).display
          }))})""")
        name = f"failure-{page.viewport_size['width']}-{kind}"
        (OUT / f"{name}.json").write_text(json.dumps(evidence, indent=2), encoding="utf-8")
        page.screenshot(path=str(OUT / f"{name}.png"))
        raise


with sync_playwright() as playwright:
    browser = playwright.chromium.launch()
    try:
        for width in (390, 768, 1280):
            for reduced in (False, True):
                context = browser.new_context(viewport={"width": width, "height": 844}, reduced_motion="reduce" if reduced else "no-preference")
                context.route("**/*", requests)
                page = context.new_page()
                page.goto(BASE + "/platform", wait_until="networkidle")
                page.wait_for_selector('[data-buddy-actor] [data-buddy-status="ready"]')
                page.evaluate("window.__buddyActorCanvas = document.querySelector('[data-buddy-actor] canvas')")
                one_actor(page, "corner")
                showcase = page.locator('[data-buddy-showcase] [data-buddy-slot="page"]')
                showcase.evaluate("el => el.scrollIntoView({block:'center', behavior:'instant'})")
                if not reduced:
                    page.wait_for_function("document.querySelector('[data-buddy-actor]').dataset.buddyTravelling === 'true'")
                settled_in_slot(page, "page")
                one_actor(page, "page")
                page.locator("[data-buddy-showcase]").get_by_role("button", name="Care & support", exact=True).click()
                expect(page.locator("[data-buddy-actor] [data-buddy-form]")).to_have_attribute("data-buddy-form", "support")
                page.wait_for_timeout(3400 if not reduced else 100)
                # On a phone the controls sit below the illustration. Clicking
                # them can scroll its slot out of view, correctly returning Buddy
                # to the corner. Put the page destination back in the reading area
                # before asserting the subsequent chat-to-page return.
                showcase.evaluate("el => el.scrollIntoView({block:'center', behavior:'instant'})")
                settled_in_slot(page, "page")
                one_actor(page, "page")
                page.screenshot(path=str(OUT / f"page-{width}-{'reduced' if reduced else 'motion'}.png"))
                page.locator("[data-buddy-launcher]").click()
                expect(page.locator("[data-buddy-chat]")).to_be_visible()
                settled_in_slot(page, "chat")
                one_actor(page, "chat")
                assert abs(page.locator("[data-buddy-actor]").bounding_box()["width"] - 48) < 1, "Chat avatar did not fit its header"
                page.get_by_label("Your question for Buddy", exact=True).fill("Retain this draft while Buddy travels.")
                page.locator("[data-buddy-chat]").get_by_role("button", name="Close Buddy", exact=True).click()
                settled_in_slot(page, "page")
                one_actor(page, "page")
                page.locator("[data-buddy-launcher]").click()
                expect(page.get_by_label("Your question for Buddy", exact=True)).to_have_value("Retain this draft while Buddy travels.")
                page.locator("[data-buddy-chat]").get_by_role("button", name="Close Buddy", exact=True).click()
                page.evaluate("scrollTo({top:0,behavior:'instant'})")
                settled_in_slot(page, "corner")
                one_actor(page, "corner")
                page.get_by_role("button", name="Minimize Buddy", exact=True).click()
                expect(page.locator("[data-buddy-actor]")).to_be_hidden()
                showcase.evaluate("el => el.scrollIntoView({block:'center', behavior:'instant'})")
                expect(page.locator("[data-buddy-actor]")).to_be_hidden()
                page.get_by_role("button", name="Show Buddy", exact=True).click()
                settled_in_slot(page, "page")
                one_actor(page, "page")
                page.locator('a[href="/contact"]').first.evaluate("el => el.click()")
                page.wait_for_url("**/contact")
                expect(page.locator('h1')).to_be_visible()
                assert page.evaluate("window.__buddyActorCanvas === document.querySelector('[data-buddy-actor] canvas')"), "Client navigation replaced Buddy"
                expect(page.locator("[data-buddy-form]")).to_have_count(1)
                page.goto(BASE + "/solutions", wait_until="networkidle")
                page.wait_for_selector('[data-buddy-actor] [data-buddy-status="ready"]')
                page.evaluate("window.__buddyActorCanvas = document.querySelector('[data-buddy-actor] canvas')")
                expect(page.locator('img[src*="solution/trio"]')).to_have_count(0)
                solution_slots = page.locator('[data-buddy-slot="page"]')
                expect(solution_slots).to_have_count(2)
                for index, form in enumerate(("property", "investment")):
                    solution_slots.nth(index).evaluate("el => el.scrollIntoView({block:'center', behavior:'instant'})")
                    settled_in_slot(page, "page")
                    expect(solution_slots.nth(index)).to_have_attribute("data-buddy-occupied", "true")
                    expect(page.locator("[data-buddy-actor] [data-buddy-form]")).to_have_attribute("data-buddy-form", form)
                    one_actor(page, "page")
                page.screenshot(path=str(OUT / f"solutions-{width}-{'reduced' if reduced else 'motion'}.png"))
                page.goto(BASE + "/partners", wait_until="networkidle")
                page.wait_for_selector('[data-buddy-actor] [data-buddy-status="ready"]')
                page.evaluate("window.__buddyActorCanvas = document.querySelector('[data-buddy-actor] canvas')")
                trigger = page.locator('[data-role="investor"]')
                trigger.focus()
                page.keyboard.press("Enter")
                expect(page.get_by_role("dialog")).to_be_visible()
                expect(page.locator("[data-buddy-actor]")).to_be_hidden()
                expect(page.locator("[data-buddy-actor]")).to_have_attribute("data-buddy-suspended", "modal")
                expect(page.locator("[data-buddy-actor] [data-buddy-form]")).to_have_attribute("data-buddy-motion", "off")
                assert page.evaluate("window.__buddyActorCanvas === document.querySelector('[data-buddy-actor] canvas')"), "An unrelated modal replaced the actor"
                page.keyboard.press("Escape")
                expect(page.get_by_role("dialog")).to_have_count(0)
                expect(page.locator("[data-buddy-actor]")).to_be_visible()
                expect(page.locator("[data-buddy-actor]")).to_have_attribute("data-buddy-suspended", "none")
                assert page.evaluate("window.__buddyActorCanvas === document.querySelector('[data-buddy-actor] canvas')"), "Closing an unrelated modal remounted the actor"
                expect(trigger).to_be_focused()
                REPORT.append({"width": width, "reduced_motion": reduced, "single_actor": True, "chat_and_route_continuity": True, "unrelated_modal_suspension": True})
                context.close()
    finally:
        browser.close()
        server.shutdown()
        (OUT / "report.json").write_text(json.dumps(REPORT, indent=2), encoding="utf-8")
print(json.dumps(REPORT, indent=2))

"""CI-only Buddy browser journeys. All AI responses are explicit local fixtures."""
import argparse
import functools
import hashlib
import http.server
import json
import re
from pathlib import Path
import threading
from urllib.parse import urlparse

from playwright.sync_api import sync_playwright, expect

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--case', action='append', default=[], help='Run only this named journey (repeatable). Default: all.')
parser.add_argument('--width', action='append', type=int, choices=(320, 390, 768, 1280), default=[], help='Run only this viewport width (repeatable). Default: all.')
ARGS = parser.parse_args()

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs/screenshots/wave909/buddy"
OUT.mkdir(parents=True, exist_ok=True)


class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


server = http.server.ThreadingHTTPServer(
    ("127.0.0.1", 0),
    functools.partial(Handler, directory=str(ROOT / "dist/client")),
)
threading.Thread(target=server.serve_forever, daemon=True).start()
BASE = f"http://127.0.0.1:{server.server_address[1]}"
REPORT = {"checks": [], "failures": [], "ai_mode": "mocked local responses only"}
if ARGS.case or ARGS.width:
    REPORT['selection'] = {'cases': ARGS.case or 'all', 'widths': ARGS.width or 'all'}
V2_ATLAS_SIZE = 219614
V2_ATLAS_SHA256 = "63ccd2d7b230b116b2f44225c546f07bab811551a175c7792ad58894fadc45b2"
V2_ATLAS_PATH = "/images/buddy/atlas-v2.webp"
CORS = {"Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Allow-Methods": "GET, POST, OPTIONS"}
INIT = """(() => {
  window.__buddyDraws = 0;
  window.__buddyShowcaseDraws = 0;
  const clearRect = CanvasRenderingContext2D.prototype.clearRect;
  CanvasRenderingContext2D.prototype.clearRect = function (...args) {
    if (this.canvas.closest('[data-buddy-form]')) window.__buddyDraws++;
    if (this.canvas.closest('[data-buddy-showcase]')) window.__buddyShowcaseDraws++;
    return clearRect.apply(this, args);
  };
  window.__buddyFetchOptions = [];
  window.__buddyRequestAborted = 0;
  window.__buddyIgnoreAbort = false;
  window.__buddyStatusOptions = [];
  window.__buddyStatusAborted = 0;
  window.__buddyIgnoreStatusAbort = false;
  const fetch = window.fetch.bind(window);
  window.fetch = (url, options) => {
    if (String(url).endsWith('/public/buddy')) {
      window.__buddyFetchOptions.push({credentials: options?.credentials, hasSignal: options?.signal instanceof AbortSignal});
      options?.signal?.addEventListener('abort', () => window.__buddyRequestAborted++);
      // This fixture simulates a transport completing after cancellation.
      if (window.__buddyIgnoreAbort) options = {...options, signal: undefined};
    }
    if (String(url).endsWith('/public/buddy/status')) {
      window.__buddyStatusOptions.push({method: options?.method, credentials: options?.credentials, cache: options?.cache, hasSignal: options?.signal instanceof AbortSignal});
      options?.signal?.addEventListener('abort', () => window.__buddyStatusAborted++);
      if (window.__buddyIgnoreStatusAbort) options = {...options, signal: undefined};
    }
    return fetch(url, options);
  };
})()"""


class Fixtures:
    def __init__(self, fail_atlas=False):
        self.queue = []
        self.requests = []
        self.pending = []
        self.status_queue = []
        self.status_requests = []
        self.pending_status = []
        self.unexpected_posts = []
        self.atlas_requests = []
        self.chat_chunks = []
        self.fail_atlas = fail_atlas

    def answer(self, reply, **extra):
        self.queue.append({"status": 200, "body": {"used_ai": True, "reply": reply, **extra}})

    def fulfill(self, route, payload):
        route.fulfill(status=payload.get("status", 200), content_type="application/json", headers=CORS, body=json.dumps(payload.get("body", {})))

    def handle(self, route):
        request = route.request
        path = urlparse(request.url).path
        if path == V2_ATLAS_PATH:
            self.atlas_requests.append(request.url)
        if "buddy-assistant" in path and path.endswith(".js"):
            self.chat_chunks.append(request.url)
        if path == "/public/buddy/status":
            if request.method == "OPTIONS":
                route.fulfill(status=204, headers=CORS)
                return
            assert request.method == "GET", f"Unexpected readiness method: {request.method}"
            self.status_requests.append(request.url)
            response = self.status_queue.pop(0) if self.status_queue else {"body": {"configured": True}}
            if response.get("pending"):
                self.pending_status.append(route)
            else:
                self.fulfill(route, response)
            return
        if path == "/public/buddy":
            if request.method == "OPTIONS":
                route.fulfill(status=204, headers=CORS)
                return
            assert request.method == "POST", f"Unexpected Buddy method: {request.method}"
            self.requests.append(request.post_data_json)
            assert self.queue, "Unexpected AI call: no fixture was scheduled"
            response = self.queue.pop(0)
            if response.get("pending"):
                self.pending.append(route)
            else:
                self.fulfill(route, response)
            return
        if request.method == "POST":
            self.unexpected_posts.append(request.url)
            route.abort()
        elif self.fail_atlas and path == V2_ATLAS_PATH:
            route.abort()
        elif request.url.startswith(BASE + "/"):
            route.continue_()
        else:
            # No live API or external model request is needed by these tests.
            route.abort()


def context_for(browser, width=1280, reduced=False, fail_atlas=False):
    context = browser.new_context(viewport={"width": width, "height": 900}, reduced_motion="reduce" if reduced else "no-preference")
    fixtures = Fixtures(fail_atlas=fail_atlas)
    context.route("**/*", fixtures.handle)
    context.add_init_script(INIT)
    return context, fixtures


def visit(page, path="/"):
    page.goto(BASE + path, wait_until="networkidle")
    expect(page.locator("[data-buddy-launcher]")).to_be_visible()


def chat_open(page):
    page.locator("[data-buddy-launcher]").click()
    chat = page.locator("[data-buddy-chat]")
    expect(chat).to_be_visible()
    expect(page.locator("[data-buddy-widget]:visible")).to_have_count(0)
    expect(page.locator("[data-buddy-launcher]:visible")).to_have_count(0)
    expect(chat).to_have_attribute("data-buddy-readiness", "ready")
    expect(chat.get_by_role("group", name="Conversation topic")).to_have_count(0)
    expect(chat.get_by_role("log", name="Conversation with Buddy")).to_have_count(1)
    expect(chat.get_by_label("Your question for Buddy", exact=True)).to_be_focused()
    return chat


def assert_fixed_widget(page):
    widget = page.locator("[data-buddy-widget]")
    expect(widget).to_be_visible()
    assert widget.evaluate("n => getComputedStyle(n).position") == "fixed", "Buddy is in page flow instead of floating"
    box = widget.bounding_box()
    width, height = page.viewport_size["width"], page.viewport_size["height"]
    assert box["x"] >= 0 and box["y"] >= 0, "Buddy is clipped above or left of the viewport"
    assert 0 <= width - box["x"] - box["width"] <= 40, "Buddy is not at the right edge"
    assert 0 <= height - box["y"] - box["height"] <= 120, "Buddy is not near the bottom edge"
    assert box["width"] <= 210 and box["height"] <= 250, "Floating Buddy has become a page-sized placement"
    for control in widget.get_by_role("button").all():
        control_box = control.bounding_box()
        assert control_box["width"] >= 44 and control_box["height"] >= 44, "Buddy control misses the 44px touch target"
    return box


def assert_canvas_artwork(character):
    canvas = character.locator("canvas")
    expect(canvas).to_be_visible()
    expect(canvas).to_have_count(1)
    expect(character).to_have_attribute("data-buddy-version", "v2-refined")
    expect(character).to_have_attribute("data-buddy-hands", "v3")
    assert canvas.evaluate("n => n.getContext('2d').getImageData(0, 0, n.width, n.height).data.some((v, i) => i % 4 === 3 && v > 0)"), "Buddy's canvas is blank"
    return canvas


def send(chat, question):
    chat.get_by_label("Your question for Buddy", exact=True).fill(question)
    chat.get_by_role("button", name="Send", exact=True).click()


def no_overflow(page):
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth + 1"), "Document overflows horizontally"
    chat = page.locator("[data-buddy-chat]")
    if chat.count():
        bounds = chat.bounding_box()
        assert bounds["x"] >= -1 and bounds["x"] + bounds["width"] <= page.viewport_size["width"] + 1, "Buddy dialog exceeds the viewport"
        assert chat.evaluate("n => n.scrollWidth <= n.clientWidth + 1"), "Buddy dialog content overflows"
        send_box = chat.get_by_role("button", name="Send", exact=True).bounding_box()
        assert send_box["y"] >= 0 and send_box["y"] + send_box["height"] <= page.viewport_size["height"] + 1, "Composer is clipped"


def floating_placement_and_minimise(page, fixtures):
    visit(page)
    # Keep the original homepage content and photo-led structure. Buddy belongs
    # outside main; neither a new hero nor an in-page mascot section may return.
    expect(page.locator("main [data-buddy-form], main [data-buddy-showcase], [data-buddy-explorer], #meet-buddy")).to_have_count(0)
    expect(page.locator(".hero-band")).to_have_count(1)
    expect(page.locator("#mission-heading")).to_have_count(1)
    expect(page.locator("#demand-heading")).to_have_count(1)
    expect(page.locator("[data-property-map]")).to_have_count(1)
    expect(page.locator("[data-buddy-form]")).to_have_count(1)
    assert_canvas_artwork(page.locator("[data-buddy-widget] [data-buddy-form]"))
    assert fixtures.atlas_requests, "The floating character did not request its artwork"
    assert not fixtures.chat_chunks, "The assistant dialog loaded before it was opened"
    assert not fixtures.status_requests and not fixtures.requests, "Initial page load called the AI service"
    initial = assert_fixed_widget(page)
    page.screenshot(path=str(OUT / f"home-original-layout-{page.viewport_size['width']}.png"))
    page.evaluate("scrollTo({top:document.documentElement.scrollHeight, behavior:'instant'})")
    page.wait_for_timeout(150)
    scrolled = assert_fixed_widget(page)
    assert abs(scrolled["y"] - initial["y"]) < 1, "Buddy scrolls away with the page"
    page.get_by_role("button", name="Minimize Buddy", exact=True).click()
    expect(page.locator("[data-buddy-launcher]:visible")).to_have_count(0)
    expect(page.locator("[data-buddy-form]:visible")).to_have_count(0)
    reopen = page.get_by_role("button", name="Show Buddy", exact=True)
    expect(reopen).to_be_visible()
    expect(reopen).to_be_focused()
    page.wait_for_timeout(100)
    draws = page.evaluate("window.__buddyDraws")
    page.wait_for_timeout(250)
    assert page.evaluate("window.__buddyDraws") == draws, "Minimised Buddy kept drawing hidden artwork"
    page.keyboard.press("Enter")
    expect(page.locator("[data-buddy-launcher]")).to_be_visible()
    expect(page.locator("[data-buddy-launcher]")).to_be_focused()
    assert_fixed_widget(page)
    assert not fixtures.chat_chunks and not fixtures.status_requests, "Minimising/reopening loaded the chat or called its API"
    page.screenshot(path=str(OUT / f"floating-home-{page.viewport_size['width']}.png"))
    chat = chat_open(page)
    assert fixtures.chat_chunks, "Opening Buddy did not load its deferred chat module"
    expect(page.locator("[data-buddy-form]:visible")).to_have_count(1)
    assert not fixtures.requests, "Opening Buddy sent a question"
    expect(chat).not_to_have_attribute("aria-modal", "true")
    outside_focused = False
    for _ in range(24):
        page.keyboard.press("Tab")
        outside_focused = page.evaluate("""(() => {
          const active = document.activeElement;
          return Boolean(active && active !== document.body &&
            !active.closest('[data-buddy-chat]') &&
            !active.hasAttribute('data-radix-focus-guard'));
        })()""")
        if outside_focused:
            break
    assert outside_focused, "Non-modal Buddy trapped keyboard focus"
    expect(chat).to_be_visible()
    close = chat.get_by_role("button", name="Close Buddy", exact=True)
    close.focus()
    page.keyboard.press("Tab")
    expect(chat.get_by_role("button", name="How does Impact Investment Group source and connect suitable properties?", exact=True)).to_be_focused()
    close.focus()
    page.keyboard.press("Shift+Tab")
    assert page.evaluate("""(() => {
      const active = document.activeElement;
      return Boolean(active && active !== document.body &&
        !active.closest('[data-buddy-chat]') &&
        !active.hasAttribute('data-radix-focus-guard'));
    })()"""), "Shift+Tab looped back into the non-modal chat"
    expect(chat).to_be_visible()
    # Exercise a real page control outside the panel. On phones the header
    # remains exposed while the panel physically covers the mission tabs.
    # Larger widths also exercise the existing page-body interaction.
    if page.viewport_size["width"] < 640:
        page.evaluate("scrollTo({top: 0, behavior: 'instant'})")
        menu_button = page.locator("header.site-header").get_by_role("button", name="Open menu", exact=True)
        expect(menu_button).to_be_in_viewport()
        menu_bounds = menu_button.bounding_box()
        chat_bounds = chat.bounding_box()
        assert menu_bounds["y"] >= 0 and menu_bounds["y"] + menu_bounds["height"] <= chat_bounds["y"], "Buddy covers the phone's header control"
        assert menu_button.evaluate("n => { const r=n.getBoundingClientRect(); return n.contains(document.elementFromPoint(r.x+r.width/2, r.y+r.height/2)); }"), "The phone's menu target is covered"
        menu_button.click()
        menu = page.get_by_role("dialog", name="Site menu", exact=True)
        expect(menu).to_be_visible()
        expect(chat).to_be_visible()
        menu.get_by_role("button", name="Close menu", exact=True).click()
        expect(menu).to_have_count(0)
        expect(menu_button).to_be_focused()
    else:
        mission_tab = page.locator("#mission-tab-response")
        mission_tab.evaluate("n => scrollTo({top: scrollY + n.getBoundingClientRect().top - 120, behavior: 'instant'})")
        mission_tab.click()
        expect(mission_tab).to_have_attribute("aria-selected", "true")
        expect(page.locator("#mission-panel-response")).to_be_visible()
    expect(page.locator("main [data-buddy-form], main img[src*='/images/ai-team/']")).to_have_count(0)
    expect(chat).to_be_visible()
    assert not fixtures.requests, "Using the page while Buddy was open sent an AI question"
    page.keyboard.press("Escape")
    expect(chat).to_have_count(0)
    expect(page.locator("[data-buddy-launcher]")).to_be_focused()
    assert_fixed_widget(page)
    no_overflow(page)


def services_showcase_and_topics(page, fixtures):
    visit(page, "/platform/")
    showcase = page.locator("[data-buddy-showcase]")
    expect(showcase).to_have_count(1)
    expect(page.locator("main [data-buddy-form]")).to_have_count(1)
    showcase.scroll_into_view_if_needed()
    character = showcase.locator("[data-buddy-form]")
    canvas = assert_canvas_artwork(character)
    float_box = page.locator("[data-buddy-widget] [data-buddy-form]").bounding_box()
    stage = character.bounding_box()
    assert stage["width"] > float_box["width"] * 1.3, "Services Buddy is not the single larger showcase"
    page.evaluate("window.__initialBuddyCanvas = document.querySelector('[data-buddy-showcase] canvas')")
    initial_pixels = canvas.evaluate("n => n.toDataURL()")
    controls = showcase.get_by_role("group", name="Explore Buddy's forms")
    expect(controls.get_by_role("button")).to_have_count(3)
    costs = controls.get_by_role("button", name="Costs", exact=True)
    costs.focus()
    page.keyboard.press("Enter")
    expect(costs).to_have_attribute("aria-pressed", "true")
    expect(character).to_have_attribute("data-buddy-form", "investment")
    page.wait_for_timeout(2400)
    assert canvas.evaluate("n => n.toDataURL()") != initial_pixels, "Changing form did not change the rendered artwork"
    assert page.evaluate("window.__initialBuddyCanvas === document.querySelector('[data-buddy-showcase] canvas')"), "Selecting a form replaced the character canvas"
    assert abs(character.bounding_box()["height"] - stage["height"]) < 1, "Changing form shifted the reserved character stage"
    page.keyboard.press("Tab")
    support = controls.get_by_role("button", name="Care & support", exact=True)
    expect(support).to_be_focused()
    page.keyboard.press("Space")
    expect(character).to_have_attribute("data-buddy-form", "support")
    expect(support).to_have_attribute("aria-pressed", "true")
    trigger = showcase.get_by_role("button", name="Open Buddy", exact=True)
    trigger.click()
    chat = page.locator("[data-buddy-chat]")
    expect(chat).to_have_attribute("data-buddy-readiness", "ready")
    expect(chat.locator("[data-buddy-form]")).to_have_attribute("data-buddy-form", "support")
    expect(chat.get_by_role("group", name="Conversation topic")).to_have_count(0)
    expect(page.locator("[data-buddy-widget]:visible")).to_have_count(0)
    assert not fixtures.requests, "The services showcase sent a question without a user action"
    page.keyboard.press("Escape")
    expect(chat).to_have_count(0)
    expect(trigger).to_be_focused()
    # A complete form transition, gesture and settle blend can take longer
    # than a single gesture. Wait for bounded stillness, then verify it lasts.
    character.scroll_into_view_if_needed()
    page.evaluate("window.__buddySettleSample = {draws: window.__buddyShowcaseDraws, at: performance.now()}")
    page.wait_for_function("""() => {
      const sample = window.__buddySettleSample;
      if (sample.draws !== window.__buddyShowcaseDraws) {
        sample.draws = window.__buddyShowcaseDraws;
        sample.at = performance.now();
      }
      return performance.now() - sample.at >= 500;
    }""", timeout=10000, polling=100)
    draws = page.evaluate("window.__buddyShowcaseDraws")
    page.wait_for_timeout(500)
    assert page.evaluate("window.__buddyShowcaseDraws") - draws < 4, "The services showcase retained an idle animation loop"
    showcase.screenshot(path=str(OUT / f"services-showcase-{page.viewport_size['width']}.png"), animations="disabled")
    # The showcase must stay confined to Services, including after navigation.
    for path in ("/", "/pricing/", "/partners/"):
        visit(page, path)
        expect(page.locator("[data-buddy-showcase]")).to_have_count(0)
        if path == "/":
            expect(page.locator("main [data-buddy-form]")).to_have_count(0)
        assert_fixed_widget(page)
        no_overflow(page)


def real_fetch_contract(page, fixtures):
    visit(page)
    chat = chat_open(page)
    character = chat.locator('[data-buddy-form]')
    canvas = assert_canvas_artwork(character)
    expect(character).to_have_attribute('data-buddy-form', 'property')
    page.evaluate("window.__chatBuddyCanvas = document.querySelector('[data-buddy-chat] canvas')")
    first_pixels = canvas.evaluate("n => n.toDataURL()")
    first_box = character.bounding_box()
    fixtures.queue.append({"pending": True})
    first_question = "What does the sourcing service include?"
    chat.get_by_label("Your question for Buddy", exact=True).fill(first_question)
    expect(chat).to_have_attribute('data-buddy-activity', 'listen')
    chat.get_by_role("button", name="Send", exact=True).click()
    expect(chat).to_have_attribute('data-buddy-activity', 'think')
    expect(chat.get_by_role("status")).to_contain_text("Buddy is thinking")
    expect(chat.locator('[data-buddy-turn="user"]')).to_have_count(1)
    expect(chat.locator('[data-buddy-turn="assistant"]')).to_have_count(0)
    expect(chat.get_by_role("button", name="Send", exact=True)).to_be_disabled()
    first_pending = take_pending_reply(page, fixtures)
    assert fixtures.requests == [{"message": first_question, "history": [], "topic": "property"}], fixtures.requests
    first_reply = "Fixture answer: a sourcing service has an agreed scope."
    fixtures.fulfill(first_pending, {"body": {"used_ai": True, "reply": first_reply, "topic": "investment", "sources": [
        {"title": "Our pricing", "url": "https://www.impactinvestmentgroup.co.uk/pricing"},
        {"title": "Untrusted", "url": "https://untrusted.example/offer"},
        {"title": "Unsafe", "url": "javascript:alert(1)"},
    ]}})
    expect(chat.locator('[data-buddy-turn="assistant"]')).to_contain_text(first_reply)
    expect(character).to_have_attribute('data-buddy-form', 'investment')
    expect(chat).to_have_attribute('data-buddy-activity', 'talk')
    expect(chat.get_by_role("link", name="Our pricing", exact=True)).to_have_attribute("href", "https://www.impactinvestmentgroup.co.uk/pricing")
    expect(chat.get_by_role("link", name="Untrusted", exact=True)).to_have_count(0)
    expect(chat.get_by_role("link", name="Unsafe", exact=True)).to_have_count(0)
    expect(chat.get_by_role("status")).to_have_count(0)
    # The 2.1-second morph completes before the accepted answer's speaking
    # gesture settles. Talk must still be active after the new form arrives.
    page.wait_for_timeout(2400)
    expect(chat).to_have_attribute('data-buddy-activity', 'talk')
    expect(chat).to_have_attribute('data-buddy-activity', 'idle', timeout=5000)
    page.wait_for_timeout(600)
    assert canvas.evaluate("n => n.toDataURL()") != first_pixels, "Accepted conversation topic did not change Buddy's artwork"
    assert page.evaluate("window.__chatBuddyCanvas === document.querySelector('[data-buddy-chat] canvas')"), "Topic inference replaced Buddy's canvas"
    assert abs(character.bounding_box()['height'] - first_box['height']) < 1, "Inferred form changed the reserved character stage"
    second_reply = 'Fixture follow-up: <img src=x onerror="alert(1)"> is plain text.'
    fixtures.answer(second_reply, topic='support')
    send(chat, "How does care and support connect to this?")
    expect(chat.locator('[data-buddy-turn="assistant"]')).to_have_count(2)
    expect(chat.locator('[data-buddy-turn="assistant"]').last).to_contain_text(second_reply)
    expect(chat.locator('[data-buddy-turn="assistant"] img')).to_have_count(0)
    expect(character).to_have_attribute('data-buddy-form', 'support')
    assert fixtures.requests[-1] == {"message": "How does care and support connect to this?", "topic": "investment", "history": [
        {"role": "user", "content": first_question}, {"role": "assistant", "content": first_reply},
    ]}, fixtures.requests[-1]
    third_reply = 'Fixture answer returning to suitable homes.'
    fixtures.answer(third_reply, topic='property')
    send(chat, "And how do you find the right property?")
    expect(chat.locator('[data-buddy-turn="assistant"]')).to_have_count(3)
    expect(character).to_have_attribute('data-buddy-form', 'property')
    assert fixtures.requests[-1]['topic'] == 'support', fixtures.requests[-1]
    assert fixtures.requests[-1]['history'] == [
        {"role": "user", "content": first_question}, {"role": "assistant", "content": first_reply},
        {"role": "user", "content": "How does care and support connect to this?"}, {"role": "assistant", "content": second_reply},
    ], "The automatic form change lost earlier conversation turns"
    assert page.evaluate("window.__chatBuddyCanvas === document.querySelector('[data-buddy-chat] canvas')"), "Rapid accepted topic changes replaced Buddy's canvas"
    assert page.evaluate("window.__buddyFetchOptions.every(o => o.credentials === 'omit' && o.hasSignal)"), "Public chat sent ambient credentials or omitted cancellation"
    # Keep enough real exchanges to exercise the six-turn request limit.
    for index in range(4):
        fixtures.answer(f"Fixture additional answer {index}.")
        send(chat, f"Explain public service step {index}.")
        expect(chat.locator('[data-buddy-turn="assistant"]')).to_have_count(index + 4)
    assert len(fixtures.requests[-1]["history"]) == 6, fixtures.requests[-1]
    assert fixtures.requests[-1]["history"][0]["content"] == "Explain public service step 0."
    chat.get_by_role("button", name="New conversation", exact=True).click()
    expect(chat.locator("[data-buddy-turn]")).to_have_count(0)
    expect(chat.get_by_label("Your question for Buddy", exact=True)).to_be_focused()
    fixtures.answer("Fixture new conversation.")
    send(chat, "What does IIG do?")
    expect(chat.locator('[data-buddy-turn="assistant"]')).to_have_count(1)
    assert fixtures.requests[-1]["history"] == [], "Clearing retained prior conversation history"
    no_overflow(page)
    chat.screenshot(path=str(OUT / f"chat-{page.viewport_size['width']}.png"), animations="disabled")


def invalid_response_topics(page, fixtures):
    visit(page)
    chat = chat_open(page)
    character = chat.locator('[data-buddy-form]')
    fixtures.answer('Fixture accepted support answer.', topic='support')
    send(chat, 'Explain care and support.')
    expect(character).to_have_attribute('data-buddy-form', 'support')
    for index, extra in enumerate([{}, {'topic': None}, {'topic': 'unknown'}, {'topic': 'Investment'}, {'topic': 1}, {'topic': ['property']}, {'topic': {'id': 'investment'}}]):
        reply = f'Fixture valid answer with invalid or missing topic {index}.'
        fixtures.answer(reply, **extra)
        send(chat, f'Please explain the next point {index}.')
        expect(chat.locator('[data-buddy-turn="assistant"]')).to_have_count(index + 2)
        expect(chat.locator('[data-buddy-turn="assistant"]').last).to_contain_text(reply)
        expect(character).to_have_attribute('data-buddy-form', 'support')
        expect(chat.get_by_role('alert')).to_have_count(0)
        assert fixtures.requests[-1]['topic'] == 'support', 'An invalid response topic replaced the previous valid form'
        assert fixtures.requests[-1]['history'], 'An invalid topic cleared conversation history'
    expect(chat.get_by_role('log', name='Conversation with Buddy')).to_have_count(1)
    no_overflow(page)


def retry_and_refusal(page, fixtures):
    visit(page, "/platform/")
    initial_topic = page.locator('[data-buddy-widget]').get_attribute('data-buddy-context')
    chat = chat_open(page)
    expect(chat.locator('[data-buddy-form]')).to_have_attribute('data-buddy-form', initial_topic)
    fixtures.queue.append({"status": 503, "body": {"detail": "fixture unavailable"}})
    send(chat, "Explain the property process.")
    expect(chat.get_by_role("alert")).to_contain_text("couldn't get an AI answer")
    expect(chat.locator('[data-buddy-turn="assistant"]')).to_have_count(0)
    original = fixtures.requests[-1]
    fixtures.answer("Fixture recovered AI answer.")
    chat.get_by_role("button", name="Try again", exact=True).click()
    expect(chat.locator('[data-buddy-turn="assistant"]')).to_contain_text("Fixture recovered AI answer.")
    expect(chat.locator('[data-buddy-turn="user"]')).to_have_count(1)
    assert fixtures.requests[-1] == original, "Retry changed the question or duplicated history"
    expect(chat.get_by_role("alert")).to_have_count(0)
    for invalid in [
        {"used_ai": False, "reply": "Template must not be shown"},
        {"used_ai": "true", "reply": "Truthy AI proof must not be shown"},
        {"reply": "Missing AI proof must not be shown"},
        {"used_ai": True, "reply": "   "},
        {"used_ai": True, "reply": 123},
        {"used_ai": True, "reply": "x" * 3001},
    ]:
        chat.get_by_role("button", name="New conversation", exact=True).click()
        previous_form = chat.locator("[data-buddy-form]").get_attribute("data-buddy-form")
        fixtures.queue.append({"body": {**invalid, "topic": "support"}})
        send(chat, "Explain the partner network.")
        expect(chat.get_by_role("alert")).to_contain_text("couldn't get an AI answer")
        expect(chat.locator('[data-buddy-turn="assistant"]')).to_have_count(0)
        expect(chat.get_by_role("link", name="Contact our team", exact=True)).to_have_attribute("href", "/contact")
        expect(chat.locator("[data-buddy-form]")).to_have_attribute("data-buddy-form", previous_form)
    chat.get_by_role("button", name="New conversation", exact=True).click()
    fixtures.queue.append({"status": 429, "body": {"detail": "fixture limit"}})
    send(chat, "Explain supported housing.")
    expect(chat.get_by_role("alert")).to_contain_text("Buddy is busy")

    # Services can reopen the same failed conversation without replacing the
    # pending retry payload, changing its form or submitting another question.
    chat.get_by_role("button", name="New conversation", exact=True).click()
    fixtures.queue.append({"status": 503, "body": {"detail": "fixture property failure"}})
    send(chat, "A property question to retry after browsing Services.")
    expect(chat.get_by_role("alert")).to_contain_text("couldn't get an AI answer")
    expect(chat.get_by_role("button", name="Try again", exact=True)).to_be_visible()
    original_retry = fixtures.requests[-1]
    expect(chat.locator('[data-buddy-form]')).to_have_attribute('data-buddy-form', original_retry['topic'])
    before_open = len(fixtures.requests)
    status_count = len(fixtures.status_requests)
    chat.get_by_role('link', name='Contact our team', exact=True).click()
    expect(page).to_have_url(re.compile(r'/contact/?$'))
    expect(chat).to_be_visible()
    expect(chat.get_by_role('button', name='Try again', exact=True)).to_be_visible()
    expect(chat.locator('[data-buddy-turn="user"]')).to_have_count(1)
    expect(chat.locator('[data-buddy-turn="assistant"]')).to_have_count(0)
    assert len(fixtures.requests) == before_open, 'An internal error link reposted the failed question'
    assert len(fixtures.status_requests) == status_count, 'An internal error link replaced the conversation'
    page.locator('footer').get_by_role('link', name='Our Services', exact=True).focus()
    page.keyboard.press('Enter')
    expect(page).to_have_url(re.compile(r'/platform/?$'))
    expect(chat.get_by_role('button', name='Try again', exact=True)).to_be_visible()
    showcase = page.locator('[data-buddy-showcase]')
    showcase.get_by_role('button', name='Care & support', exact=True).focus()
    page.keyboard.press('Enter')
    showcase.get_by_role('button', name='Open Buddy', exact=True).focus()
    page.keyboard.press('Enter')
    expect(chat.get_by_role('button', name='Try again', exact=True)).to_be_visible()
    expect(chat.locator('[data-buddy-form]')).to_have_attribute('data-buddy-form', original_retry['topic'])
    assert len(fixtures.requests) == before_open, 'Opening Services reposted the failed question'
    assert len(fixtures.status_requests) == status_count, 'Opening an existing failed chat restarted readiness'
    fixtures.answer('Fixture retry answer after opening Services.', topic='investment')
    chat.get_by_role('button', name='Try again', exact=True).click()
    expect(chat.locator('[data-buddy-turn="assistant"]')).to_have_count(1)
    expect(chat.locator('[data-buddy-turn="user"]')).to_have_count(1)
    expect(chat.locator('[data-buddy-form]')).to_have_attribute('data-buddy-form', 'investment')
    assert fixtures.requests[-1] == original_retry, 'Reopening changed the question or duplicated retry history'
    fixtures.answer('Fixture answer to the next care question.', topic='support')
    send(chat, 'How does care connect with the property service?')
    expect(chat.locator('[data-buddy-turn="assistant"]')).to_have_count(2)
    expect(chat.locator('[data-buddy-form]')).to_have_attribute('data-buddy-form', 'support')
    assert fixtures.requests[-1]['topic'] == 'investment'
    assert fixtures.requests[-1]['history'] == [
        {'role': 'user', 'content': original_retry['message']},
        {'role': 'assistant', 'content': 'Fixture retry answer after opening Services.'},
    ], 'A successful retry did not join the continuous conversation'
    no_overflow(page)


def cancellation_and_focus(page, fixtures):
    visit(page)
    page.evaluate("window.__buddyIgnoreAbort = true")
    chat = chat_open(page)
    fixtures.queue.append({"pending": True})
    send(chat, "First question to cancel.")
    expect(chat.get_by_role("status")).to_contain_text("thinking")
    late = take_pending_reply(page, fixtures)
    chat.get_by_role("button", name="Cancel request", exact=True).click()
    expect(chat.get_by_role("alert")).to_contain_text("Request cancelled")
    expect(chat.get_by_role("status")).to_have_count(0)
    fixtures.answer("Fixture current answer.", topic="support")
    send(chat, "Second question after cancellation.")
    expect(chat.locator('[data-buddy-turn="assistant"]')).to_have_count(1)
    fixtures.fulfill(late, {"body": {"used_ai": True, "reply": "Late cancelled answer must never appear.", "topic": "investment"}})
    page.wait_for_timeout(150)
    expect(chat.locator('[data-buddy-turn="assistant"]')).to_have_count(1)
    expect(chat).not_to_contain_text("Late cancelled answer")
    expect(chat.locator("[data-buddy-form]")).to_have_attribute("data-buddy-form", "support")
    fixtures.queue.append({"pending": True})
    send(chat, "Another pending question.")
    expect(chat.get_by_role("status")).to_be_visible()
    late_close = take_pending_reply(page, fixtures)
    page.keyboard.press("Escape")
    expect(chat).to_have_count(0)
    expect(page.locator("[data-buddy-launcher]")).to_be_focused()
    fixtures.fulfill(late_close, {"body": {"used_ai": True, "reply": "Closed dialog answer must never appear.", "topic": "property"}})
    page.wait_for_timeout(150)
    chat = chat_open(page)
    expect(chat.locator('[data-buddy-turn="assistant"]')).to_have_count(1)
    expect(chat).not_to_contain_text("Closed dialog answer")
    expect(chat.locator("[data-buddy-form]")).to_have_attribute("data-buddy-form", "support")
    no_overflow(page)


def take_pending_status(page, fixtures):
    for _ in range(100):
        if fixtures.pending_status:
            return fixtures.pending_status.pop(0)
        page.wait_for_timeout(50)
    raise AssertionError("The readiness request never reached its fixture")


def take_pending_reply(page, fixtures):
    for _ in range(100):
        if fixtures.pending:
            return fixtures.pending.pop(0)
        page.wait_for_timeout(50)
    raise AssertionError("The model request never reached its fixture")


def nonmodal_continuous_conversation(page, fixtures):
    visit(page, "/platform/")
    initial_topic = page.locator('[data-buddy-widget]').get_attribute('data-buddy-context')
    chat = chat_open(page)
    character = chat.locator('[data-buddy-form]')
    expect(character).to_have_attribute('data-buddy-form', initial_topic)
    fixtures.queue.append({"pending": True})
    first_question = 'Explain property sourcing while I browse the site.'
    send(chat, first_question)
    first_pending = take_pending_reply(page, fixtures)
    status_count = len(fixtures.status_requests)

    # Reopening from Services must not restart or abort the active answer.
    page.locator('[data-buddy-showcase]').get_by_role('button', name='Open Buddy', exact=True).focus()
    page.keyboard.press('Enter')
    expect(chat).to_have_attribute('data-buddy-activity', 'think')
    expect(chat).to_have_attribute('data-buddy-readiness', 'ready')
    expect(character).to_have_attribute('data-buddy-form', initial_topic)
    assert len(fixtures.status_requests) == status_count, 'Reopening restarted readiness during a reply'
    assert page.evaluate('window.__buddyRequestAborted') == 0, 'Reopening cancelled the visitor question'

    # The real client-side navigation keeps both the form and pending request.
    page.locator('footer').get_by_role('link', name='Pricing', exact=True).focus()
    page.keyboard.press('Enter')
    expect(page).to_have_url(re.compile(r'/pricing/?$'))
    expect(chat).to_be_visible()
    expect(character).to_have_attribute('data-buddy-form', initial_topic)
    expect(chat).to_have_attribute('data-buddy-activity', 'think')
    assert len(fixtures.requests) == 1 and fixtures.requests[0]['topic'] == initial_topic
    assert len(fixtures.status_requests) == status_count, 'Navigation restarted the conversation'
    assert page.evaluate('window.__buddyRequestAborted') == 0, 'Navigation cancelled the question'
    first_reply = 'Fixture investment answer preserved across navigation.'
    fixtures.fulfill(first_pending, {'body': {'used_ai': True, 'reply': first_reply, 'topic': 'investment'}})
    expect(chat.locator('[data-buddy-turn="assistant"]')).to_contain_text(first_reply)
    expect(character).to_have_attribute('data-buddy-form', 'investment')

    fixtures.queue.append({'pending': True})
    second_question = 'How do care and support connect to this?'
    send(chat, second_question)
    second_pending = take_pending_reply(page, fixtures)
    page.locator('footer').get_by_role('link', name='Our Services', exact=True).focus()
    page.keyboard.press('Enter')
    expect(page).to_have_url(re.compile(r'/platform/?$'))
    showcase = page.locator('[data-buddy-showcase]')
    showcase.get_by_role('button', name='Care & support', exact=True).focus()
    page.keyboard.press('Enter')
    expect(showcase.locator('[data-buddy-form]')).to_have_attribute('data-buddy-form', 'support')
    showcase.get_by_role('button', name='Open Buddy', exact=True).focus()
    page.keyboard.press('Enter')
    expect(chat).to_have_attribute('data-buddy-readiness', 'ready')
    expect(chat).to_have_attribute('data-buddy-activity', 'think')
    expect(character).to_have_attribute('data-buddy-form', 'investment')
    expect(chat.get_by_role('button', name='Send', exact=True)).to_be_disabled()
    assert page.evaluate('window.__buddyRequestAborted') == 0, 'Services changed context and cancelled a pending answer'
    assert len(fixtures.requests) == 2, 'Services opening submitted an automatic question'
    assert len(fixtures.status_requests) == status_count, 'Services context restarted readiness'
    assert fixtures.requests[-1] == {'message': second_question, 'topic': 'investment', 'history': [
        {'role': 'user', 'content': first_question}, {'role': 'assistant', 'content': first_reply},
    ]}
    second_reply = 'Fixture support answer continuing the same conversation.'
    fixtures.fulfill(second_pending, {'body': {'used_ai': True, 'reply': second_reply, 'topic': 'support'}})
    expect(chat.locator('[data-buddy-turn="assistant"]')).to_have_count(2)
    expect(character).to_have_attribute('data-buddy-form', 'support')
    expect(chat.get_by_role('alert')).to_have_count(0)

    # A different showcase form cannot overwrite the established conversation,
    # whether the panel is already open or later reopened with a retained draft.
    showcase.get_by_role('button', name='Costs', exact=True).focus()
    page.keyboard.press('Enter')
    trigger = showcase.get_by_role('button', name='Open Buddy', exact=True)
    trigger.focus()
    page.keyboard.press('Enter')
    expect(character).to_have_attribute('data-buddy-form', 'support')
    assert len(fixtures.requests) == 2 and len(fixtures.status_requests) == status_count
    draft = 'And which property partners are involved?'
    chat.get_by_label('Your question for Buddy', exact=True).fill(draft)
    page.keyboard.press('Escape')
    expect(chat).to_have_count(0)
    expect(trigger).to_be_focused()
    trigger.click()
    expect(chat).to_have_attribute('data-buddy-readiness', 'ready')
    expect(character).to_have_attribute('data-buddy-form', 'support')
    expect(chat.locator('[data-buddy-turn]')).to_have_count(4)
    expect(chat.get_by_label('Your question for Buddy', exact=True)).to_have_value(draft)
    assert len(fixtures.requests) == 2, 'Reopening sent the retained draft automatically'
    assert len(fixtures.status_requests) == status_count + 1, 'Reopening should check availability once'
    fixtures.answer('Fixture property answer after reopening.', topic='property')
    chat.get_by_role('button', name='Send', exact=True).click()
    expect(chat.locator('[data-buddy-turn="assistant"]')).to_have_count(3)
    expect(character).to_have_attribute('data-buddy-form', 'property')
    assert fixtures.requests[-1] == {'message': draft, 'topic': 'support', 'history': [
        {'role': 'user', 'content': first_question}, {'role': 'assistant', 'content': first_reply},
        {'role': 'user', 'content': second_question}, {'role': 'assistant', 'content': second_reply},
    ]}, 'Reopening did not retain the continuous cross-topic history'
    no_overflow(page)


def readiness_gate(page, fixtures):
    visit(page)
    assert not fixtures.status_requests, "The page checked AI availability before Buddy was opened"
    fixtures.status_queue.append({"pending": True})
    page.locator("[data-buddy-launcher]").click()
    chat = page.locator("[data-buddy-chat]")
    expect(chat).to_have_attribute("data-buddy-readiness", "loading")
    expect(chat.get_by_role("status")).to_contain_text("Checking whether Buddy's AI chat is available")
    expect(chat.locator("#buddy-question")).to_be_disabled()
    expect(chat.locator('button[type="submit"]')).to_be_disabled()
    expect(chat.locator("form")).to_be_hidden()
    expect(chat.get_by_role("button", name="Check connection", exact=True)).to_be_disabled()
    expect(chat.locator("[data-buddy-turn]")).to_have_count(0)
    assert not fixtures.requests, "Checking readiness submitted a question"
    fixtures.fulfill(take_pending_status(page, fixtures), {"body": {"configured": False}})
    expect(chat).to_have_attribute("data-buddy-readiness", "unavailable")
    expect(chat.get_by_role("status")).to_contain_text("AI chat is unavailable right now")
    expect(chat.get_by_role("link", name="Explore our services", exact=True)).to_have_attribute("href", "/platform")
    expect(chat.get_by_role("link", name="Contact our team", exact=True)).to_have_attribute("href", "/contact")
    expect(chat.get_by_role("group", name="Conversation topic")).to_have_count(0)
    starter = chat.get_by_role("button", name="Pricing is coming soon. How can I discuss my requirements with your team?", exact=True)
    expect(starter).to_have_count(0)
    # Failure and truthy-but-not-true responses must not unlock the composer.
    for response in [{"status": 404}, {"status": 503}, {"body": {"configured": "true"}}, {"body": {}}]:
        fixtures.status_queue.append(response)
        chat.get_by_role("button", name="Check connection", exact=True).click()
        expect(chat).to_have_attribute("data-buddy-readiness", "unavailable")
        expect(chat.locator("#buddy-question")).to_be_disabled()
        expect(chat.locator("form")).to_be_hidden()
        expect(chat.locator("[data-buddy-turn]")).to_have_count(0)
        assert not fixtures.requests, "Unavailable AI received a question"
    assert page.evaluate("window.__buddyStatusOptions.every(o => o.method === 'GET' && o.credentials === 'omit' && o.cache === 'no-store' && o.hasSignal)"), "Readiness check cached a result, sent credentials or lacked cancellation"
    chat.get_by_role("button", name="Check connection", exact=True).click()
    expect(chat).to_have_attribute("data-buddy-readiness", "ready")
    expect(chat.get_by_label("Your question for Buddy", exact=True)).to_be_focused()
    expect(starter).to_be_visible()
    fixtures.answer("Fixture answer after readiness recovered.")
    send(chat, "Explain the service after recovery.")
    expect(chat.locator('[data-buddy-turn="assistant"]')).to_contain_text("Fixture answer after readiness recovered.")
    # A later outage must still allow clearing history and must block a retained draft.
    chat.get_by_label("Your question for Buddy", exact=True).fill("Retained draft must not be sent while unavailable.")
    page.keyboard.press("Escape")
    fixtures.status_queue.append({"body": {"configured": False}})
    page.locator("[data-buddy-launcher]").click()
    expect(chat).to_have_attribute("data-buddy-readiness", "unavailable")
    expect(chat.locator("#buddy-question")).to_be_disabled()
    chat.locator("form").dispatch_event("submit")
    page.wait_for_timeout(100)
    assert len(fixtures.requests) == 1, "A retained draft bypassed the readiness gate"
    chat.get_by_role("button", name="New conversation", exact=True).click()
    expect(chat.locator("[data-buddy-turn]")).to_have_count(0)
    expect(chat).to_have_attribute("data-buddy-readiness", "unavailable")
    if page.viewport_size["width"] == 390:
        page.set_viewport_size({"width": 390, "height": 500})
    retry_box = chat.get_by_role("button", name="Check connection", exact=True).bounding_box()
    assert retry_box["y"] >= 0 and retry_box["y"] + retry_box["height"] <= page.viewport_size["height"] + 1, "Unavailable-state retry is clipped"
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth + 1"), "Unavailable Buddy overflows horizontally"
    chat.screenshot(path=str(OUT / f"chat-unavailable-{page.viewport_size['width']}.png"), animations="disabled")


def readiness_cancel_timeout(page, fixtures):
    visit(page)
    page.evaluate("window.__buddyIgnoreStatusAbort = true")
    fixtures.status_queue.append({"pending": True})
    page.locator("[data-buddy-launcher]").click()
    chat = page.locator("[data-buddy-chat]")
    expect(chat).to_have_attribute("data-buddy-readiness", "loading")
    late_closed = take_pending_status(page, fixtures)
    page.keyboard.press("Escape")
    expect(chat).to_have_count(0)
    expect(page.locator("[data-buddy-launcher]")).to_be_focused()
    fixtures.status_queue.append({"body": {"configured": False}})
    page.locator("[data-buddy-launcher]").click()
    expect(chat).to_have_attribute("data-buddy-readiness", "unavailable")
    fixtures.fulfill(late_closed, {"body": {"configured": True}})
    page.wait_for_timeout(150)
    expect(chat).to_have_attribute("data-buddy-readiness", "unavailable")
    assert page.evaluate("window.__buddyStatusAborted >= 1"), "Closing did not abort the readiness request"
    fixtures.status_queue.append({"pending": True})
    chat.get_by_role("button", name="Check connection", exact=True).click()
    expect(chat).to_have_attribute("data-buddy-readiness", "loading")
    late_timeout = take_pending_status(page, fixtures)
    aborted_before_timeout = page.evaluate("window.__buddyStatusAborted")
    expect(chat).to_have_attribute("data-buddy-readiness", "unavailable", timeout=8000)
    assert page.evaluate("window.__buddyStatusAborted") > aborted_before_timeout, "Readiness timeout did not abort its request"
    fixtures.fulfill(late_timeout, {"body": {"configured": True}})
    page.wait_for_timeout(150)
    expect(chat).to_have_attribute("data-buddy-readiness", "unavailable")
    expect(chat.locator("#buddy-question")).to_be_disabled()
    assert not fixtures.requests, "A stale or timed-out check unlocked AI questions"
    chat.get_by_role("button", name="Check connection", exact=True).click()
    expect(chat).to_have_attribute("data-buddy-readiness", "ready")
    expect(chat.get_by_label("Your question for Buddy", exact=True)).to_be_focused()
    assert len(fixtures.status_requests) == 4, fixtures.status_requests
    no_overflow(page)


def centre_section(page, selector):
    page.locator(selector).evaluate("node => {const b=node.getBoundingClientRect();scrollTo({top:scrollY+b.top+b.height/2-innerHeight/2,behavior:'instant'})}")


def scroll_context_and_retained_chat(page, fixtures):
    visit(page)
    widget = page.locator('[data-buddy-widget]')
    character = widget.locator('[data-buddy-form]')
    financial = '#mission-panel-need [data-buddy-topic="investment"]'
    for selector, topic in [
        ('section[aria-labelledby="hero-heading"]', 'property'),
        ('#charity-impact', 'support'),
        ('.council-panel', 'property'),
        (financial, 'investment'),
    ]:
        centre_section(page, selector)
        expect(widget).to_have_attribute('data-buddy-context', topic)
        expect(character).to_have_attribute('data-buddy-form', topic)
        assert_canvas_artwork(character)
    assert not fixtures.chat_chunks and not fixtures.status_requests and not fixtures.requests, 'Reading the page opened or contacted AI'

    # A brief pass through another section must not switch Buddy's form.
    centre_section(page, '#charity-impact')
    expect(widget).to_have_attribute('data-buddy-context', 'support')
    page.evaluate("""() => {
      window.__contextChanges=[];
      const widget=document.querySelector('[data-buddy-widget]');
      window.__contextObserver=new MutationObserver(() => window.__contextChanges.push(widget.dataset.buddyContext));
      window.__contextObserver.observe(widget,{attributes:true,attributeFilter:['data-buddy-context']});
      for(const selector of ['#mission-panel-need [data-buddy-topic="investment"]','.council-panel']) {
        const box=document.querySelector(selector).getBoundingClientRect();
        scrollTo({top:scrollY+box.top+box.height/2-innerHeight/2,behavior:'instant'});
      }
    }""")
    expect(widget).to_have_attribute('data-buddy-context', 'property')
    assert 'investment' not in page.evaluate('window.__contextChanges'), 'A passing section caused a form flash'
    page.evaluate('window.__contextObserver.disconnect()')

    # Changing an existing tab is a semantic mutation, without a route change.
    page.locator('#mission-tab-response').click()
    centre_section(page, '#mission-panel-response')
    expect(widget).to_have_attribute('data-buddy-context', 'support')
    assert page.locator(financial).is_hidden(), 'Inactive financial content stayed visible'
    expect(character).to_have_attribute('data-buddy-form', 'support')

    centre_section(page, '#charity-impact')
    expect(widget).to_have_attribute('data-buddy-context', 'support')
    chat = chat_open(page)
    chat_character = chat.locator('[data-buddy-form]')
    expect(chat_character).to_have_attribute('data-buddy-form', 'support')
    fixtures.queue.append({'pending': True})
    question = 'Explain how care organisations work with IIG.'
    send(chat, question)
    pending = take_pending_reply(page, fixtures)
    centre_section(page, '.council-panel')
    expect(chat).to_have_attribute('data-buddy-page-topic', 'property')
    expect(chat_character).to_have_attribute('data-buddy-form', 'support')
    expect(chat).to_have_attribute('data-buddy-activity', 'think')
    assert fixtures.requests == [{'message': question, 'history': [], 'topic': 'support'}], 'Scrolling retargeted or repeated the pending question'
    fixtures.fulfill(pending, {'body': {'used_ai': True, 'reply': 'Fixture answer connecting care with investment.', 'topic': 'investment'}})
    expect(chat_character).to_have_attribute('data-buddy-form', 'investment')
    expect(chat.locator('[data-buddy-turn]')).to_have_count(2)
    draft = 'Keep this unfinished follow-up while I read.'
    chat.get_by_label('Your question for Buddy', exact=True).fill(draft)
    centre_section(page, '#charity-impact')
    expect(chat).to_have_attribute('data-buddy-page-topic', 'support')
    expect(chat_character).to_have_attribute('data-buddy-form', 'investment')
    expect(chat.get_by_label('Your question for Buddy', exact=True)).to_have_value(draft)
    expect(chat.locator('[data-buddy-turn]')).to_have_count(2)
    chat.get_by_role('button', name='Close Buddy', exact=True).click()
    expect(widget).to_have_attribute('data-buddy-context', 'support')
    expect(character).to_have_attribute('data-buddy-form', 'support')
    centre_section(page, '.council-panel')
    expect(widget).to_have_attribute('data-buddy-context', 'property')
    chat = chat_open(page)
    expect(chat.locator('[data-buddy-form]')).to_have_attribute('data-buddy-form', 'investment')
    expect(chat.get_by_label('Your question for Buddy', exact=True)).to_have_value(draft)
    expect(chat.locator('[data-buddy-turn]')).to_have_count(2)
    assert len(fixtures.requests) == 1, 'Closing, scrolling or reopening submitted a question'
    chat.get_by_role('button', name='New conversation', exact=True).click()
    expect(chat.locator('[data-buddy-form]')).to_have_attribute('data-buddy-form', 'property')
    expect(chat.get_by_label('Your question for Buddy', exact=True)).to_have_value('')
    expect(chat.locator('[data-buddy-turn]')).to_have_count(0)
    chat.get_by_role('button', name='Close Buddy', exact=True).click()

    # New route content and a same-page showcase mutation are both observed.
    page.locator('footer').get_by_role('link', name='Our Services', exact=True).focus()
    page.keyboard.press('Enter')
    expect(page).to_have_url(re.compile(r'/platform/?$'))
    centre_section(page, '[data-buddy-showcase]')
    showcase = page.locator('[data-buddy-showcase]')
    showcase.get_by_role('button', name='Care & support', exact=True).click()
    centre_section(page, '[data-buddy-showcase]')
    expect(widget).to_have_attribute('data-buddy-context', 'support')
    showcase.get_by_role('button', name='Costs', exact=True).click()
    expect(widget).to_have_attribute('data-buddy-context', 'investment')
    chat = chat_open(page)
    expect(chat.locator('[data-buddy-form]')).to_have_attribute('data-buddy-form', 'investment')
    expect(chat.locator('[data-buddy-turn]')).to_have_count(0)
    assert len(fixtures.requests) == 1
    no_overflow(page)


def reduced_motion(page, fixtures):
    visit(page, "/platform/")
    showcase = page.locator("[data-buddy-showcase]")
    showcase.scroll_into_view_if_needed()
    character = showcase.locator("[data-buddy-form]")
    assert_canvas_artwork(character)
    showcase.get_by_role("button", name="Care & support", exact=True).click()
    expect(character).to_have_attribute("data-buddy-form", "support")
    page.wait_for_timeout(250)
    draws = page.evaluate("window.__buddyDraws")
    page.wait_for_timeout(500)
    assert page.evaluate("window.__buddyDraws") - draws < 4, "Reduced motion retained a character animation loop"
    chat = chat_open(page)
    for topic in ("investment", "support"):
        fixtures.answer(f"Fixture reduced-motion {topic} answer.", topic=topic)
        send(chat, f"Explain the next {topic} point.")
        expect(chat.locator("[data-buddy-form]")).to_have_attribute("data-buddy-form", topic)
        page.wait_for_timeout(250)
        draws = page.evaluate("window.__buddyDraws")
        page.wait_for_timeout(500)
        assert page.evaluate("window.__buddyDraws") - draws < 4, "An inferred chat topic started a reduced-motion render loop"
    no_overflow(page)



def short_viewport(page, fixtures):
    visit(page)
    page.set_viewport_size({"width": 390, "height": 500})
    chat = chat_open(page)
    no_overflow(page)
    fixtures.answer("Fixture compact-screen answer.")
    send(chat, "Explain the service.")
    expect(chat.locator('[data-buddy-turn="assistant"]')).to_contain_text("Fixture compact-screen answer.")
    no_overflow(page)
    chat.screenshot(path=str(OUT / "chat-short-390.png"), animations="disabled")


def missing_artwork(page, fixtures):
    visit(page)
    character = page.locator("[data-buddy-widget] [data-buddy-form]")
    expect(character.locator("canvas")).to_be_hidden()
    expect(character).to_have_attribute("data-buddy-status", "failed")
    fallback = character.locator('img[alt=""]')
    expect(fallback).to_be_visible()
    expect(fallback).to_have_attribute("src", "/images/buddy/key-hero-v2.png")
    page.wait_for_function("document.querySelector('[data-buddy-widget] img')?.naturalWidth > 0")
    bounds = character.bounding_box()
    assert bounds["width"] >= 44 and bounds["height"] >= 44, "Missing artwork collapsed the floating character"
    assert_fixed_widget(page)
    chat = chat_open(page)
    fixtures.answer("Fixture answer with unavailable artwork.")
    send(chat, "How does the service work?")
    expect(chat.locator('[data-buddy-turn="assistant"]')).to_contain_text("Fixture answer with unavailable artwork.")
    no_overflow(page)


try:
    retired_artwork = ROOT / "dist/client/images/ai-team"
    assert not retired_artwork.exists() or not any(retired_artwork.rglob("*")), "Retired mascot artwork is still published"
    atlas = (ROOT / "dist/client" / V2_ATLAS_PATH.lstrip("/")).read_bytes()
    assert len(atlas) == V2_ATLAS_SIZE, "Built Buddy atlas has the wrong version/size"
    assert hashlib.sha256(atlas).hexdigest() == V2_ATLAS_SHA256, "Built Buddy atlas differs from the supplied v2-refined package"
    REPORT["checks"].append({"name": "supplied-v2-refined-artwork", "status": "pass", "bytes": len(atlas), "sha256": V2_ATLAS_SHA256})
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        cases = [
            ("floating-placement-minimise", floating_placement_and_minimise, {}),
            ("services-only-showcase-keyboard", services_showcase_and_topics, {}),
            ("fetch-history-sources", real_fetch_contract, {}),
            ("invalid-response-topics", invalid_response_topics, {"reduced": True}),
            ("retry-and-ai-proof", retry_and_refusal, {}),
            ("cancel-late-response-focus", cancellation_and_focus, {}),
            ("nonmodal-continuous-conversation", nonmodal_continuous_conversation, {"reduced": True}),
            ("scroll-context-retained-chat", scroll_context_and_retained_chat, {"reduced": True}),
            ("readiness-gate-recovery", readiness_gate, {"reduced": True}),
            ("readiness-cancel-timeout", readiness_cancel_timeout, {"reduced": True}),
            ("reduced-motion", reduced_motion, {"reduced": True}),
            ("artwork-fallback", missing_artwork, {"fail_atlas": True, "reduced": True}),
            ("short-viewport", short_viewport, {"reduced": True}),
        ]
        unknown = set(ARGS.case) - {name for name, _, _ in cases}
        if unknown:
            parser.error('Unknown journey: ' + ', '.join(sorted(unknown)))
        selected = 0
        for width in (320, 390, 768, 1280):
            if ARGS.width and width not in ARGS.width:
                continue
            for name, run, options in cases:
                if ARGS.case and name not in ARGS.case:
                    continue
                if width not in (390, 1280) and name != "floating-placement-minimise":
                    continue
                if name == "short-viewport" and width != 390:
                    continue
                selected += 1
                context, fixtures = context_for(browser, width=width, **options)
                page = context.new_page()
                errors = []
                page.on("pageerror", lambda error: errors.append(str(error)))
                try:
                    run(page, fixtures)
                    assert not errors, errors
                    assert not fixtures.unexpected_posts, fixtures.unexpected_posts
                    assert not fixtures.queue, "A scheduled fixture was never requested"
                    assert not fixtures.status_queue, "A scheduled readiness fixture was never requested"
                    assert not fixtures.pending_status, "A pending readiness fixture was not handled"
                    REPORT["checks"].append({"name": name, "width": width, "status": "pass", "mocked_requests": len(fixtures.requests), "mocked_readiness_checks": len(fixtures.status_requests)})
                except Exception as error:
                    REPORT["failures"].append({"name": name, "width": width, "error": str(error), "browser_errors": errors})
                    page.screenshot(path=str(OUT / f"failure-{name}-{width}.png"), full_page=True)
                finally:
                    context.close()
        assert selected, 'The selected journey/width combination contains no supported cases'
        browser.close()
except Exception as error:
    REPORT["failures"].append({"name": "suite-startup", "error": str(error)})
finally:
    server.shutdown()
    server.server_close()
    (OUT / "report.json").write_text(json.dumps(REPORT, indent=2), encoding="utf-8")
    print(json.dumps(REPORT, indent=2))

raise SystemExit(1 if REPORT["failures"] else 0)

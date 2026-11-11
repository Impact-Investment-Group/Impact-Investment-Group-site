"""CI-only Buddy browser journeys. All AI responses are explicit local fixtures."""
import functools
import hashlib
import http.server
import json
import re
from pathlib import Path
import threading
from urllib.parse import urlparse

from playwright.sync_api import sync_playwright, expect

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
    # Exercise a real page control while Buddy remains open. Scrolling the
    # existing mission tab near the top avoids the chat panel itself; a modal
    # backdrop or disabled body pointer events would still block the click.
    mission_tab = page.locator("#mission-tab-response")
    mission_tab.evaluate("n => scrollTo({top: scrollY + n.getBoundingClientRect().top - 120, behavior: 'instant'})")
    mission_tab.click()
    expect(mission_tab).to_have_attribute("aria-selected", "true")
    expect(page.locator("#mission-panel-response")).to_be_visible()
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
    expect(chat.get_by_role("group", name="Conversation topic").get_by_role("button", name="Support", exact=True)).to_have_attribute("aria-pressed", "true")
    expect(page.locator("[data-buddy-widget]:visible")).to_have_count(0)
    assert not fixtures.requests, "The services showcase sent a question without a user action"
    page.keyboard.press("Escape")
    expect(chat).to_have_count(0)
    expect(trigger).to_be_focused()
    page.wait_for_timeout(5200)
    draws = page.evaluate("window.__buddyShowcaseDraws")
    page.wait_for_timeout(500)
    assert page.evaluate("window.__buddyShowcaseDraws") - draws < 4, "The services showcase retained an idle animation loop"
    showcase.screenshot(path=str(OUT / f"services-showcase-{page.viewport_size['width']}.png"), animations="disabled")
    # The showcase must stay confined to Services, including after navigation.
    for path in ("/", "/pricing/", "/partners/"):
        visit(page, path)
        expect(page.locator("[data-buddy-showcase], main [data-buddy-form]")).to_have_count(0)
        assert_fixed_widget(page)
        no_overflow(page)


def real_fetch_contract(page, fixtures):
    visit(page)
    chat = chat_open(page)
    topics = chat.get_by_role("group", name="Conversation topic")
    topics.get_by_role("button", name="Investment", exact=True).click()
    fixtures.queue.append({"pending": True})
    first_question = "What does the sourcing service include?"
    send(chat, first_question)
    expect(chat.get_by_role("status")).to_contain_text("Buddy is thinking")
    expect(chat.locator('[data-buddy-turn="user"]')).to_have_count(1)
    expect(chat.locator('[data-buddy-turn="assistant"]')).to_have_count(0)
    expect(chat.get_by_role("button", name="Send", exact=True)).to_be_disabled()
    expect(topics.get_by_role("button", name="Property", exact=True)).to_be_disabled()
    first_pending = take_pending_reply(page, fixtures)
    assert fixtures.requests == [{"message": first_question, "history": [], "topic": "investment"}], fixtures.requests
    first_reply = "Fixture answer: a sourcing service has an agreed scope."
    fixtures.fulfill(first_pending, {"body": {"used_ai": True, "reply": first_reply, "sources": [
        {"title": "Our pricing", "url": "https://www.impactinvestmentgroup.co.uk/pricing"},
        {"title": "Untrusted", "url": "https://untrusted.example/offer"},
        {"title": "Unsafe", "url": "javascript:alert(1)"},
    ]}})
    expect(chat.locator('[data-buddy-turn="assistant"]')).to_contain_text(first_reply)
    expect(chat.get_by_role("link", name="Our pricing", exact=True)).to_have_attribute("href", "https://www.impactinvestmentgroup.co.uk/pricing")
    expect(chat.get_by_role("link", name="Untrusted", exact=True)).to_have_count(0)
    expect(chat.get_by_role("link", name="Unsafe", exact=True)).to_have_count(0)
    expect(chat.get_by_role("status")).to_have_count(0)
    second_reply = 'Fixture follow-up: <img src=x onerror="alert(1)"> is plain text.'
    fixtures.answer(second_reply)
    send(chat, "How is the fee calculated?")
    expect(chat.locator('[data-buddy-turn="assistant"]')).to_have_count(2)
    expect(chat.locator('[data-buddy-turn="assistant"]').last).to_contain_text(second_reply)
    expect(chat.locator('[data-buddy-turn="assistant"] img')).to_have_count(0)
    assert fixtures.requests[-1] == {"message": "How is the fee calculated?", "topic": "investment", "history": [
        {"role": "user", "content": first_question}, {"role": "assistant", "content": first_reply},
    ]}, fixtures.requests[-1]
    assert page.evaluate("window.__buddyFetchOptions.every(o => o.credentials === 'omit' && o.hasSignal)"), "Public chat sent ambient credentials or omitted cancellation"
    # Keep enough real exchanges to exercise the six-turn request limit.
    for index in range(4):
        fixtures.answer(f"Fixture additional answer {index}.")
        send(chat, f"Explain public service step {index}.")
        expect(chat.locator('[data-buddy-turn="assistant"]')).to_have_count(index + 3)
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


def retry_and_refusal(page, fixtures):
    visit(page)
    chat = chat_open(page)
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
        fixtures.queue.append({"body": invalid})
        send(chat, "Explain the partner network.")
        expect(chat.get_by_role("alert")).to_contain_text("couldn't get an AI answer")
        expect(chat.locator('[data-buddy-turn="assistant"]')).to_have_count(0)
        expect(chat.get_by_role("link", name="Contact our team", exact=True)).to_have_attribute("href", "/contact")
    chat.get_by_role("button", name="New conversation", exact=True).click()
    fixtures.queue.append({"status": 429, "body": {"detail": "fixture limit"}})
    send(chat, "Explain supported housing.")
    expect(chat.get_by_role("alert")).to_contain_text("Buddy is busy")

    # A retry belongs to its original question and topic. Switching to Costs
    # must clear that affordance rather than resend a failed Property question.
    chat.get_by_role("button", name="New conversation", exact=True).click()
    fixtures.queue.append({"status": 503, "body": {"detail": "fixture property failure"}})
    send(chat, "A property question that must not be retried under Costs.")
    expect(chat.get_by_role("alert")).to_contain_text("couldn't get an AI answer")
    expect(chat.get_by_role("button", name="Try again", exact=True)).to_be_visible()
    assert fixtures.requests[-1]["topic"] == "property"
    before_switch = len(fixtures.requests)
    costs = chat.get_by_role("group", name="Conversation topic").get_by_role("button", name="Investment", exact=True)
    costs.click()
    expect(costs).to_have_attribute("aria-pressed", "true")
    expect(chat.get_by_role("alert")).to_have_count(0)
    expect(chat.get_by_role("button", name="Try again", exact=True)).to_have_count(0)
    page.wait_for_timeout(150)
    assert len(fixtures.requests) == before_switch, "Changing topic reposted the failed Property question"
    fixtures.answer("Fixture answer to the new Costs question.")
    send(chat, "Where can I find the service fees?")
    expect(chat.locator('[data-buddy-turn="assistant"]')).to_contain_text("Fixture answer to the new Costs question.")
    assert len(fixtures.requests) == before_switch + 1
    assert fixtures.requests[-1]["topic"] == "investment"
    assert fixtures.requests[-1]["message"] == "Where can I find the service fees?"
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
    fixtures.answer("Fixture current answer.")
    send(chat, "Second question after cancellation.")
    expect(chat.locator('[data-buddy-turn="assistant"]')).to_have_count(1)
    fixtures.fulfill(late, {"body": {"used_ai": True, "reply": "Late cancelled answer must never appear."}})
    page.wait_for_timeout(150)
    expect(chat.locator('[data-buddy-turn="assistant"]')).to_have_count(1)
    expect(chat).not_to_contain_text("Late cancelled answer")
    fixtures.queue.append({"pending": True})
    send(chat, "Another pending question.")
    expect(chat.get_by_role("status")).to_be_visible()
    late_close = take_pending_reply(page, fixtures)
    page.keyboard.press("Escape")
    expect(chat).to_have_count(0)
    expect(page.locator("[data-buddy-launcher]")).to_be_focused()
    fixtures.fulfill(late_close, {"body": {"used_ai": True, "reply": "Closed dialog answer must never appear."}})
    page.wait_for_timeout(150)
    chat = chat_open(page)
    expect(chat.locator('[data-buddy-turn="assistant"]')).to_have_count(1)
    expect(chat).not_to_contain_text("Closed dialog answer")
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


def nonmodal_navigation_and_topic_change(page, fixtures):
    visit(page, "/platform/")
    page.evaluate("window.__buddyIgnoreAbort = true")
    chat = chat_open(page)
    topics = chat.get_by_role("group", name="Conversation topic")
    fixtures.queue.append({"pending": True})
    send(chat, "Explain property sourcing while I browse the site.")
    first_pending = take_pending_reply(page, fixtures)
    status_count = len(fixtures.status_requests)

    # Reopening the existing topic from a real Services button is harmless.
    page.locator("[data-buddy-showcase]").get_by_role("button", name="Open Buddy", exact=True).focus()
    page.keyboard.press("Enter")
    expect(chat.get_by_role("status")).to_contain_text("thinking")
    expect(chat).to_have_attribute("data-buddy-readiness", "ready")
    assert len(fixtures.status_requests) == status_count, "Same-topic opening restarted readiness during a reply"
    assert page.evaluate("window.__buddyRequestAborted") == 0, "Same-topic opening cancelled the visitor's question"

    # Follow the site's actual client-side navigation without remounting chat.
    page.locator("footer").get_by_role("link", name="Pricing", exact=True).focus()
    page.keyboard.press("Enter")
    expect(page).to_have_url(re.compile(r"/pricing/?$"))
    expect(chat).to_be_visible()
    expect(topics.get_by_role("button", name="Property", exact=True)).to_have_attribute("aria-pressed", "true")
    expect(chat.get_by_role("status")).to_contain_text("thinking")
    assert len(fixtures.requests) == 1 and fixtures.requests[0]["topic"] == "property"
    assert len(fixtures.status_requests) == status_count, "Browsing another page restarted the active conversation"
    assert page.evaluate("window.__buddyRequestAborted") == 0, "Passive navigation cancelled the question"
    fixtures.fulfill(first_pending, {"body": {"used_ai": True, "reply": "Fixture property answer preserved across navigation."}})
    expect(chat.locator('[data-buddy-turn="assistant"]')).to_contain_text("Fixture property answer preserved across navigation.")
    expect(topics.get_by_role("button", name="Property", exact=True)).to_have_attribute("aria-pressed", "true")

    fixtures.queue.append({"pending": True})
    send(chat, "Another property question to supersede explicitly.")
    superseded = take_pending_reply(page, fixtures)
    page.locator("footer").get_by_role("link", name="Our Services", exact=True).focus()
    page.keyboard.press("Enter")
    expect(page).to_have_url(re.compile(r"/platform/?$"))
    showcase = page.locator("[data-buddy-showcase]")
    showcase.get_by_role("button", name="Care & support", exact=True).focus()
    page.keyboard.press("Enter")
    fixtures.status_queue.append({"pending": True})
    showcase.get_by_role("button", name="Open Buddy", exact=True).focus()
    page.keyboard.press("Enter")
    expect(chat).to_have_attribute("data-buddy-readiness", "loading")
    expect(topics.get_by_role("button", name="Support", exact=True)).to_have_attribute("aria-pressed", "true")
    expect(chat.locator("#buddy-question")).to_be_disabled()
    assert page.evaluate("window.__buddyRequestAborted") == 1, "Explicit topic change did not cancel the previous question"
    assert len(fixtures.requests) == 2, "Changing topic submitted a question automatically"
    fixtures.fulfill(take_pending_status(page, fixtures), {"body": {"configured": True}})
    expect(chat).to_have_attribute("data-buddy-readiness", "ready")
    expect(chat.get_by_role("alert")).to_contain_text("Request cancelled")
    expect(chat.get_by_role("button", name="Try again", exact=True)).to_have_count(0)

    fixtures.queue.append({"pending": True})
    send(chat, "Explain care and support partnerships instead.")
    current_pending = take_pending_reply(page, fixtures)
    assert fixtures.requests[-1]["topic"] == "support"
    fixtures.fulfill(superseded, {"body": {"used_ai": True, "reply": "Superseded property answer must never appear."}})
    page.wait_for_timeout(150)
    expect(chat).not_to_contain_text("Superseded property answer")
    expect(chat.locator('[data-buddy-turn="assistant"]')).to_have_count(1)
    expect(chat.get_by_role("status")).to_contain_text("thinking")
    expect(chat.get_by_role("button", name="Send", exact=True)).to_be_disabled()
    fixtures.fulfill(current_pending, {"body": {"used_ai": True, "reply": "Fixture current support answer."}})
    expect(chat.locator('[data-buddy-turn="assistant"]')).to_have_count(2)
    expect(chat.locator('[data-buddy-turn="assistant"]').last).to_contain_text("Fixture current support answer.")
    expect(topics.get_by_role("button", name="Support", exact=True)).to_have_attribute("aria-pressed", "true")
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
    chat.get_by_role("group", name="Conversation topic").get_by_role("button", name="Investment", exact=True).click()
    expect(chat.get_by_role("link", name="Explore pricing & fees", exact=True)).to_have_attribute("href", "/pricing")
    starter = chat.get_by_role("button", name="Can you explain the property sourcing and lease-facilitation services and their fees?", exact=True)
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
            ("retry-and-ai-proof", retry_and_refusal, {}),
            ("cancel-late-response-focus", cancellation_and_focus, {}),
            ("nonmodal-navigation-topic-pending", nonmodal_navigation_and_topic_change, {"reduced": True}),
            ("readiness-gate-recovery", readiness_gate, {"reduced": True}),
            ("readiness-cancel-timeout", readiness_cancel_timeout, {"reduced": True}),
            ("reduced-motion", reduced_motion, {"reduced": True}),
            ("artwork-fallback", missing_artwork, {"fail_atlas": True, "reduced": True}),
            ("short-viewport", short_viewport, {"reduced": True}),
        ]
        for width in (320, 390, 768, 1280):
            for name, run, options in cases:
                if width not in (390, 1280) and name != "floating-placement-minimise":
                    continue
                if name == "short-viewport" and width != 390:
                    continue
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
        browser.close()
except Exception as error:
    REPORT["failures"].append({"name": "suite-startup", "error": str(error)})
finally:
    server.shutdown()
    server.server_close()
    (OUT / "report.json").write_text(json.dumps(REPORT, indent=2), encoding="utf-8")
    print(json.dumps(REPORT, indent=2))

raise SystemExit(1 if REPORT["failures"] else 0)

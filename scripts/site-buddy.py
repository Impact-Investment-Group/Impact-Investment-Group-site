"""CI-only Buddy browser journeys. All AI responses are explicit local fixtures."""
import functools
import http.server
import json
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
CORS = {"Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Allow-Methods": "GET, POST, OPTIONS"}
INIT = """(() => {
  window.__buddyFrames = 0;
  const raf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = callback => raf(time => { window.__buddyFrames++; callback(time); });
  window.__buddyFetchOptions = [];
  window.__buddyIgnoreAbort = false;
  window.__buddyStatusOptions = [];
  window.__buddyStatusAborted = 0;
  window.__buddyIgnoreStatusAbort = false;
  const fetch = window.fetch.bind(window);
  window.fetch = (url, options) => {
    if (String(url).endsWith('/public/buddy')) {
      window.__buddyFetchOptions.push({credentials: options?.credentials, hasSignal: options?.signal instanceof AbortSignal});
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
        self.fail_atlas = fail_atlas

    def answer(self, reply, **extra):
        self.queue.append({"status": 200, "body": {"used_ai": True, "reply": reply, **extra}})

    def fulfill(self, route, payload):
        route.fulfill(status=payload.get("status", 200), content_type="application/json", headers=CORS, body=json.dumps(payload.get("body", {})))

    def handle(self, route):
        request = route.request
        path = urlparse(request.url).path
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
        elif self.fail_atlas and path.endswith("/images/buddy/atlas.webp"):
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
    expect(chat).to_have_attribute("data-buddy-readiness", "ready")
    expect(chat.get_by_label("Your question for Buddy", exact=True)).to_be_focused()
    return chat


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


def topics_and_keyboard(page, fixtures):
    visit(page)
    explorer = page.locator("[data-buddy-explorer]")
    explorer.scroll_into_view_if_needed()
    stage = explorer.locator("[data-buddy-stage]")
    character = stage.locator("[data-buddy-form]")
    canvas = stage.locator("canvas")
    expect(canvas).to_be_visible()
    expect(canvas).to_have_count(1)
    page.evaluate("window.__initialBuddyCanvas = document.querySelector('[data-buddy-stage] canvas')")
    expected_height = stage.bounding_box()["height"]
    initial_pixels = canvas.evaluate("n => n.toDataURL()")
    tabs = explorer.get_by_role("tablist", name="Explore with Buddy").get_by_role("tab")
    expect(tabs).to_have_count(3)
    tabs.first.focus()
    page.keyboard.press("ArrowRight")
    expect(tabs.nth(1)).to_be_focused()
    expect(tabs.nth(1)).to_have_attribute("aria-selected", "true")
    expect(character).to_have_attribute("data-buddy-form", "investment")
    expect(explorer.get_by_role("tabpanel")).to_have_count(1)
    expect(explorer.get_by_role("tabpanel").get_by_role("link")).to_have_attribute("href", "/pricing")
    page.wait_for_timeout(1100)
    assert canvas.evaluate("n => n.toDataURL()") != initial_pixels, "Changing topic did not change rendered Buddy artwork"
    assert page.evaluate("window.__initialBuddyCanvas === document.querySelector('[data-buddy-stage] canvas')"), "Topic selection replaced the character instead of transforming it"
    assert abs(stage.bounding_box()["height"] - expected_height) < 1, "Topic selection shifted the character layout"
    page.keyboard.press("End")
    expect(tabs.last).to_be_focused()
    expect(character).to_have_attribute("data-buddy-form", "support")
    expect(explorer.get_by_role("tabpanel").get_by_role("link")).to_have_attribute("href", "/partners")
    page.keyboard.press("Home")
    expect(tabs.first).to_be_focused()
    expect(character).to_have_attribute("data-buddy-form", "property")
    page.keyboard.press("ArrowLeft")
    expect(tabs.last).to_be_focused()
    expect(character).to_have_attribute("data-buddy-form", "support")
    # Opening the chat preserves the chosen topic but does not send a prompt.
    trigger = explorer.get_by_role("tabpanel").get_by_role("button", name="Ask Buddy", exact=True)
    trigger.click()
    chat = page.locator("[data-buddy-chat]")
    expect(chat.get_by_role("group", name="Conversation topic").get_by_role("button", name="Support", exact=True)).to_have_attribute("aria-pressed", "true")
    expect(chat.get_by_label("Your question for Buddy", exact=True)).to_be_focused()
    assert not fixtures.requests, "Opening an explainer sent a question without a user action"
    no_overflow(page)
    page.keyboard.press("Escape")
    expect(chat).to_have_count(0)
    expect(trigger).to_be_focused()
    page.wait_for_timeout(4400)
    frames = page.evaluate("window.__buddyFrames")
    page.wait_for_timeout(500)
    assert page.evaluate("window.__buddyFrames") - frames < 4, "Buddy's idle state retained an animation loop"
    no_overflow(page)
    explorer.screenshot(path=str(OUT / f"explorer-{page.viewport_size['width']}.png"), animations="disabled")


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
    assert fixtures.requests == [{"message": first_question, "history": [], "topic": "investment"}], fixtures.requests
    first_reply = "Fixture answer: a sourcing service has an agreed scope."
    fixtures.fulfill(fixtures.pending.pop(), {"body": {"used_ai": True, "reply": first_reply, "sources": [
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
        {"reply": "Missing AI proof must not be shown"},
        {"used_ai": True, "reply": "   "},
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
    no_overflow(page)


def cancellation_and_focus(page, fixtures):
    visit(page)
    page.evaluate("window.__buddyIgnoreAbort = true")
    chat = chat_open(page)
    fixtures.queue.append({"pending": True})
    send(chat, "First question to cancel.")
    expect(chat.get_by_role("status")).to_contain_text("thinking")
    late = fixtures.pending.pop()
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
    late_close = fixtures.pending.pop()
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
    for response in [{"status": 503}, {"body": {"configured": "true"}}, {"body": {}}]:
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
    visit(page)
    explorer = page.locator("[data-buddy-explorer]")
    explorer.scroll_into_view_if_needed()
    character = explorer.locator("[data-buddy-stage] [data-buddy-form]")
    expect(character.locator("canvas")).to_be_visible()
    explorer.get_by_role("tab").last.click()
    expect(character).to_have_attribute("data-buddy-form", "support")
    page.wait_for_timeout(250)
    frames = page.evaluate("window.__buddyFrames")
    explorer.get_by_role("button", name="Replay Buddy's gesture", exact=True).click()
    expect(explorer.locator("[data-buddy-stage] canvas")).to_be_visible()
    page.wait_for_timeout(500)
    assert page.evaluate("window.__buddyFrames") - frames < 4, "Reduced-motion gesture scheduled an animation loop"
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
    stage = page.locator("[data-buddy-stage]")
    stage.scroll_into_view_if_needed()
    expect(stage.locator("canvas")).to_be_hidden()
    expect(stage.locator("svg")).to_be_visible()
    bounds = stage.bounding_box()
    assert bounds["width"] >= 200 and bounds["height"] >= 200, "Missing artwork collapsed the reserved stage"
    page.locator("[data-buddy-explorer]").get_by_role("tab").last.click()
    expect(stage.locator("[data-buddy-form]")).to_have_attribute("data-buddy-form", "support")
    expect(stage.locator("svg")).to_be_visible()
    chat = chat_open(page)
    fixtures.answer("Fixture answer with unavailable artwork.")
    send(chat, "How does the service work?")
    expect(chat.locator('[data-buddy-turn="assistant"]')).to_contain_text("Fixture answer with unavailable artwork.")
    no_overflow(page)


try:
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        cases = [
            ("topics-keyboard-single-character", topics_and_keyboard, {}),
            ("fetch-history-sources", real_fetch_contract, {}),
            ("retry-and-ai-proof", retry_and_refusal, {}),
            ("cancel-late-response-focus", cancellation_and_focus, {}),
            ("readiness-gate-recovery", readiness_gate, {"reduced": True}),
            ("readiness-cancel-timeout", readiness_cancel_timeout, {"reduced": True}),
            ("reduced-motion", reduced_motion, {"reduced": True}),
            ("artwork-fallback", missing_artwork, {"fail_atlas": True, "reduced": True}),
            ("short-viewport", short_viewport, {"reduced": True}),
        ]
        for width in (390, 1280):
            for name, run, options in cases:
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
finally:
    server.shutdown()
    server.server_close()
    (OUT / "report.json").write_text(json.dumps(REPORT, indent=2), encoding="utf-8")
    print(json.dumps(REPORT, indent=2))

raise SystemExit(1 if REPORT["failures"] else 0)

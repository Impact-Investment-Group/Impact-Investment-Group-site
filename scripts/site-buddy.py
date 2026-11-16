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
from buddy_corner_checks import assert_corner_placement

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
BUDDY_FORM_CHANGE_MS = 3200
# Exact presentation copy authorised in docs/WAVE1290_COPY.md.
CHAT_COPY_ALLOWED = {
    "greeting": "Hi, I'm Buddy. How can I help?",
    "about": "About this chat",
    "questions": ["How do you source properties?", "Who do you work with?", "How can I get started?"],
}
CORS = {"Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Allow-Methods": "GET, POST, OPTIONS"}
INIT = """(() => {
  window.__buddyDraws = 0;
  window.__buddyShowcaseDraws = 0;
  window.__buddyAmbientDraws = 0;
  window.__buddyAmbientKinds = [];
  function record(canvas) {
    if (canvas.closest('[data-buddy-form]')) window.__buddyDraws++;
    if (canvas.closest('[data-buddy-actor][data-buddy-placement="page"]')) window.__buddyShowcaseDraws++;
    const companion = canvas.closest('[data-buddy-actor][data-buddy-placement="corner"] [data-buddy-ambient]');
    if (companion) {
      window.__buddyAmbientDraws++;
      const kind = companion.dataset.buddyAmbient;
      if (window.__buddyAmbientKinds.at(-1) !== kind) window.__buddyAmbientKinds.push(kind);
    }
  }
  for (const Context of [window.WebGLRenderingContext, window.WebGL2RenderingContext]) {
    if (!Context) continue;
    const clear = Context.prototype.clear;
    Context.prototype.clear = function (...args) { record(this.canvas); return clear.apply(this,args); };
  }
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

# All voice journeys use callbacks from this local fake. No microphone is
# opened and no browser speech service is contacted, including failure cases.
SPEECH_INIT = """(() => {
  const state = window.__buddySpeech = {instances: [], starts: 0, stops: 0, aborts: 0, mediaRequests: 0};
  class Recognition {
    constructor() { state.instances.push(this); }
    start() {
      state.starts++;
      this.callbacks = {result: this.onresult, error: this.onerror, end: this.onend};
    }
    stop() { state.stops++; }
    abort() { state.aborts++; }
  }
  state.result = (index, text, final = true, late = false) => {
    const rec = state.instances[index], result = [{transcript: text}];
    result.isFinal = final;
    (late ? rec.callbacks.result : rec.onresult)?.({resultIndex: 0, results: [result]});
  };
  state.error = (index, error) => state.instances[index].onerror?.({error});
  state.end = index => state.instances[index].onend?.();
  Object.defineProperty(window, 'SpeechRecognition', {configurable: true, value: __SUPPORTED__ ? Recognition : undefined});
  Object.defineProperty(window, 'webkitSpeechRecognition', {configurable: true, value: undefined});
  if (navigator.mediaDevices) navigator.mediaDevices.getUserMedia = () => {
    state.mediaRequests++;
    return Promise.reject(new Error('Real media is forbidden in this fixture'));
  };
})()"""


class Fixtures:
    def __init__(self, fail_engine=False):
        self.queue = []
        self.requests = []
        self.pending = []
        self.status_queue = []
        self.status_requests = []
        self.pending_status = []
        self.unexpected_posts = []
        self.atlas_requests = []
        self.hand_requests = []
        self.chat_chunks = []
        self.fail_engine = fail_engine

    def answer(self, reply, **extra):
        self.queue.append({"status": 200, "body": {"used_ai": True, "reply": reply, **extra}})

    def fulfill(self, route, payload):
        route.fulfill(status=payload.get("status", 200), content_type="application/json", headers=CORS, body=json.dumps(payload.get("body", {})))

    def handle(self, route):
        request = route.request
        path = urlparse(request.url).path
        if path == V2_ATLAS_PATH:
            self.atlas_requests.append(request.url)
        if "hands-v3" in path:
            self.hand_requests.append(request.url)
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
        elif self.fail_engine and 'buddy-3d' in path and path.endswith('.js'):
            route.abort()
        elif request.url.startswith(BASE + "/"):
            route.continue_()
        else:
            # No live API or external model request is needed by these tests.
            route.abort()


def context_for(browser, width=1280, reduced=False, fail_engine=False, speech=True):
    context = browser.new_context(viewport={"width": width, "height": 900}, reduced_motion="reduce" if reduced else "no-preference")
    fixtures = Fixtures(fail_engine=fail_engine)
    context.route("**/*", fixtures.handle)
    context.add_init_script(INIT + SPEECH_INIT.replace('__SUPPORTED__', 'true' if speech else 'false'))
    return context, fixtures


def visit(page, path="/"):
    page.goto(BASE + path, wait_until="networkidle")
    expect(page.locator("[data-buddy-launcher]")).to_be_visible()


def buddy_character(page):
    return page.locator("[data-buddy-actor] [data-buddy-form]")


def settled_actor(page, placement):
    actor = page.locator("[data-buddy-actor]")
    expect(actor).to_have_count(1)
    expect(page.locator("[data-buddy-form]")).to_have_count(1)
    if placement == "corner":
        assert_corner_placement(page)
    else:
        expect(actor).to_be_visible()
    expect(actor).to_have_attribute("data-buddy-placement", placement)
    expect(actor).to_have_attribute("data-buddy-travelling", "false")
    return actor


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
    settled_actor(page, "chat")
    expect(chat.locator("[data-buddy-form], canvas")).to_have_count(0)
    slot = chat.locator('[data-buddy-slot="chat"]').bounding_box()
    actor = page.locator("[data-buddy-actor]").bounding_box()
    assert abs(actor["x"] - slot["x"]) < 1 and abs(actor["y"] - slot["y"]) < 1, "The single actor did not arrive below its speech bubble"
    width, height = page.viewport_size['width'], page.viewport_size['height']
    expected_size = 64 if height <= 400 else 112 if height <= 650 else 176 if width < 640 else 192
    assert abs(actor["width"] - expected_size) < 1, "Speech Buddy lost its responsive character size"
    assert_speech_layout(page)
    return chat


def assert_speech_layout(page):
    chat = page.locator('[data-buddy-chat]')
    expect(chat).to_have_attribute('data-buddy-interface', 'speech')
    expect(chat.locator('header')).to_have_count(0)
    assert chat.evaluate("n => { const s=getComputedStyle(n); return s.backgroundColor === 'rgba(0, 0, 0, 0)' && s.boxShadow === 'none'; }"), 'A surrounding chat card returned'
    bubble = chat.locator('[data-buddy-speech-bubble]').bounding_box()
    slot = chat.locator('[data-buddy-slot="chat"]').bounding_box()
    composer = chat.locator('form').bounding_box()
    assert bubble['y'] + bubble['height'] <= slot['y'] + 1, 'The reply bubble is not above Buddy'
    assert slot['y'] + slot['height'] <= composer['y'] + 1, 'The composer overlaps Buddy'
    for name in ('Close Buddy', 'Speak to Buddy', 'Send'):
        control = chat.get_by_role('button', name=name, exact=True)
        box = control.bounding_box()
        assert box['width'] >= 44 and box['height'] >= 44, f'{name} lost its 44px target'


def assert_fixed_widget(page):
    widget = page.locator("[data-buddy-widget]")
    expect(widget).to_be_visible()
    assert widget.evaluate("n => getComputedStyle(n).position") == "fixed", "Buddy is in page flow instead of floating"
    box = widget.bounding_box()
    width, height = page.viewport_size["width"], page.viewport_size["height"]
    assert box["x"] >= 0 and box["y"] >= 0, "Buddy is clipped above or left of the viewport"
    assert 0 <= width - box["x"] - box["width"] <= 40, "Buddy is not at the right edge"
    assert 0 <= height - box["y"] - box["height"] <= 120, "Buddy is not near the bottom edge"
    assert box["width"] <= 210 and box["height"] <= 300, "Floating Buddy has become a page-sized placement"
    actor = settled_actor(page, "corner")
    assert actor.evaluate("n => getComputedStyle(n).position") == "fixed", "Character actor is not a fixed overlay"
    character = actor.bounding_box()
    for control in widget.get_by_role("button").all():
        control_box = control.bounding_box()
        assert control_box["width"] >= 44 and control_box["height"] >= 44, "Buddy control misses the 44px touch target"
        assert control_box["x"] >= 0 and control_box["y"] >= 0, "Buddy control is clipped above or left"
        assert control_box["x"] + control_box["width"] <= width + 1 and control_box["y"] + control_box["height"] <= height + 1, "Buddy control leaves the viewport"
    return character


def find_ambient_corner(page, require_ambient=True):
    """Find real homepage whitespace without changing its content or layout."""
    assert urlparse(page.url).path == "/", "Ambient eligibility must be exercised on the real homepage"
    character = buddy_character(page)
    step = max(1, page.viewport_size["height"] // 3)
    observed = []
    for index in range(120):
        limit = page.evaluate("Math.max(0, document.documentElement.scrollHeight - innerHeight)")
        offset = min(index * step, limit)
        page.evaluate("top => scrollTo({top, behavior:'instant'})", offset)
        page.wait_for_timeout(180)
        actor = settled_actor(page, "corner")
        if not actor.is_visible():
            observed.append({"scroll": offset, "placement": "no-clear-space"})
            if offset >= limit:
                break
            continue
        if not require_ambient:
            assert_fixed_widget(page)
            return
        state = character.get_attribute("data-buddy-ambient")
        if state != "off":
            # A genuine topic change may still be turning Buddy. It must finish
            # naturally before this location can qualify as a quiet corner.
            page.wait_for_function("document.querySelector('[data-buddy-actor] [data-buddy-form]')?.dataset.buddyAmbient !== 'changing'",
                                   timeout=BUDDY_FORM_CHANGE_MS + 1500)
            page.wait_for_timeout(300)
            state = character.get_attribute("data-buddy-ambient")
            if state == "rest":
                assert_fixed_widget(page)
                no_overflow(page)
                return
        observed.append({"scroll": offset, "ambient": state})
        if offset >= limit:
            break
    raise AssertionError(f"No clear real-page corner enabled ambient Buddy within the bounded homepage search: {observed}")


def assert_canvas_artwork(character):
    canvas = character.locator("canvas")
    expect(canvas).to_be_visible()
    expect(canvas).to_have_count(1)
    expect(character).to_have_attribute("data-buddy-version", "v5-hologram")
    expect(character).to_have_attribute("data-buddy-artwork", "3d-glb")
    expect(character).to_have_attribute("data-buddy-hands", "rigged-left-right")
    expect(character).to_have_attribute("data-buddy-status", "ready")
    assert canvas.evaluate("n => { const c=document.createElement('canvas');c.width=n.width;c.height=n.height;const x=c.getContext('2d');x.drawImage(n,0,0);return x.getImageData(0,0,c.width,c.height).data.some((v,i)=>i%4===3&&v>0); }"), "Buddy's canvas is blank"
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


def simple_chat_disclosure(page, fixtures):
    visit(page)
    chat = chat_open(page)
    expect(chat.get_by_role("heading", name="Buddy", exact=True)).to_have_class('sr-only')
    for retired in ["Homes & property", "Costs & investment", "Care & support"]:
        expect(chat.get_by_text(retired, exact=True)).to_have_count(0)
    expect(chat.locator("[data-buddy-greeting]")).to_have_text(CHAT_COPY_ALLOWED["greeting"])
    expect(chat.locator("[data-buddy-suggestions] button")).to_have_text(CHAT_COPY_ALLOWED["questions"])
    about = chat.get_by_role("button", name=CHAT_COPY_ALLOWED["about"], exact=True)
    expect(about).to_have_attribute("aria-controls", "buddy-notices")
    expect(about).to_have_attribute("aria-expanded", "false")
    expect(chat.locator("#buddy-notices")).to_be_hidden()
    question = chat.get_by_label("Your question for Buddy", exact=True)
    question.fill("Keep this unfinished question.")
    about.focus()
    page.keyboard.press("Enter")
    expect(about).to_have_attribute("aria-expanded", "true")
    expect(chat.locator("#buddy-privacy")).to_have_text("Keep personal details out of this chat. Sending a question or choosing a suggestion sends your conversation to our AI service.")
    expect(chat.locator("#buddy-boundary")).to_have_text("AI answers can be mistaken. Check the linked information with our team before making a decision.")
    expect(chat.locator("#buddy-notices")).to_be_visible()
    expect(question).to_have_value("Keep this unfinished question.")
    expect(about).to_be_focused()
    assert not fixtures.requests, "Opening the notice submitted a draft"
    page.keyboard.press("Space")
    expect(about).to_have_attribute("aria-expanded", "false")
    expect(chat.locator("#buddy-notices")).to_be_hidden()
    for index, example in enumerate(CHAT_COPY_ALLOWED["questions"]):
        answer = f"Fixture reply to compact example {index}."
        fixtures.answer(answer)
        chat.locator("[data-buddy-suggestions]").get_by_role("button", name=example, exact=True).click()
        expect(chat.locator('[data-buddy-turn="assistant"]')).to_contain_text(answer)
        assert fixtures.requests[-1]["message"] == example, "A short chip submitted different words"
        assert len(fixtures.requests) == index + 1, "A chip submitted more than one request"
        expect(chat.locator("[data-buddy-turn]")).to_have_count(2)
        expect(chat.locator('[data-buddy-turn="user"]')).to_be_hidden()
        expect(chat.locator('[data-buddy-turn="assistant"]')).to_be_visible()
        expect(chat.locator("[data-buddy-suggestions]")).to_have_count(0)
        if index < len(CHAT_COPY_ALLOWED["questions"]) - 1:
            chat.get_by_role("button", name="New conversation", exact=True).click()
    no_overflow(page)
    chat.screenshot(path=str(OUT / f"simple-chat-{page.viewport_size['width']}.png"), animations="disabled")


def speech_input(page, fixtures):
    visit(page)
    chat = chat_open(page)
    question = chat.get_by_label('Your question for Buddy', exact=True)
    microphone = chat.get_by_role('button', name='Speak to Buddy', exact=True)
    expect(microphone).to_be_enabled()
    question.fill('Please explain')
    microphone.click()
    expect(chat.get_by_role('button', name='Stop listening', exact=True)).to_have_attribute('aria-pressed', 'true')
    expect(chat).to_have_attribute('data-buddy-activity', 'listen')
    assert page.evaluate("window.__buddySpeech.instances[0].lang") == 'en-GB'
    page.evaluate("window.__buddySpeech.result(0, 'property sourcing', false)")
    expect(question).to_have_value('Please explain property sourcing')
    assert not fixtures.requests, 'Interim speech submitted an AI question'
    chat.get_by_role('button', name='Stop listening', exact=True).click()
    assert page.evaluate('window.__buddySpeech.stops') == 1
    # A final result may arrive after Stop, but it remains an editable draft.
    page.evaluate("window.__buddySpeech.result(0, 'property sourcing', true); window.__buddySpeech.end(0)")
    expect(question).to_have_value('Please explain property sourcing')
    page.evaluate("window.__buddySpeech.result(0, 'duplicate result', true, true)")
    expect(question).to_have_value('Please explain property sourcing')
    assert not fixtures.requests, 'Final speech was sent before review'
    question.fill('Please explain property sourcing for me.')
    fixtures.answer('Fixture answer to the reviewed voice draft.', sources=[
        {'title': 'Our services', 'url': 'https://www.impactinvestmentgroup.co.uk/platform'},
    ])
    chat.get_by_role('button', name='Send', exact=True).click()
    expect(chat.locator('[data-buddy-turn="assistant"]')).to_contain_text('Fixture answer to the reviewed voice draft.')
    assert len(fixtures.requests) == 1 and fixtures.requests[0]['message'] == 'Please explain property sourcing for me.'

    # Manual edits cancel recognition; queued callbacks from that attempt must
    # not overwrite what the visitor typed or create a second conversation.
    question.fill('Original draft.')
    microphone.click()
    question.fill('My typed replacement.')
    page.evaluate("window.__buddySpeech.result(1, 'late words after typing', true, true)")
    expect(question).to_have_value('My typed replacement.')
    expect(microphone).to_have_attribute('aria-pressed', 'false')
    microphone.click()
    chat.get_by_role('button', name='Close Buddy', exact=True).click()
    page.evaluate("window.__buddySpeech.result(2, 'late words after close', true, true)")
    chat = chat_open(page)
    question = chat.get_by_label('Your question for Buddy', exact=True)
    microphone = chat.get_by_role('button', name='Speak to Buddy', exact=True)
    expect(question).to_have_value('My typed replacement.')
    assert len(fixtures.requests) == 1, 'Closing or reopening submitted voice text'

    microphone.click()
    chat.get_by_role('button', name='New conversation', exact=True).click()
    page.evaluate("window.__buddySpeech.result(3, 'late words after clear', true, true)")
    expect(question).to_have_value('')
    expect(chat.locator('[data-buddy-turn]')).to_have_count(0)
    question.fill('Keep this after permission denial.')
    microphone.click()
    page.evaluate("window.__buddySpeech.error(4, 'not-allowed')")
    expect(chat.get_by_role('status')).to_contain_text('Microphone access was declined. You can type your question instead.')
    expect(question).to_have_value('Keep this after permission denial.')
    expect(question).to_be_enabled()
    expect(microphone).to_have_attribute('aria-pressed', 'false')
    assert page.evaluate('window.__buddySpeech.aborts') >= 4
    assert page.evaluate('window.__buddySpeech.mediaRequests') == 0
    assert len(fixtures.requests) == 1, 'A cancelled or denied recording submitted text'

    # Stop can precede a recognizer's final callback. Editing at this point
    # must abort the still-pending session, even though listening is now false.
    question.fill('Draft before stopping.')
    microphone.click()
    chat.get_by_role('button', name='Stop listening', exact=True).click()
    expect(microphone).to_have_attribute('aria-pressed', 'false')
    aborts_before_edit = page.evaluate('window.__buddySpeech.aborts')
    question.fill('Keep this after permission denial.')
    assert page.evaluate('window.__buddySpeech.aborts') == aborts_before_edit + 1, 'Typing after Stop left recognition active'
    page.evaluate("window.__buddySpeech.result(5, 'late final after stopped edit', true, true)")
    expect(question).to_have_value('Keep this after permission denial.')
    assert len(fixtures.requests) == 1

    # Remove the browser capability, then reopen to exercise the real fallback.
    chat.get_by_role('button', name='Close Buddy', exact=True).click()
    page.evaluate("Object.defineProperty(window, 'SpeechRecognition', {configurable:true, value:undefined})")
    chat = chat_open(page)
    expect(chat.get_by_role('button', name='Speak to Buddy', exact=True)).to_be_disabled()
    expect(chat.get_by_role('button', name='Speak to Buddy', exact=True)).to_have_attribute('title', 'Voice input is unavailable in this browser. You can type instead.')
    expect(chat.get_by_label('Your question for Buddy', exact=True)).to_have_value('Keep this after permission denial.')
    fixtures.answer('Fixture typed fallback still works.')
    send(chat, 'I can still type my question.')
    expect(chat.locator('[data-buddy-turn="assistant"]')).to_contain_text('Fixture typed fallback still works.')
    assert len(fixtures.requests) == 2
    assert page.evaluate('window.__buddySpeech.starts') == 6
    assert page.evaluate('window.__buddySpeech.mediaRequests') == 0
    no_overflow(page)
    chat.screenshot(path=str(OUT / f'speech-input-{page.viewport_size["width"]}.png'), animations='disabled')
    # Simulate a mobile keyboard changing only the visual viewport. The layout
    # viewport deliberately stays tall; a window resize would miss this bug.
    page.evaluate("""() => {
      const viewport = visualViewport;
      window.__buddyViewportFixture = {height: viewport.height, offsetTop: viewport.offsetTop};
      for (const key of ['height', 'offsetTop']) Object.defineProperty(viewport, key,
        {configurable:true, get:() => window.__buddyViewportFixture[key]});
    }""")
    original_height = page.evaluate('innerHeight')
    try:
        for height, offset, character_size in ((320, 0, 64), (500, 60, 112)):
            page.evaluate("""value => {
              Object.assign(window.__buddyViewportFixture, value);
              visualViewport.dispatchEvent(new Event('resize'));
              visualViewport.dispatchEvent(new Event('scroll'));
            }""", {'height': height, 'offsetTop': offset})
            assert page.evaluate('innerHeight') == original_height, 'Keyboard fixture changed the layout viewport'
            page.wait_for_function("""size => {
              const actor=document.querySelector('[data-buddy-actor]');
              return actor.dataset.buddyTravelling === 'false' && Math.abs(actor.getBoundingClientRect().width-size)<1;
            }""", arg=character_size)
            for control in (chat.get_by_label('Your question for Buddy', exact=True),
                            chat.get_by_role('button', name='Close Buddy', exact=True)):
                control.focus()
                expect(control).to_be_focused()
                box = control.bounding_box()
                assert box['y'] >= offset - 1 and box['y'] + box['height'] <= offset + height + 1, 'Keyboard obscures a speech control'
            bounds = chat.bounding_box()
            assert bounds['y'] >= offset - 1 and bounds['y'] + bounds['height'] <= offset + height + 1, 'Speech interface leaves the visual viewport'
            page.screenshot(path=str(OUT / f'speech-keyboard-{page.viewport_size["width"]}-{height}.png'))
        assert len(fixtures.requests) == 2, 'Keyboard viewport changes submitted a question'
    finally:
        page.evaluate("""() => {
          delete visualViewport.height; delete visualViewport.offsetTop;
          visualViewport.dispatchEvent(new Event('resize'));
          visualViewport.dispatchEvent(new Event('scroll'));
        }""")


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
    assert_fixed_widget(page)
    page.screenshot(path=str(OUT / f"home-original-layout-{page.viewport_size['width']}.png"))
    find_ambient_corner(page, require_ambient=False)
    assert_canvas_artwork(buddy_character(page))
    assert not fixtures.atlas_requests, "Vector Buddy requested the retired body atlas"
    assert not fixtures.hand_requests, "Vector Buddy requested bitmap hands"
    assert not fixtures.chat_chunks, "The assistant dialog loaded before it was opened"
    assert not fixtures.status_requests and not fixtures.requests, "Initial page load called the AI service"
    assert_fixed_widget(page)
    initial = page.locator('[data-buddy-launcher] > span:last-child').bounding_box()
    page.evaluate("scrollTo({top:document.documentElement.scrollHeight, behavior:'instant'})")
    page.wait_for_timeout(150)
    assert_fixed_widget(page)
    scrolled = page.locator('[data-buddy-launcher] > span:last-child').bounding_box()
    assert abs(scrolled["y"] - initial["y"]) < 1, "Buddy's launcher label scrolls away with the page"
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
    expect(chat.locator("[data-buddy-greeting]")).to_have_text(CHAT_COPY_ALLOWED["greeting"])
    expect(chat.locator("[data-buddy-greeting]")).to_be_in_viewport()
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
    expect(chat.get_by_role("button", name=CHAT_COPY_ALLOWED["questions"][0], exact=True)).to_be_focused()
    close.focus()
    page.keyboard.press("Shift+Tab")
    # Close is the first speech-bubble control. Its boundary returns to the
    # underlying page, while ordinary Tab still reaches the suggestions.
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
    expect(page.locator("main [data-buddy-form]")).to_have_count(0)
    expect(showcase.locator("[data-buddy-slot=page]")).to_have_count(1)
    centre_section(page, '[data-buddy-showcase] [data-buddy-slot="page"]')
    settled_actor(page, "page")
    character = buddy_character(page)
    canvas = assert_canvas_artwork(character)
    stage = character.bounding_box()
    # Page and corner placements have independent reserved geometry.
    expected_stage = 160 if page.viewport_size['width'] < 640 else 210
    assert abs(stage["width"] - expected_stage) <= 1, "Services Buddy lost its reserved showcase size"
    page.evaluate("window.__initialBuddyCanvas = document.querySelector('[data-buddy-actor] canvas')")
    initial_pixels = canvas.evaluate("n => n.toDataURL()")
    controls = showcase.get_by_role("group", name="Explore Buddy's forms")
    expect(controls.get_by_role("button")).to_have_count(3)
    costs = controls.get_by_role("button", name="Costs", exact=True)
    costs.focus()
    page.keyboard.press("Enter")
    expect(costs).to_have_attribute("aria-pressed", "true")
    centre_section(page, '[data-buddy-showcase] [data-buddy-slot="page"]')
    settled_actor(page, "page")
    expect(character).to_have_attribute("data-buddy-form", "investment")
    page.wait_for_timeout(BUDDY_FORM_CHANGE_MS + 300)
    assert canvas.evaluate("n => n.toDataURL()") != initial_pixels, "Changing form did not change the rendered artwork"
    assert page.evaluate("window.__initialBuddyCanvas === document.querySelector('[data-buddy-actor] canvas')"), "Selecting a form replaced the character canvas"
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
    expect(buddy_character(page)).to_have_attribute("data-buddy-form", "support")
    expect(chat.get_by_role("group", name="Conversation topic")).to_have_count(0)
    expect(page.locator("[data-buddy-widget]:visible")).to_have_count(0)
    assert not fixtures.requests, "The services showcase sent a question without a user action"
    page.keyboard.press("Escape")
    expect(chat).to_have_count(0)
    expect(trigger).to_be_focused()
    centre_section(page, '[data-buddy-showcase] [data-buddy-slot="page"]')
    settled_actor(page, "page")
    # This is the same living companion, now acting in the page placement.
    draws = page.evaluate("window.__buddyShowcaseDraws")
    page.wait_for_timeout(500)
    assert page.evaluate("window.__buddyShowcaseDraws") > draws, "Buddy became a static picture at the page placement"
    assert page.evaluate("window.__initialBuddyCanvas === document.querySelector('[data-buddy-actor] canvas')"), "Chat opening replaced the one character renderer"
    showcase.screenshot(path=str(OUT / f"services-showcase-{page.viewport_size['width']}.png"), animations="disabled")
    centre_section(page, "footer")
    settled_actor(page, "corner")
    draws = page.evaluate("window.__buddyShowcaseDraws")
    page.wait_for_timeout(350)
    assert page.evaluate("window.__buddyShowcaseDraws") == draws, "An offscreen page character retained a duplicate animation loop"
    # The showcase must stay confined to Services, including after navigation.
    for path in ("/", "/pricing/", "/partners/"):
        visit(page, path)
        expect(page.locator("[data-buddy-showcase]")).to_have_count(0)
        if path == "/":
            expect(page.locator("main [data-buddy-form]")).to_have_count(0)
        if path != "/partners/":
            assert_fixed_widget(page)
        expect(page.locator("[data-buddy-form]")).to_have_count(1)
        no_overflow(page)


def real_fetch_contract(page, fixtures):
    visit(page)
    chat = chat_open(page)
    character = buddy_character(page)
    canvas = assert_canvas_artwork(character)
    expect(character).to_have_attribute('data-buddy-form', 'property')
    page.evaluate("window.__chatBuddyCanvas = document.querySelector('[data-buddy-actor] canvas')")
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
    # The 3.2-second morph completes before the accepted answer's speaking
    # gesture settles. Talk must still be active after the new form arrives.
    page.wait_for_timeout(BUDDY_FORM_CHANGE_MS + 300)
    expect(chat).to_have_attribute('data-buddy-activity', 'talk')
    expect(chat).to_have_attribute('data-buddy-activity', 'idle', timeout=5000)
    page.wait_for_timeout(600)
    assert canvas.evaluate("n => n.toDataURL()") != first_pixels, "Accepted conversation topic did not change Buddy's artwork"
    assert page.evaluate("window.__chatBuddyCanvas === document.querySelector('[data-buddy-actor] canvas')"), "Topic inference replaced Buddy's canvas"
    assert abs(character.bounding_box()['height'] - first_box['height']) < 1, "Inferred form changed the reserved character stage"
    second_reply = 'Fixture follow-up: <img src=x onerror="alert(1)"> is plain text.'
    fixtures.answer(second_reply, topic='support')
    send(chat, "How does care and support connect to this?")
    expect(chat.locator('[data-buddy-turn="assistant"]')).to_have_count(2)
    expect(chat.locator('[data-buddy-turn="assistant"]').last).to_contain_text(second_reply)
    expect(chat.locator('[data-buddy-turn="assistant"]').first).to_be_hidden()
    expect(chat.locator('[data-buddy-turn="user"]:visible')).to_have_count(0)
    history = chat.get_by_role('button', name='Conversation history', exact=True)
    expect(history).to_have_attribute('aria-pressed', 'false')
    question_input = chat.get_by_label('Your question for Buddy', exact=True)
    question_input.fill('Keep this draft while reading history.')
    history.click()
    expect(history).to_have_attribute('aria-pressed', 'true')
    expect(chat.locator('[data-buddy-turn]:visible')).to_have_count(4)
    expect(chat.get_by_role('link', name='Our pricing', exact=True)).to_be_visible()
    expect(question_input).to_have_value('Keep this draft while reading history.')
    assert len(fixtures.requests) == 2, 'Reading history sent a question'
    history.click()
    expect(chat.locator('[data-buddy-turn]:visible')).to_have_count(1)
    expect(chat.locator('[data-buddy-turn="assistant"]').last).to_be_visible()
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
    assert page.evaluate("window.__chatBuddyCanvas === document.querySelector('[data-buddy-actor] canvas')"), "Rapid accepted topic changes replaced Buddy's canvas"
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
    fixtures.answer("You're welcome.")
    send(chat, "Thanks Buddy!")
    expect(chat.locator('[data-buddy-turn="assistant"]')).to_have_count(2)
    expect(chat).to_have_attribute('data-buddy-activity', 'approve')
    expect(page.locator('[data-buddy-slot="chat"]')).to_have_attribute('data-buddy-slot-action', 'approve')
    chat.get_by_label("Your question for Buddy", exact=True).fill("A new question")
    expect(chat).to_have_attribute('data-buddy-activity', 'listen')
    chat.get_by_label("Your question for Buddy", exact=True).fill("")
    expect(chat).to_have_attribute('data-buddy-activity', 'idle')
    no_overflow(page)
    chat.screenshot(path=str(OUT / f"chat-{page.viewport_size['width']}.png"), animations="disabled")


def invalid_response_topics(page, fixtures):
    visit(page)
    chat = chat_open(page)
    character = buddy_character(page)
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
    expect(buddy_character(page)).to_have_attribute('data-buddy-form', initial_topic)
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
        previous_form = buddy_character(page).get_attribute("data-buddy-form")
        fixtures.queue.append({"body": {**invalid, "topic": "support"}})
        send(chat, "Explain the partner network.")
        expect(chat.get_by_role("alert")).to_contain_text("couldn't get an AI answer")
        expect(chat.locator('[data-buddy-turn="assistant"]')).to_have_count(0)
        expect(chat.get_by_role("link", name="Contact our team", exact=True)).to_have_attribute("href", "/contact")
        expect(buddy_character(page)).to_have_attribute("data-buddy-form", previous_form)
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
    expect(buddy_character(page)).to_have_attribute('data-buddy-form', original_retry['topic'])
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
    expect(buddy_character(page)).to_have_attribute('data-buddy-form', original_retry['topic'])
    assert len(fixtures.requests) == before_open, 'Opening Services reposted the failed question'
    assert len(fixtures.status_requests) == status_count, 'Opening an existing failed chat restarted readiness'
    fixtures.answer('Fixture retry answer after opening Services.', topic='investment')
    chat.get_by_role('button', name='Try again', exact=True).click()
    expect(chat.locator('[data-buddy-turn="assistant"]')).to_have_count(1)
    expect(chat.locator('[data-buddy-turn="user"]')).to_have_count(1)
    expect(buddy_character(page)).to_have_attribute('data-buddy-form', 'investment')
    assert fixtures.requests[-1] == original_retry, 'Reopening changed the question or duplicated retry history'
    fixtures.answer('Fixture answer to the next care question.', topic='support')
    send(chat, 'How does care connect with the property service?')
    expect(chat.locator('[data-buddy-turn="assistant"]')).to_have_count(2)
    expect(buddy_character(page)).to_have_attribute('data-buddy-form', 'support')
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
    expect(buddy_character(page)).to_have_attribute("data-buddy-form", "support")
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
    expect(buddy_character(page)).to_have_attribute("data-buddy-form", "support")
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
    character = buddy_character(page)
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
    expect(showcase.locator('[data-buddy-slot=page]')).to_have_attribute('data-buddy-slot-form', 'support')
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
    expect(chat.locator("form")).to_be_visible()
    expect(chat.get_by_role('button', name='Speak to Buddy', exact=True)).to_be_disabled()
    expect(chat.get_by_role("button", name="Check connection", exact=True)).to_have_count(0)
    expect(chat.locator("[data-buddy-turn]")).to_have_count(0)
    assert not fixtures.requests, "Checking readiness submitted a question"
    fixtures.fulfill(take_pending_status(page, fixtures), {"body": {"configured": False}})
    expect(chat).to_have_attribute("data-buddy-readiness", "unavailable")
    expect(chat.get_by_role('button', name='Check connection', exact=True)).to_be_enabled()
    expect(chat.get_by_role("status")).to_contain_text("AI chat is unavailable right now")
    expect(chat.get_by_role("link", name="Explore our services", exact=True)).to_have_attribute("href", "/platform")
    expect(chat.get_by_role("link", name="Contact our team", exact=True)).to_have_attribute("href", "/contact")
    expect(chat.get_by_role("group", name="Conversation topic")).to_have_count(0)
    starter = chat.get_by_role("button", name=CHAT_COPY_ALLOWED["questions"][2], exact=True)
    expect(starter).to_have_count(0)
    # Failure and truthy-but-not-true responses must not unlock the composer.
    for response in [{"status": 404}, {"status": 503}, {"body": {"configured": "true"}}, {"body": {}}]:
        fixtures.status_queue.append(response)
        chat.get_by_role("button", name="Check connection", exact=True).click()
        expect(chat).to_have_attribute("data-buddy-readiness", "unavailable")
        expect(chat.locator("#buddy-question")).to_be_disabled()
        expect(chat.locator("form")).to_be_visible()
        expect(chat.locator('button[type="submit"]')).to_be_disabled()
        expect(chat.get_by_role('button', name='Speak to Buddy', exact=True)).to_be_disabled()
        expect(chat.get_by_role('button', name='Check connection', exact=True)).to_be_enabled()
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
    character = buddy_character(page)
    financial = '#mission-panel-need [data-buddy-topic="investment"]'
    for selector, topic in [
        ('section[aria-labelledby="hero-heading"]', 'property'),
        ('#charity-impact', 'support'),
        ('.council-panel', 'property'),
        (financial, 'investment'),
    ]:
        requests_before = (len(fixtures.chat_chunks), len(fixtures.status_requests), len(fixtures.requests))
        centre_section(page, selector)
        expect(widget).to_have_attribute('data-buddy-context', topic)
        expect(character).to_have_attribute('data-buddy-form', topic)
        assert (len(fixtures.chat_chunks), len(fixtures.status_requests), len(fixtures.requests)) == requests_before, 'Reading a section loaded or contacted the AI chat'
        if assert_corner_placement(page):
            assert_canvas_artwork(character)
        else:
            # The same topic must reach the visible chat portrait, even after a
            # section that cannot safely contain the full-size corner actor.
            chat = chat_open(page)
            expect(character).to_have_attribute('data-buddy-form', topic)
            assert_canvas_artwork(character)
            chat.get_by_role('button', name='Close Buddy', exact=True).click()
    assert not fixtures.requests, 'Reading the page or checking a hidden corner submitted an AI question'

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
    chat_character = buddy_character(page)
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
    expect(buddy_character(page)).to_have_attribute('data-buddy-form', 'investment')
    expect(chat.get_by_label('Your question for Buddy', exact=True)).to_have_value(draft)
    expect(chat.locator('[data-buddy-turn]')).to_have_count(2)
    assert len(fixtures.requests) == 1, 'Closing, scrolling or reopening submitted a question'
    chat.get_by_role('button', name='New conversation', exact=True).click()
    expect(buddy_character(page)).to_have_attribute('data-buddy-form', 'property')
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
    expect(buddy_character(page)).to_have_attribute('data-buddy-form', 'investment')
    expect(chat.locator('[data-buddy-turn]')).to_have_count(0)
    assert len(fixtures.requests) == 1
    no_overflow(page)


def no_animation_controls(page):
    for label in ('Play with Buddy', 'Play', 'Pause Buddy', 'Resume Buddy', 'Throw ball',
                  'Build a home', 'Dance', 'Surprise me', 'Open the door', 'Close play', 'Retry play'):
        expect(page.get_by_role('button', name=label, exact=True)).to_have_count(0)
    expect(page.locator('[data-buddy-playground], [data-buddy-play-launcher]')).to_have_count(0)


def ambient_companion(page, fixtures):
    # Pin only the decorative random source so construction is a predictable
    # first scene. Real elapsed time and the real canvas controller still run.
    page.add_init_script('Math.random = () => 0.999;')
    prop_requests = []
    model_requests = []
    page.on('request', lambda request: prop_requests.append(request.url) if 'play-props-v1.webp' in request.url else None)
    page.on('request', lambda request: model_requests.append(request.url) if '/images/buddy/3d/buddy.glb' in request.url else None)
    visit(page)
    no_animation_controls(page)
    widget = page.locator('[data-buddy-widget]')
    character = buddy_character(page)
    expect(page.locator('[data-buddy-actor] canvas')).to_have_count(1)
    assert_fixed_widget(page)
    page.wait_for_timeout(1500)
    assert not prop_requests, 'Scenery loaded during the quiet initial page request'
    find_ambient_corner(page)
    canvas = assert_canvas_artwork(character)
    expect(character).to_have_attribute('data-buddy-ambient', 'rest')
    expect(character).to_have_attribute('data-buddy-status', 'ready')
    assert len(model_requests) == 1, 'The authored character and scenery must share one loaded GLB'
    def scenery_pixels():
        return canvas.evaluate('''canvas => {
          const copy = document.createElement('canvas');
          copy.width = canvas.width; copy.height = canvas.height;
          const context = copy.getContext('2d'); context.drawImage(canvas, 0, 0);
          const pixels = context.getImageData(0, 0, Math.floor(canvas.width * .31), canvas.height).data;
          let painted = 0;
          for (let index = 3; index < pixels.length; index += 4) if (pixels[index] > 16) painted++;
          return painted;
        }''')
    quiet_pixels = scenery_pixels()
    focused = page.evaluate('document.activeElement?.tagName')
    expect(character).to_have_attribute('data-buddy-ambient', 'build', timeout=24000)
    page.wait_for_timeout(2800)
    assert scenery_pixels() > quiet_pixels + 25, 'Autonomous construction did not paint its 3D scenery beside Buddy'
    assert len(model_requests) == 1 and not prop_requests, 'Construction refetched the model or used retired raster scenery'
    assert canvas.evaluate('n => getComputedStyle(n).pointerEvents') == 'none'
    scene_box, character_box = canvas.bounding_box(), page.locator('[data-buddy-actor]').bounding_box()
    assert scene_box['x'] >= 0 and scene_box['x'] + scene_box['width'] <= page.viewport_size['width'] + 1, 'Ambient scenery leaves the viewport'
    assert scene_box['width'] > character_box['width'], 'Scenery was squeezed into the character stage'
    assert page.evaluate("""({x,y}) => !document.elementFromPoint(x,y)?.closest('[data-buddy-actor], [data-buddy-widget]')""",
                         {'x': scene_box['x'] + 8, 'y': scene_box['y'] + scene_box['height'] / 2}), 'Decorative scenery blocks the page outside Buddy'
    assert page.evaluate('document.activeElement?.tagName') == focused, 'Ambient acting moved keyboard focus'
    no_overflow(page)
    canvas.screenshot(path=str(OUT / f'ambient-build-{page.viewport_size["width"]}.png'), animations='disabled')
    expect(character).to_have_attribute('data-buddy-ambient', 'rest', timeout=12000)
    assert 'ball' not in page.evaluate('window.__buddyAmbientKinds'), 'A retired ball scene was selected'
    no_animation_controls(page)
    assert not fixtures.chat_chunks and not fixtures.status_requests and not fixtures.requests, 'Ambient acting opened or contacted AI'
    page.get_by_role('button', name='Minimize Buddy', exact=True).click()
    reopen = page.get_by_role('button', name='Show Buddy', exact=True)
    expect(reopen).to_be_focused()
    page.wait_for_timeout(100)
    draws = page.evaluate('window.__buddyAmbientDraws')
    page.wait_for_timeout(300)
    assert page.evaluate('window.__buddyAmbientDraws') == draws, 'Hidden Buddy retained ambient frames'
    page.keyboard.press('Enter')
    expect(page.locator('[data-buddy-launcher]')).to_be_focused()
    assert_fixed_widget(page)
    assert not fixtures.chat_chunks and not fixtures.status_requests and not fixtures.requests, 'Hide/reopen contacted AI'
    chat_open(page)
    expect(page.locator('[data-buddy-widget]:visible')).to_have_count(0)
    assert not fixtures.requests, 'Opening the regular chat submitted an ambient action'


def ambient_reduced_motion(page, fixtures):
    prop_requests = []
    page.on('request', lambda request: prop_requests.append(request.url) if 'play-props-v1.webp' in request.url else None)
    visit(page)
    no_animation_controls(page)
    character = buddy_character(page)
    expect(character).to_have_attribute('data-buddy-motion', 'off')
    expect(character).to_have_attribute('data-buddy-ambient', re.compile('^(off|rest)$'))
    find_ambient_corner(page)
    assert_canvas_artwork(character)
    expect(character).to_have_attribute('data-buddy-motion', 'off')
    expect(character).to_have_attribute('data-buddy-ambient', 'rest')
    page.wait_for_timeout(250)
    draws = page.evaluate('window.__buddyAmbientDraws')
    page.wait_for_timeout(700)
    assert page.evaluate('window.__buddyAmbientDraws') == draws, 'Reduced-motion Buddy retained ambient frames'
    assert not prop_requests, 'Reduced motion fetched unused scenery'
    page.get_by_role('button', name='Minimize Buddy', exact=True).click()
    expect(page.get_by_role('button', name='Show Buddy', exact=True)).to_be_focused()
    page.keyboard.press('Enter')
    expect(page.locator('[data-buddy-launcher]')).to_be_focused()
    expect(character).to_have_attribute('data-buddy-motion', 'off')
    assert not fixtures.chat_chunks and not fixtures.status_requests and not fixtures.requests, 'Reduced-motion companion contacted AI'


def reduced_motion(page, fixtures):
    visit(page, "/platform/")
    showcase = page.locator("[data-buddy-showcase]")
    centre_section(page, '[data-buddy-showcase] [data-buddy-slot="page"]')
    settled_actor(page, "page")
    character = buddy_character(page)
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
        expect(buddy_character(page)).to_have_attribute("data-buddy-form", topic)
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

    # A keyboard-sized viewport must still let native focus and scrolling reach
    # the complete composer, the expandable AI notice and the close control.
    page.set_viewport_size({"width": 390, "height": 320})
    request_count = len(fixtures.requests)
    close = chat.get_by_role("button", name="Close Buddy", exact=True)
    question = chat.get_by_label("Your question for Buddy", exact=True)
    send_button = chat.get_by_role("button", name="Send", exact=True)
    close.focus()
    expect(close).to_be_focused()
    expect(close).to_be_in_viewport(ratio=1)
    question.focus()
    question.fill("An unfinished compact-screen question.")
    expect(question).to_be_in_viewport(ratio=1)
    page.keyboard.press("Tab")
    microphone = chat.get_by_role('button', name='Speak to Buddy', exact=True)
    expect(microphone).to_be_focused()
    expect(microphone).to_be_in_viewport(ratio=1)
    page.keyboard.press("Tab")
    expect(send_button).to_be_focused()
    expect(send_button).to_be_in_viewport(ratio=1)
    page.keyboard.press("Tab")
    about = chat.get_by_role("button", name=CHAT_COPY_ALLOWED["about"], exact=True)
    expect(about).to_be_focused()
    expect(about).to_be_in_viewport(ratio=1)
    page.keyboard.press("Enter")
    expect(about).to_have_attribute("aria-expanded", "true")
    chat_box = chat.bounding_box()
    page.mouse.move(chat_box["x"] + chat_box["width"] - 6, chat_box["y"] + chat_box["height"] - 8)
    page.mouse.wheel(0, 1000)
    expect(chat.locator("#buddy-boundary")).to_be_in_viewport(ratio=1)
    chat.screenshot(path=str(OUT / "chat-short-390x320.png"), animations="disabled")
    close.focus()
    expect(close).to_be_focused()
    expect(close).to_be_in_viewport(ratio=1)
    assert len(fixtures.requests) == request_count, "Reaching short-screen controls submitted the draft"
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth + 1"), "Short-screen Buddy overflows horizontally"


def missing_artwork(page, fixtures):
    visit(page)
    find_ambient_corner(page, require_ambient=False)
    character = buddy_character(page)
    expect(character.locator("canvas")).to_be_hidden()
    expect(character).to_have_attribute("data-buddy-status", "failed")
    fallback = character.locator('img[alt=""]')
    expect(fallback).to_be_visible()
    expect(fallback).to_have_attribute("src", f"/images/buddy/3d/{character.get_attribute('data-buddy-form')}.png")
    page.wait_for_function("document.querySelector('[data-buddy-actor] img')?.naturalWidth > 0")
    bounds = character.bounding_box()
    assert bounds["width"] >= 44 and bounds["height"] >= 44, "Missing artwork collapsed the floating character"
    assert_fixed_widget(page)
    chat = chat_open(page)
    fixtures.answer("Fixture answer with unavailable artwork.")
    send(chat, "How does the service work?")
    expect(chat.locator('[data-buddy-turn="assistant"]')).to_contain_text("Fixture answer with unavailable artwork.")
    no_overflow(page)


def assert_inspector_artwork_frame(page):
    """Read real rendered alpha, including the outer glass rim, at its actual slot size."""
    page.wait_for_timeout(BUDDY_FORM_CHANGE_MS + 450)
    frame = page.locator('[data-buddy-actor] canvas').evaluate("""canvas => {
      const copy = document.createElement('canvas');
      copy.width = canvas.width; copy.height = canvas.height;
      const context = copy.getContext('2d'); context.drawImage(canvas,0,0);
      const data = context.getImageData(0,0,copy.width,copy.height).data;
      let left=copy.width, right=-1, top=copy.height, bottom=-1, painted=0;
      for(let i=3;i<data.length;i+=4)if(data[i]>8){
        const n=(i-3)/4,x=n%copy.width,y=Math.floor(n/copy.width);
        painted++;left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
      }
      return {left,right,top,bottom,painted,width:copy.width,height:copy.height,
        cssWidth:canvas.getBoundingClientRect().width,cssHeight:canvas.getBoundingClientRect().height};
    }""")
    assert frame['painted'] > 500, f'Inspector character is blank: {frame}'
    assert 0 < frame['left'] < frame['right'] < frame['width'] - 1, f'Inspector artwork clips horizontally: {frame}'
    assert 0 < frame['top'] < frame['bottom'] < frame['height'] - 1, f'Inspector artwork clips vertically: {frame}'
    assert 100 <= frame['cssWidth'] <= 150, f'Inspector proof missed the actual compact slot: {frame}'
    return frame


def inspect_page_details(page, fixtures):
    visit(page, '/platform/')
    chat = chat_open(page)
    page.evaluate("window.__inspectionCanvas = document.querySelector('[data-buddy-actor] canvas')")
    before = len(fixtures.requests)
    chat.get_by_role('button', name='Explore this page with Buddy').click()
    inspector = page.locator('[data-buddy-page-inspector]')
    expect(inspector).to_be_visible()
    expect(page.locator('[data-buddy-chat]')).to_have_count(0)
    settled_actor(page, 'inspect')
    assert page.evaluate("window.__inspectionCanvas === document.querySelector('[data-buddy-actor] canvas')"), 'Page inspection remounted Buddy'
    first_frame = assert_inspector_artwork_frame(page)
    value = inspector.locator('p').nth(1).inner_text()
    assert value and value in page.locator('main').inner_text(), 'Enlarged detail was not published page text'
    expect(inspector.get_by_role('button', name='Close page detail')).to_be_focused()
    inspector.get_by_role('button', name='Next detail').click()
    next_value = inspector.locator('p').nth(1).inner_text()
    assert next_value and next_value != value
    assert next_value in page.locator('main').inner_text()
    next_frame = assert_inspector_artwork_frame(page)
    (OUT / f"page-inspection-frame-{page.viewport_size['width']}.json").write_text(json.dumps({'first': first_frame, 'next': next_frame}, indent=2), encoding='utf-8')
    page.screenshot(path=str(OUT / f"page-inspection-{page.viewport_size['width']}.png"))
    page.keyboard.press('Escape')
    expect(inspector).to_have_count(0)
    expect(page.locator('[data-buddy-form]')).to_have_count(1)
    assert len(fixtures.requests) == before, 'Reading published page details made an AI request'
    no_overflow(page)
    page.set_viewport_size({'width': page.viewport_size['width'], 'height': 320})
    chat = chat_open(page)
    chat.get_by_role('button', name='Explore this page with Buddy').click()
    inspector = page.locator('[data-buddy-page-inspector]')
    expect(inspector).to_be_visible()
    box = inspector.bounding_box()
    assert box['y'] >= 0 and box['y'] + box['height'] <= 320, 'Page inspector clips in a short viewport'
    current_value = inspector.locator('p').nth(1).inner_text()
    page.evaluate("""value => {
      const node=[...document.querySelectorAll('main dd,main h2,main [data-buddy-detail]')].find(n=>n.textContent.replace(/\\s+/g,' ').trim()===value);
      if(!node)throw new Error('Current inspected source not found');
      node.textContent='Changed test page detail';
    }""", current_value)
    expect(inspector).to_have_count(0)


try:
    retired_artwork = ROOT / "dist/client/images/ai-team"
    assert not retired_artwork.exists() or not any(retired_artwork.rglob("*")), "Retired mascot artwork is still published"
    atlas = (ROOT / "dist/client" / V2_ATLAS_PATH.lstrip("/")).read_bytes()
    assert len(atlas) == V2_ATLAS_SIZE, "Built Buddy atlas has the wrong version/size"
    assert hashlib.sha256(atlas).hexdigest() == V2_ATLAS_SHA256, "Built Buddy atlas differs from the supplied v2-refined package"
    REPORT["checks"].append({"name": "preserved-v2-reference-atlas", "status": "pass", "bytes": len(atlas), "sha256": V2_ATLAS_SHA256})
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
        cases = [
            ("floating-placement-minimise", floating_placement_and_minimise, {}),
            ("simple-chat-disclosure", simple_chat_disclosure, {}),
            ("speech-input", speech_input, {"reduced": True}),
            ("services-only-showcase-keyboard", services_showcase_and_topics, {}),
            ("fetch-history-sources", real_fetch_contract, {}),
            ("invalid-response-topics", invalid_response_topics, {"reduced": True}),
            ("retry-and-ai-proof", retry_and_refusal, {}),
            ("cancel-late-response-focus", cancellation_and_focus, {}),
            ("nonmodal-continuous-conversation", nonmodal_continuous_conversation, {"reduced": True}),
            ("scroll-context-retained-chat", scroll_context_and_retained_chat, {"reduced": True}),
            ("readiness-gate-recovery", readiness_gate, {"reduced": True}),
            ("readiness-cancel-timeout", readiness_cancel_timeout, {"reduced": True}),
            ("ambient-companion", ambient_companion, {}),
            ("ambient-reduced-motion", ambient_reduced_motion, {"reduced": True}),
            ("reduced-motion", reduced_motion, {"reduced": True}),
            ("artwork-fallback", missing_artwork, {"fail_engine": True, "reduced": True}),
            ("short-viewport", short_viewport, {"reduced": True}),
            ("inspect-page-details", inspect_page_details, {}),
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
                    assert not fixtures.atlas_requests and not fixtures.hand_requests, "Vector character fetched old body or hand bitmaps"
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

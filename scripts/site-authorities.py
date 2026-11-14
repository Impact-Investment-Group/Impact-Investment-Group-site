"""CI browser regression gate for the council and verified data-source carousels."""
import functools
import hashlib
import http.server
import json
from pathlib import Path
import threading
from urllib.parse import urlparse

from PIL import Image
from playwright.sync_api import expect, sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs/screenshots/wave909/authorities"
OUT.mkdir(parents=True, exist_ok=True)
CATALOGUE = json.loads((ROOT / "public/data/uk-local-authorities.json").read_text(encoding="utf-8"))["authorities"]
CODES = {row["gss_code"] for row in CATALOGUE}
NAMES = sorted(row["name"] for row in CATALOGUE)
COUNTS = {"England": 317, "Scotland": 32, "Wales": 22, "Northern Ireland": 11}
PANEL = ".council-panel"
LANE = f"{PANEL} .logo-marquee"
TRACK = f"{LANE} .logo-marquee__track"
ORIGINAL = f"{TRACK} > :not([data-clone])"
CLONE = f"{TRACK} > [data-clone]"
PROVIDERS = json.loads((ROOT / "scripts/fixtures/data-service-inventory.json").read_text(encoding="utf-8"))["providers"]
DATA_LANE = "#data-sources .logo-marquee"
DATA_TRACK = f"{DATA_LANE} .logo-marquee__track"
REPORT = {"checks": [], "failures": [], "authorities": 382, "data_sources": len(PROVIDERS), "measurements": {}}


class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass


server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(Handler, directory=str(ROOT / "dist/client")))
threading.Thread(target=server.serve_forever, daemon=True).start()
BASE = f"http://127.0.0.1:{server.server_address[1]}"


def catalogue_assets():
    assert len(CATALOGUE) == len(CODES) == 382
    assert {country: sum(row["country"] == country for row in CATALOGUE) for country in COUNTS} == COUNTS
    total = 0
    for row in CATALOGUE:
        assert row["logo"] == f'/images/logos/councils/uk/{row["gss_code"]}.webp'
        source = ROOT / "public" / row["logo"].lstrip("/")
        built = ROOT / "dist/client" / row["logo"].lstrip("/")
        assert source.is_file() and built.is_file(), f'Missing logo: {row["gss_code"]}'
        assert source.stat().st_size > 0
        assert hashlib.sha256(source.read_bytes()).digest() == hashlib.sha256(built.read_bytes()).digest(), f'Stale built logo: {row["gss_code"]}'
        with Image.open(built) as image:
            assert image.format == "WEBP" and min(image.size) > 0
            image.verify()
        total += built.stat().st_size
    REPORT["measurements"]["all_logo_bytes"] = total
    assert len(PROVIDERS) == len({provider["id"] for provider in PROVIDERS}) == 42
    for provider in PROVIDERS:
        assert provider["evidence"] and provider["name"] and provider["blurb"]
        if provider.get("logo"):
            source = ROOT / "public" / provider["logo"].lstrip("/")
            built = ROOT / "dist/client" / provider["logo"].lstrip("/")
            assert source.is_file() and built.is_file(), f'Missing provider artwork: {provider["id"]}'
            assert source.read_bytes() == built.read_bytes(), f'Stale provider artwork: {provider["id"]}'


def overflow(page):
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth + 1"), "Horizontal page overflow"


def home(page, lane_selector=LANE):
    page.goto(BASE, wait_until="networkidle")
    minimise = page.get_by_role("button", name="Minimize Buddy", exact=True)
    if minimise.count():
        minimise.click()
    page.locator(lane_selector).scroll_into_view_if_needed()
    page.mouse.move(0, 0)


def simple_contract(page):
    panel = page.locator(PANEL)
    expect(panel).to_have_count(1)
    expect(panel.locator("details, summary, input, select")).to_have_count(0)
    expect(panel.get_by_role("button")).to_have_count(0)
    expect(panel.locator('a[href*="local-authorities"], [data-authority-directory]')).to_have_count(0)
    expect(page.locator(ORIGINAL)).to_have_count(382)
    expect(page.locator(CLONE)).to_have_count(382)
    originals = page.locator(f"{ORIGINAL} img").evaluate_all("images => images.map(image => image.getAttribute('src'))")
    clones = page.locator(f"{CLONE} img").evaluate_all("images => images.map(image => image.getAttribute('src'))")
    assert len(set(originals)) == 382
    assert {Path(urlparse(url).path).stem for url in originals} == CODES
    assert clones == originals, "Repeat must preserve the full 382-logo sequence"
    assert all(urlparse(url).path.startswith("/images/logos/councils/uk/") for url in originals)
    expect(page.locator(TRACK)).to_have_attribute("aria-hidden", "true")
    assert page.locator(f"{TRACK} img").evaluate_all("images => images.every(image => image.alt === '')")
    names = page.locator(f"{LANE} > ul li").all_text_contents()
    assert sorted(name for name in names if name in NAMES) == NAMES, "All 382 names must remain accessible"
    expect(page.locator(LANE)).to_have_attribute("tabindex", "0")
    assert page.locator(LANE).get_attribute("aria-label"), "Scrollable lane needs an accessible name"
    boxes = page.locator(ORIGINAL).evaluate_all("nodes => nodes.map(node => {const b=node.getBoundingClientRect();return {x:b.x,y:b.y,w:b.width,h:b.height}})")
    assert max(box["y"] for box in boxes) - min(box["y"] for box in boxes) < 1, "Logos must stay in one row"
    assert all(b["x"] < a["x"] for b, a in zip(boxes, boxes[1:])), "Every council must occur in order"
    width, height = (148, 68) if page.viewport_size["width"] >= 640 else (136, 64)
    assert all(b["w"] >= width - 0.1 and b["h"] >= height - 0.1 for b in boxes), "Larger logo plates regressed"
    overflow(page)


def sample_motion(page, track_selector=TRACK):
    # A bounded sample of painted frames measures motion; no readiness sleeps.
    return page.locator(track_selector).evaluate("""node => new Promise(resolve => {
      const x = () => node.getBoundingClientRect().x;
      let frames = 0, first, started;
      function frame(now) {
        if (started === undefined) { started = now; first = x(); }
        if (++frames >= 12) resolve({delta:x()-first, elapsed:now-started});
        else requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    })""")


def visible_logos_decode(page, no_js=False, lane_selector=LANE):
    if no_js:
        # Page-scheduled callbacks are disabled too. Use Playwright's assertions
        # against the real visible images rather than scheduling a page poll.
        indices = page.locator(lane_selector).evaluate("""lane => {
          const box=lane.getBoundingClientRect();
          return [...lane.querySelectorAll('img')].flatMap((image,index) => {
            const b=image.getBoundingClientRect();
            return b.width>0 && b.right>box.left+1 && b.left<box.right-1 ? [index] : [];
          });
        }""")
        assert indices, "No visible credit artwork"
        for index in indices:
            image = page.locator(f"{lane_selector} img").nth(index)
            expect(image).to_have_js_property("complete", True, timeout=30000)
            expect(image).not_to_have_js_property("naturalWidth", 0, timeout=30000)
        return
    page.wait_for_function("""selector => {
      const lane = document.querySelector(selector), box = lane.getBoundingClientRect();
      const visible = [...lane.querySelectorAll('img')].filter(image => {
        const b=image.getBoundingClientRect(); return b.width > 0 && b.right > box.left + 1 && b.left < box.right - 1;
      });
      return visible.length > 0 && visible.every(image => image.complete && image.naturalWidth > 0);
    }""", arg=lane_selector, timeout=30000)


def reading_controls(page, touch=False, lane_selector=LANE, track_selector=TRACK):
    lane = page.locator(lane_selector)
    if not touch:
        lane.hover()
        assert abs(sample_motion(page, track_selector)["delta"]) < 0.25, "Hover does not stop logo motion"
        page.mouse.move(0, 0)
        assert sample_motion(page, track_selector)["delta"] < -0.5, "Motion does not resume after hover"
    if touch:
        lane.tap()
    else:
        lane.focus()
    expect(lane).to_be_focused()
    assert lane.evaluate("node => ['auto','scroll'].includes(getComputedStyle(node).overflowX)"), "Focused lane is not natively scrollable"
    assert page.locator(track_selector).evaluate("node => getComputedStyle(node).animationName === 'none'"), "Focus does not stop animation"
    assert page.locator(f"{track_selector} > [data-clone]").evaluate_all("nodes => nodes.every(node => getComputedStyle(node).display === 'none')"), "Focused reading repeats decorative clones"
    before = lane.evaluate("node => node.scrollLeft")
    lane.press("ArrowRight")
    expect(lane).not_to_have_js_property("scrollLeft", before)
    lane.evaluate("node => {node.scrollLeft=node.scrollWidth}")
    assert lane.evaluate("node => node.scrollLeft > 100"), "Long catalogue is unreachable"
    lane.evaluate("node => node.blur()")
    page.mouse.move(0, 0)
    expect(lane).to_have_js_property("scrollLeft", 0)
    page.wait_for_function("selector => getComputedStyle(document.querySelector(selector)).animationPlayState === 'running'", arg=track_selector)
    assert sample_motion(page, track_selector)["delta"] < -0.5, "Carousel does not resume after reading"


def motion_journey(page, touch=False):
    catalogue_requests = []
    page.on("request", lambda request: catalogue_requests.append(request.url) if "/data/uk-local-authorities.json" in request.url else None)
    home(page)
    simple_contract(page)
    assert not catalogue_requests, "Simple carousel must not require a directory fetch"
    page.wait_for_function("selector => getComputedStyle(document.querySelector(selector)).animationPlayState === 'running'", arg=TRACK)
    visible_logos_decode(page)
    metrics = page.locator(TRACK).evaluate("""track => {
      const first=track.children[0].getBoundingClientRect(), clone=track.children[382].getBoundingClientRect();
      const timing=track.getAnimations()[0].effect.getTiming();
      return {distance:clone.x-first.x, duration:timing.duration, infinite:timing.iterations === Infinity, easing:timing.easing};
    }""")
    speed = metrics["distance"] / (metrics["duration"] / 1000)
    low, high = (15, 45) if touch else (20, 65)
    assert low <= speed <= high, f"Unreadable speed: {speed:.2f}px/sec; expected {low}–{high}"
    assert metrics["infinite"] and metrics["easing"] == "linear"
    moving = sample_motion(page)
    assert moving["delta"] < -0.5, f"Visible carousel does not move left: {moving}"
    reading_controls(page, touch=touch)
    REPORT["measurements"][f'speed_{page.viewport_size["width"]}'] = round(speed, 3)

    # Seek the real CSS animation to later councils after proving natural motion.
    # This exercises late-logo loading and the wrap without a 20–30 minute wait.
    track = page.locator(TRACK)
    track.evaluate("node => {const a=node.getAnimations()[0];node.__councilTestTime=a.currentTime;a.pause();a.currentTime=0}")
    start_x = page.locator(ORIGINAL).first.bounding_box()["x"]
    for index in [127, 254, 381]:
        track.evaluate("""(node, index) => {
          const a=node.getAnimations()[0], first=node.children[0].getBoundingClientRect();
          const distance=node.children[382].getBoundingClientRect().x-first.x;
          const offset=node.children[index].getBoundingClientRect().x-first.x;
          a.currentTime=a.effect.getTiming().duration*offset/distance;
        }""", index)
        page.wait_for_function("""({selector,index,start}) => Math.abs(document.querySelector(selector).children[index].getBoundingClientRect().x-start)<1""", arg={"selector": TRACK, "index": index, "start": start_x})
        visible_logos_decode(page)
    track.evaluate("node => {const a=node.getAnimations()[0];a.currentTime=a.effect.getTiming().duration-1}")
    page.wait_for_function("""({selector,start}) => Math.abs(document.querySelector(selector).children[382].getBoundingClientRect().x-start)<1""", arg={"selector": TRACK, "start": start_x})
    visible_logos_decode(page)
    overflow(page)
    page.locator(PANEL).screenshot(path=str(OUT / f'carousel-{page.viewport_size["width"]}.png'))
    track.evaluate("node => {const a=node.getAnimations()[0];a.currentTime=node.__councilTestTime;a.play();delete node.__councilTestTime}")


def scrollable_journey(page, no_js=False):
    home(page)
    simple_contract(page)
    if no_js:
        # requestAnimationFrame callbacks cannot run with page scripts disabled.
        assert page.locator(TRACK).evaluate("node => getComputedStyle(node).animationName === 'none'"), "No-JavaScript lane is animated"
    else:
        assert abs(sample_motion(page)["delta"]) < 0.25, "Static/reduced-motion lane is moving"
    lane = page.locator(LANE)
    assert lane.evaluate("node => ['auto','scroll'].includes(getComputedStyle(node).overflowX)"), "Static lane is not horizontally scrollable"
    assert page.locator(CLONE).evaluate_all("nodes => nodes.every(node => getComputedStyle(node).display === 'none')"), "Static lane must not repeat the 382 councils"
    lane.focus()
    expect(lane).to_be_focused()
    before = lane.evaluate("node => node.scrollLeft")
    lane.press("ArrowRight")
    expect(lane).not_to_have_js_property("scrollLeft", before)
    assert lane.evaluate("node => node.scrollLeft") > before, "ArrowRight did not scroll forwards"
    # Native keyboard scrolling is proven above. Inspect the far end of the same
    # scroll range without issuing thousands of repeated arrow-key operations.
    end = lane.evaluate("node => {node.scrollLeft=node.scrollWidth;return node.scrollWidth-node.clientWidth}")
    expect(lane).to_have_js_property("scrollLeft", end)
    expect(lane).to_be_focused()
    visible_logos_decode(page, no_js=no_js)
    last = page.locator(ORIGINAL).last.bounding_box()
    viewport = lane.bounding_box()
    assert last["x"] < viewport["x"] + viewport["width"] and last["x"] + last["width"] > viewport["x"], "Last council cannot be reached"
    overflow(page)
    label = "no-js" if no_js else "reduced-motion"
    page.locator(PANEL).screenshot(path=str(OUT / f'{label}-{page.viewport_size["width"]}.png'))


def data_contract(page):
    section = page.locator("#data-sources")
    lane = page.locator(DATA_LANE)
    expect(section.get_by_role("button")).to_have_count(0)
    expect(lane).to_have_attribute("tabindex", "0")
    expect(lane).to_have_attribute("aria-label", "Powered by authoritative UK data")
    originals = page.locator(f"{DATA_TRACK} > :not([data-clone])")
    clones = page.locator(f"{DATA_TRACK} > [data-clone]")
    expect(originals).to_have_count(42)
    expect(clones).to_have_count(42)
    expected = [provider["name"] + ": " + provider["blurb"] for provider in PROVIDERS]
    assert originals.evaluate_all("nodes => nodes.map(node => node.title)") == expected
    assert clones.evaluate_all("nodes => nodes.map(node => node.title)") == expected
    assert lane.locator("ul li").all_text_contents()[1:] == expected, "Every provider and dataset description must remain accessible"
    expected_images = [provider["logo"] for provider in PROVIDERS if provider.get("logo")]
    assert originals.locator("img").evaluate_all("images => images.map(image => image.getAttribute('src'))") == expected_images
    boxes = originals.evaluate_all("nodes => nodes.map(node => {const b=node.getBoundingClientRect();return {x:b.x,y:b.y,w:b.width,h:b.height}})")
    assert max(box["y"] for box in boxes) - min(box["y"] for box in boxes) < 1, "Data credits must stay in one row"
    width, height = (256, 128) if page.viewport_size["width"] >= 640 else (224, 112)
    assert all(abs(box["w"] - width) < 1 and abs(box["h"] - height) < 1 for box in boxes), "Large, consistent data plates regressed"
    assert originals.locator("span").evaluate_all("nodes => nodes.every(node => node.scrollWidth <= node.clientWidth+1 && node.scrollHeight <= node.clientHeight+1)"), "Publisher names overflow their plates"
    expect(section).to_contain_text("Data used under licence. These publishers do not endorse this platform.")
    expect(section).to_contain_text("OpenStreetMap contributors")
    expect(section).to_contain_text("ODbL")
    overflow(page)


def data_journey(page, touch=False, static=False, no_js=False):
    home(page, DATA_LANE)
    data_contract(page)
    visible_logos_decode(page, no_js=no_js, lane_selector=DATA_LANE)
    lane = page.locator(DATA_LANE)
    track = page.locator(DATA_TRACK)
    if static:
        assert track.evaluate("node => getComputedStyle(node).animationName === 'none'"), "Static data lane is moving"
        assert lane.evaluate("node => ['auto','scroll'].includes(getComputedStyle(node).overflowX)"), "Static data lane cannot scroll"
        assert page.locator(f"{DATA_TRACK} > [data-clone]").evaluate_all("nodes => nodes.every(node => getComputedStyle(node).display === 'none')")
        lane.focus()
        before = lane.evaluate("node => node.scrollLeft")
        lane.press("ArrowRight")
        expect(lane).not_to_have_js_property("scrollLeft", before)
        end = lane.evaluate("node => {node.scrollLeft=node.scrollWidth;return node.scrollWidth-node.clientWidth}")
        expect(lane).to_have_js_property("scrollLeft", end)
        last = page.locator(f"{DATA_TRACK} > :not([data-clone])").last.bounding_box()
        viewport = lane.bounding_box()
        assert last["x"] < viewport["x"] + viewport["width"] and last["x"] + last["width"] > viewport["x"], "Final data provider is unreachable"
    else:
        page.wait_for_function("selector => getComputedStyle(document.querySelector(selector)).animationPlayState === 'running'", arg=DATA_TRACK)
        assert sample_motion(page, DATA_TRACK)["delta"] < -0.5, "Data carousel is not moving"
        reading_controls(page, touch=touch, lane_selector=DATA_LANE, track_selector=DATA_TRACK)
        # Seek the actual CSS animation to each image credit, including late
        # entries; all marks must decode before they pass through the lane.
        track.evaluate("node => {const a=node.getAnimations()[0];a.pause();a.currentTime=0}")
        for index, provider in enumerate(PROVIDERS):
            if not provider.get("logo"):
                continue
            track.evaluate("""(node,index) => {
              const a=node.getAnimations()[0], first=node.children[0].getBoundingClientRect();
              const distance=node.children[42].getBoundingClientRect().x-first.x;
              const offset=node.children[index].getBoundingClientRect().x-first.x;
              a.currentTime=a.effect.getTiming().duration*offset/distance;
            }""", index)
            image = page.locator(f"{DATA_TRACK} > :not([data-clone])").nth(index).locator("img")
            expect(image).to_be_in_viewport()
            expect(image).to_have_js_property("complete", True, timeout=30000)
            expect(image).not_to_have_js_property("naturalWidth", 0, timeout=30000)
            visible_logos_decode(page, lane_selector=DATA_LANE)
        track.evaluate("node => {node.getAnimations()[0].currentTime=0}")
    label = "no-js" if no_js else "reduced-motion" if static else "moving"
    page.locator("#data-sources").screenshot(path=str(OUT / f'data-{label}-{page.viewport_size["width"]}.png'))
    overflow(page)


try:
    catalogue_assets()
    REPORT["checks"].append("all382-authority-and42-provider-built-assets")
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        cases = [
            ("full-carousel-desktop", motion_journey, {"viewport": {"width": 1280, "height": 900}}),
            ("full-carousel-mobile", lambda page: motion_journey(page, touch=True), {"viewport": {"width": 390, "height": 844}, "has_touch": True, "is_mobile": True}),
            ("reduced-motion-mobile", scrollable_journey, {"viewport": {"width": 390, "height": 844}, "reduced_motion": "reduce"}),
            ("reduced-motion-small-mobile", scrollable_journey, {"viewport": {"width": 320, "height": 740}, "reduced_motion": "reduce"}),
            ("no-js-all382-mobile", lambda page: scrollable_journey(page, no_js=True), {"viewport": {"width": 390, "height": 844}, "java_script_enabled": False}),
            ("no-js-all382-desktop", lambda page: scrollable_journey(page, no_js=True), {"viewport": {"width": 1280, "height": 900}, "java_script_enabled": False}),
            ("data-all42-desktop", data_journey, {"viewport": {"width": 1280, "height": 900}}),
            ("data-all42-mobile", lambda page: data_journey(page, touch=True), {"viewport": {"width": 390, "height": 844}, "has_touch": True, "is_mobile": True}),
            ("data-reduced-motion-mobile", lambda page: data_journey(page, static=True), {"viewport": {"width": 320, "height": 740}, "reduced_motion": "reduce"}),
            ("data-no-js-mobile", lambda page: data_journey(page, static=True, no_js=True), {"viewport": {"width": 390, "height": 844}, "java_script_enabled": False}),
            ("data-no-js-desktop", lambda page: data_journey(page, static=True, no_js=True), {"viewport": {"width": 1280, "height": 900}, "java_script_enabled": False}),
        ]
        for name, test, options in cases:
            context = browser.new_context(**options)
            page = context.new_page()
            page.set_default_timeout(15000)
            try:
                test(page)
                REPORT["checks"].append(name)
                print(f"PASS {name}", flush=True)
            except Exception as error:
                REPORT["failures"].append({"case": name, "error": str(error)})
                print(f"FAIL {name}: {error}", flush=True)
                page.screenshot(path=str(OUT / f"failure-{name}.png"))
            finally:
                context.close()
        browser.close()
except Exception as error:
    REPORT["failures"].append({"case": "catalogue-or-browser-setup", "error": str(error)})
    print(f"FAIL catalogue-or-browser-setup: {error}", flush=True)
finally:
    server.shutdown()
    (OUT / "report.json").write_text(json.dumps(REPORT, indent=2), encoding="utf-8")

raise SystemExit(1 if REPORT["failures"] else 0)

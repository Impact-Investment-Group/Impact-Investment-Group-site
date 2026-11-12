"""Focused CI browser gate for the complete UK authority catalogue."""
import functools
import http.server
import json
from pathlib import Path
import re
import threading

from playwright.sync_api import expect, sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs/screenshots/wave909/authorities"
OUT.mkdir(parents=True, exist_ok=True)
CATALOGUE = json.loads((ROOT / "public/data/uk-local-authorities.json").read_text(encoding="utf-8"))["authorities"]
CODES = {row["gss_code"] for row in CATALOGUE}
COUNTS = {"England": 317, "Scotland": 32, "Wales": 22, "Northern Ireland": 11}
assert len(CATALOGUE) == len(CODES) == 382
assert {country: sum(row["country"] == country for row in CATALOGUE) for country in COUNTS} == COUNTS
REPORT = {"checks": [], "failures": [], "authorities": 382}


class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass


server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(Handler, directory=str(ROOT / "dist/client")))
threading.Thread(target=server.serve_forever, daemon=True).start()
BASE = f"http://127.0.0.1:{server.server_address[1]}"


def overflow(page):
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth + 1"), "Horizontal page overflow"


def home(page):
    page.goto(BASE, wait_until="networkidle")
    minimise = page.get_by_role("button", name="Minimize Buddy", exact=True)
    if minimise.count():
        minimise.click()
    page.locator(".council-directory-disclosure summary").scroll_into_view_if_needed()


def open_directory(page):
    summary = page.locator(".council-directory-disclosure summary")
    summary.focus()
    summary.press("Enter")
    expect(page.get_by_label("Find a local authority", exact=True)).to_be_visible()


def directory_journey(page):
    requests = []
    page.on("request", lambda request: requests.append(request.url) if "/data/uk-local-authorities.json" in request.url else None)
    home(page)
    assert not requests, "Catalogue must not load before the directory opens"
    preview = page.locator("#council-logo-preview img").first
    page.mouse.move(0, 0)
    first = preview.bounding_box()["x"]
    page.wait_for_timeout(350)
    assert abs(preview.bounding_box()["x"] - first) > 0.5, "Visible preview does not move"
    page.get_by_role("button", name="Pause logos", exact=True).click()
    first = preview.bounding_box()["x"]
    page.wait_for_timeout(300)
    assert abs(preview.bounding_box()["x"] - first) < 0.2, "Pause does not stop the preview"
    page.get_by_role("button", name="Resume logos", exact=True).click()
    first = preview.bounding_box()["x"]
    page.wait_for_timeout(300)
    assert abs(preview.bounding_box()["x"] - first) > 0.5, "Resume does not restart the preview"
    open_directory(page)
    rows = page.locator("#authority-results [data-authority-code]")
    status = page.locator("[data-authority-directory] [role=status]")
    expect(rows).to_have_count(24)
    assert len(requests) == 1
    for country, count in COUNTS.items():
        page.get_by_label("Country", exact=True).select_option(country)
        expect(status).to_have_text(f"Showing {min(24, count)} of {count} local authorities in {country}")
        expect(rows).to_have_count(min(24, count))
    page.get_by_label("Country", exact=True).select_option("")
    search = page.get_by_label("Find a local authority", exact=True)
    search.fill("S12000036")
    expect(rows).to_have_count(1)
    expect(rows.first).to_have_attribute("data-authority-code", "S12000036")
    summary = page.locator(".council-directory-disclosure summary")
    summary.click()
    summary.click()
    expect(search).to_have_value("S12000036")
    assert len(requests) == 1, "Reopening must retain filters without refetching"
    search.fill("no-such-council-zzzz")
    expect(rows).to_have_count(0)
    expect(status).to_contain_text("No local authorities match")
    clear = page.get_by_role("button", name="Clear filters", exact=True)
    clear.focus()
    clear.press("Enter")
    expect(search).to_be_focused()
    expect(rows).to_have_count(24)
    while rows.count() < 382:
        previous = rows.count()
        page.get_by_role("button", name=re.compile(r"^Show \d+ more local authorities$")).click()
        expect(rows).to_have_count(min(previous + 24, 382))
        expect(rows.nth(previous).locator("a")).to_be_focused()
    assert set(rows.evaluate_all("nodes => nodes.map(node => node.dataset.authorityCode)")) == CODES
    expect(page.get_by_role("button", name=re.compile(r"^Show \d+ more local authorities$"))).to_have_count(0)
    search.fill("Swansea")
    expect(rows).to_have_count(1)
    overflow(page)
    page.locator(".council-panel").screenshot(path=str(OUT / "directory-desktop.png"))


def reduced_mobile(page):
    home(page)
    expect(page.get_by_role("button", name="Logo animation is off", exact=True)).to_be_disabled()
    preview = page.locator("#council-logo-preview img").first
    first = preview.bounding_box()["x"]
    page.wait_for_timeout(300)
    assert abs(preview.bounding_box()["x"] - first) < 0.2
    lane = page.locator("#council-logo-preview .logo-marquee")
    lane.focus()
    expect(lane).to_be_focused()
    before_scroll = lane.evaluate("node => node.scrollLeft")
    lane.press("ArrowRight")
    page.wait_for_function("before => document.querySelector('#council-logo-preview .logo-marquee').scrollLeft > before", arg=before_scroll)
    open_directory(page)
    page.get_by_label("Country", exact=True).select_option("Northern Ireland")
    expect(page.locator("#authority-results [data-authority-code]")).to_have_count(11)
    for selector in ["#authority-search", "#authority-country", ".council-directory-disclosure summary"]:
        assert page.locator(selector).bounding_box()["height"] >= 44
    overflow(page)
    page.screenshot(path=str(OUT / "directory-mobile.png"))


def retry_journey(page):
    attempts = []

    def respond(route):
        attempts.append(route.request.url)
        if len(attempts) == 1:
            route.fulfill(status=503, body="Unavailable")
        else:
            route.continue_()

    page.route("**/data/uk-local-authorities.json", respond)
    home(page)
    page.locator(".council-directory-disclosure summary").click()
    expect(page.get_by_text("The directory could not load.", exact=False)).to_be_visible()
    expect(page.get_by_role("link", name="Open the complete directory", exact=True)).to_have_attribute("href", "/local-authorities/")
    page.get_by_role("button", name="Try again", exact=True).click()
    expect(page.locator("#authority-results [data-authority-code]")).to_have_count(24)
    assert len(attempts) == 2


def static_no_js(page):
    page.goto(BASE, wait_until="networkidle")
    page.locator(".council-directory-disclosure summary").click()
    page.get_by_role("link", name="complete UK directory", exact=True).click()
    expect(page.get_by_role("heading", name="UK local authorities", exact=True)).to_be_visible()
    rows = page.locator("[data-authority-code]")
    expect(rows).to_have_count(382)
    assert set(rows.evaluate_all("nodes => nodes.map(node => node.dataset.authorityCode)")) == CODES
    expect(page.locator("script")).to_have_count(0)
    for country, count in COUNTS.items():
        expect(page.get_by_role("list", name=f"Local authorities in {country}", exact=True).locator("li")).to_have_count(count)
    page.locator("img").evaluate_all("images => images.forEach(image => image.loading = 'eager')")
    page.wait_for_function("Array.from(document.images).every(image => image.complete && image.naturalWidth > 0)", timeout=30000)
    assert page.locator("img").count() == 382
    assert page.evaluate("getComputedStyle(document.body).backgroundColor") == "rgb(249, 248, 243)", "Production stylesheet missing"
    overflow(page)
    page.get_by_role("navigation", name="Countries").get_by_role("link", name=re.compile("^Wales")).click()
    expect(page).to_have_url(re.compile(r"/local-authorities/#wales$"))
    page.screenshot(path=str(OUT / "static-no-js-mobile.png"))


try:
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        cases = [
            ("directory-controls-all-382", directory_journey, {"viewport": {"width": 1280, "height": 900}}),
            ("reduced-motion-mobile", reduced_mobile, {"viewport": {"width": 390, "height": 844}, "reduced_motion": "reduce"}),
            ("catalogue-error-retry", retry_journey, {"viewport": {"width": 1280, "height": 900}}),
            ("static-no-js-all-382-logos", static_no_js, {"viewport": {"width": 390, "height": 844}, "java_script_enabled": False}),
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
finally:
    server.shutdown()
    (OUT / "report.json").write_text(json.dumps(REPORT, indent=2), encoding="utf-8")

raise SystemExit(1 if REPORT["failures"] else 0)

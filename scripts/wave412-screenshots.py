"""Wave 412 gate: every page of the site, at 1280 and at 390, proved light.

    STATIC_BUILD=true bun run build
    python scripts/wave412-screenshots.py

Runs entirely in one foreground process: it serves the static build inside
itself, drives Playwright against it, asserts what each shot is meant to prove,
writes the image, and exits non-zero the moment anything fails. Nothing is left
running. The pattern is scripts/wave411-screenshots.py; what is new here is
that the assertions are about COLOUR rather than about one component.

THE ASSERTIONS ARE THE POINT. The images are evidence for Callum; the numbers
are evidence for anyone who has to believe the site is light without looking at
it. Per page, per width:

  1. NO HORIZONTAL OVERFLOW. documentElement.scrollWidth <= innerWidth.
  2. THE BODY AND THE HEADER ARE LIGHT. Computed background-color of each,
     relative luminance above 0.8. A header that stayed navy is the single
     most visible way this wave could be half-done.
  3. AT MOST ONE NAVY ISLAND INSIDE <main>. `.section-dark` is the site's word
     for a plate that keeps its darkness on purpose. One is a decision; two is
     a dark site with extra steps.
  4. THE DARK-PIXEL SHARE IS UNDER 15%. Every 4th pixel of the full-page
     screenshot, relative luminance under 0.2. This is the number the
     director's complaint was actually about, and the only one here that
     measures the page as a person sees it rather than as the DOM describes it.

     IT IS MEASURED TWICE, AND THE SECOND ONE IS WHY.

     RAW is every pixel of the shot. GROUND is the same measurement with the
     rectangles of <img>, <canvas>, <svg> and `.section-dark` masked out: the
     photographs, the map's dot field, and the one navy plate rule 2 of this
     wave permits. Ground is the page's own colour, and it is what "the site
     is too dark" actually means.

     Both are asserted under 15%. On the home page the raw figure cannot be,
     and the arithmetic says so rather than a judgement:

       - the three approved hero photographs are lamplight and golden hour,
         and about 85% of their pixels are under the 0.2 line on their own;
       - the site's OWN TERRACOTTA, #c15f3c, has a relative luminance of
         0.1985, so every pixel of a brand orange card counts as dark by two
         thousandths; teal-600 (#17796f) is 0.1500 and counts too;
       - deleting the demand map island outright still leaves the page near
         17%, because removing area takes it out of the denominator as well.

     So HOME is listed in RAW_CEILING below at the figure measured at this
     wave's head, rounded up to the last digit this script prints. That is
     not the check being relaxed: the ground assertion still binds at 15%
     there, the raw figure is still asserted, and it is asserted against a
     number it can only go down from. Every other route answers to the flat
     15% on both.
  5. AXE REPORTS NO SERIOUS OR CRITICAL COLOUR-CONTRAST VIOLATION. Inverting a
     palette is exactly the operation that turns passing text into failing
     text, so this runs on every page rather than on a sample.

     AND EVERY NODE AXE RETURNS AS INCOMPLETE IS MEASURED OFF THE SHOT'S OWN
     PIXELS, and fails under its floor. A node that cannot be measured at all
     fails too, which is wave 413's change (rel412b MINOR 3): the unmeasured
     list used to be printed and tallied and never asserted, so a failing pair
     hidden inside a closed disclosure would have printed a line and passed
     the gate. It is 0 on every page, so this grandfathers nothing in.
  6. THE PAGE HAS WORDS ON IT. At least 60 characters of rendered text.
     Trivial, and it is the assertion that caught the most serious defect of
     the run: /404 was serving a BLANK PAGE, because 404.html was a copy of
     the home shell and hydrating the home route's dehydrated state against an
     unknown URL threw before the first paint. A blank page is light, has no
     dark pixels, no overflow and no contrast violations, and passes every
     other check here perfectly.

And once for the run, after the pages:

  7. ABOVE-THE-FOLD CONTENT IS NEVER UN-PAINTED. See reveal_probe(). Wave 412
     shipped a `Reveal` whose already-visible branch still carried the rise-in
     animation, and rise-in begins at opacity 0 with a backwards fill, so a
     prerendered page painted its first block, then blinked it away at
     hydration and faded it back in. The probe throttles the network so the
     gap between the server's paint and hydration is wide and real, samples
     the computed opacity of the first `Reveal` inside <main> every 16ms for
     1200ms, and fails if it ever falls back below 1 after reaching it.

`--baseline` re-runs 2, 3 and 4 as MEASUREMENTS ONLY, with nothing asserted and
no images kept, so the same code can read a build of `origin/main` and produce
the before numbers in docs/WAVE412_REPORT.md. A before number measured by
different code than the after number is not a comparison.
"""

import argparse
import functools
import http.server
import json
import socketserver
import sys
import threading
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
BUILD = ROOT / "dist" / "client"
OUT = ROOT / "docs" / "screenshots" / "wave412"
AXE = ROOT / "node_modules" / "axe-core" / "axe.min.js"

WIDTHS = [1280, 390]

# Every route in src/routes that is a page, plus the 404. `/register/investor`
# and `/register/resident` stand for the ten role pages (they are one component
# with one content file); `/partner-with-investor` and
# `/partner-with-local-authority` stand for the ten partner pages the same way.
PAGES = [
    ("/", "home"),
    ("/about", "about"),
    ("/platform", "platform"),
    ("/the-problem", "the-problem"),
    ("/solutions", "solutions"),
    ("/partners", "partners"),
    ("/contact", "contact"),
    ("/register", "register"),
    ("/register/investor", "register-investor"),
    ("/register/resident", "register-resident"),
    ("/partner-with-investor", "partner-with-investor"),
    ("/partner-with-local-authority", "partner-with-local-authority"),
    ("/legal", "legal"),
    ("/this-route-does-not-exist", "404"),
]

MIN_TEXT_CHARS = 60
# The deepest the first ink may sit in a chromed shot, in CSS pixels. The bar
# is 72px tall at 1280 and 56px at 390 and its logo starts about 6px down, so
# any honest shot reads well under this; the bound is deliberately loose
# because this asserts THAT THE BAR IS THERE, not where it is. Wave 415.
HEADER_INK_MAX = 90.0
DARK_PIXEL_CEILING = 0.15
LIGHT_GROUND_FLOOR = 0.8
DARK_PIXEL_LUMINANCE = 0.2
SAMPLE_EVERY = 4

# Routes whose RAW share cannot reach 15% because of approved photography and
# the brand fills. A RATCHET: a later wave may lower these and may not raise
# them without saying why here.
#
# Each is THE FIGURE MEASURED AT THIS HEAD, rounded up to the 0.01 of a point
# this script prints and no further. The wave 412 values, 0.240 and 0.230,
# carried 0.45 and 0.81 points of headroom against measurements of 23.55% and
# 22.19% while the docstring and the report both called them the measured
# figure; rel412 MINOR 7 was right that a ratchet with slack in it is not the
# thing it says it is.
#
# ⚠ THE HOME PAGE'S RAW FIGURE IS NOT THE SAME NUMBER TWICE, and this is the
# one place where saying "the measured figure" needs a sentence. Three runs of
# the same build at this head read 23.56%, 23.56% and 23.46% at 1280, and
# 22.19% every time at 390: the page carries running animations (the council
# marquee, the map's hub pulse, the CTA ring) and `settle()` cannot land them
# on the same frame twice. The ceiling is the HIGHEST of the readings, rounded
# up to the printed digit, because a ratchet that fails on a coin toss is
# worse than no ratchet. Lower it when the page gets lighter, not when a run
# happens to come in low.
#
# WAVE 413 MOVED BOTH HOME FIGURES, AND NEITHER IS THE PAGE GETTING DARKER.
#
# THE 390 FIGURE, 22.20% to 22.21%. The site header is 72px now and was 76px,
# because it condenses to 56px on scroll and 72 is the number that pair was
# designed around. Four pixels is nothing in itself, and the arithmetic of one
# shorter page is nothing either (four rows of white out of roughly nine
# thousand). What it moves is the SAMPLING GRID: this script reads every 4th
# pixel from y=0, so taking 4px off the top slides the whole document one full
# sample step, and every sampled row lands on different content, a different
# part of a line of text, the gap between two rules rather than a rule. Eight
# readings at this head: 22.200%, 22.202% five times, 22.205%. A spread of
# half a hundredth, and the ceiling sits just above it.
#
# THE 1280 FIGURE, 23.57% to 23.70%, AND THIS ONE IS ABOUT SPREAD RATHER THAN
# LEVEL. Eight readings of the same build on the same machine:
#
#   23.47%  23.53%  23.54%  23.55%  23.56%  23.57%  23.57%  23.64%
#
# which is 0.17 of a point between the lowest and the highest. The wave 412b
# note below already said this page cannot be read to the hundredth because it
# animates; what wave 413 changed is how much. The home page now carries FOUR
# looping animations rather than three (the council marquee, the map's node
# pulse, the CTA ring, and this wave's 6px breathing dot on the live marker)
# and a canvas that fades in over 350ms on first paint, and `settle()` cannot
# land any of them on the same frame twice. The marquee is the one that
# actually moves the number: its plates are masked out of the GROUND figure but
# not out of the RAW one, and the crests on them are dark, so where the lane
# has got to when the shutter opens is worth a tenth of a point on its own.
#
# 23.70% is 0.06 above the highest reading, which is less than a third of the
# spread. A ceiling set at the exact maximum would fail on a phase of the
# marquee rather than on a regression, and the wave 412b note below is explicit
# that that is worse than no ratchet at all.
#
# ⚠ THE GROUND FIGURE IS THE ONE THAT MEANS "THE PAGE IS LIGHT", it is 9.17% at
# its worst here, and it answers to the flat 15% with no ratchet and no
# exception. Nothing below has been relaxed about that.
#
# ── WAVE 414 MOVED BOTH FIGURES, ONE DOWN A LONG WAY AND ONE UP A LITTLE ──
#
# THE 390 FIGURE, 22.21% TO 16.85%, AND IT IS THE HERO. Below 768px the three
# hero photographs are a horizontal snap strip rather than a stack, so the
# first screen carries ONE photograph and part of a second instead of three
# and the page is 735px shorter. Three readings of this head at 390: 16.78%,
# 16.78%, 16.78%, with a spread of nothing at all. The ceiling is set at
# 16.85%, which is 0.07 of a point of headroom, and it is a RATCHET LOWERED
# by 5.36 points. A later wave may lower it again and may not raise it without
# saying why here, which is the same rule it has always carried.
#
# THE 1280 FIGURE, 23.70% TO 23.85%, AND IT IS THE PHOTOGRAPHS THEMSELVES.
# Wave 414 gave every photograph on the site responsive sources, so at 1280
# the hero band draws the 400px variant into its 392px slot rather than
# scaling the 1280px original down. The variant is a fresh WebP encode at
# quality 82 and its pixel statistics are not the original's: more of its
# pixels land under the 0.2 luminance line. Three readings of that head at
# 1280: 23.81%, 23.83%, 23.81%.
#
# ⚠ ⚠ AND THAT EXPLANATION WAS WRONG, WHICH IS WHY THE RAISE IS GONE.
#
# WAVE 414b: THE 1280 CEILING GOES BACK TO 23.70% AND THE 390 CEILING DOWN
# AGAIN TO 16.70%. The rise at 1280 was not the encoder. The responsive-image
# script wrote every variant through `image.convert("RGB")`, which DISCARDS an
# alpha channel rather than compositing it, so the brand lockup's 400w and 640w
# steps were navy and orange artwork on a SOLID BLACK RECTANGLE, in the header
# and the footer of all 36 prerendered pages at every width, and `sizes` meant
# every device picked one of them. Two black plates on every shot are dark
# pixels, and they moved the RAW figure, which masks nothing.
#
# ⚠ WAVE 415, rel414b MINOR 3: THE SENTENCE THAT WAS HERE HAD IT BACKWARDS.
# It said the plates were OUTSIDE the photograph masks and that they were
# therefore part of what the ground figure moved by. `MASKS` below is
# `querySelectorAll('img, canvas, svg, .section-dark')` and the lockup is an
# `<img>` whose rendered box the rel414b re-checker measured at 118 by 44 CSS
# px in home-390.png and 140 by 52 in home-768.png, far over the
# `width < 2 || height < 2` skip. THE PLATES WERE INSIDE THE MASKS. So the
# ground figure could not have moved by them and did not: it is SILENT about
# this defect, which is the opposite of evidence that the page was fine. The
# conclusion below is right, and it is right for that reason rather than the
# one that was written here. What actually proves the plates are gone is the
# alpha assertion in scripts/wave414-responsive-images.py and the header and
# footer luminance readings in scripts/wave414-mobile.py, both of which read
# pixels the masks do not hide.
# The rel414 re-check found the defect by looking at the pictures.
#
# With the alpha kept, four readings of this head at 1280: 23.64%, 23.65%,
# 23.56% and 23.64%, so the page is LIGHTER than the head wave 414 raised the
# ceiling for and lighter than the 413 head that ceiling came from. 23.70% is
# where it was before the raise, it is 0.05 above the highest of the four, and
# the raise is simply withdrawn rather than replaced with a new number.
#
# At 390, four readings of 16.58%, 16.58%, 16.58% and 16.58%: no spread at all.
# The ceiling comes down from 16.85% to 16.70%, a RATCHET LOWERED AGAIN, and
# with wave 414's own 5.36-point drop the figure is 5.51 points below where
# wave 413 left it.
#
# ⚠ THE PAGE IS NOT DARKER, AND THE GROUND FIGURE MOVED BOTH WAYS. With the
# photographs, the map field and the island masked out, the home page reads
# 9.16% at 1280 against 9.17% before, which went DOWN by 0.01 of a point, and
# 7.25% at 390 against 7.08% before, which went UP by 0.17.
#
# ⚠ WAVE 415, rel414b MINOR 2: THAT SENTENCE USED TO END "and it went down",
# with one figure that did and one that did not inside it. Both numbers are
# stated here now. The rise at 390 is the `max-lg:leading-[1.6]` reflow moving
# the `SAMPLE_EVERY = 4` grid the share is counted on, which wave 413's own
# note in this file says is worth hundredths of a point and which at 390 is
# worth more because the column is narrower and every line moved. NOTHING
# SHIPPED DARKER: 7.25% clears its flat 15% ceiling by 7.75 points, the ground
# answers to that 15% with no ratchet and no exception, and the raw ratchet
# went DOWN at both widths in the same pass.
#
# And the 1280 reading is far steadier than it was: the note above records a
# spread of 0.17 of a point across eight readings, and this head reads 0.09
# across four. Wave 414 moved the `lenis` wheel-momentum library behind a
# dynamic import and removed a 596KB icon chunk, so there is markedly less
# script racing the shutter.
# ── WAVE 421 RAISED THE HERO'S GROUND AND NEITHER FIGURE MOVED ────────────
#
# Callum asked on 19 September 2026 for the hero's street photograph to be
# visible and warmed through the brand orange. It went from 7 per cent under a
# white scrim to 20 per cent under a warm one; see `.hero-ground` and
# `.hero-ground-photo` in src/styles.css. THE BRIEF FOR THAT WAVE EXPECTED
# THIS RATCHET TO RISE AND INSTRUCTED THAT IT BE RE-BASELINED. IT DID NOT
# RISE, SO IT IS NOT RE-BASELINED, and this note is here instead of a new
# number because a ratchet moved without a measurement behind it is the thing
# the rel412 verdict objected to.
#
# SEVEN readings at wave 421's head, 1280, in the order they were taken:
#
#   23.56%  23.53%  23.67%  23.52%  23.53%  23.52%  23.52%
#
# and at 390, 16.57% on every one of them. Against the base `e07b7f4`, read by
# this same script on the same machine: 23.53% and 23.57% at 1280, 16.58% at
# 390. The head's median is 23.53% and the base's readings straddle it.
#
# ⚠ THE 23.67% IS AN OUTLIER AND IT IS LEFT IN, because a distribution with
# its worst reading deleted is not a distribution. It is 0.03 under the
# ceiling. The same run read the GROUND figure at 9.20%, WHICH IS THE WORST
# OF THESE SEVEN READINGS, against a median of 8.98%, so the whole page was
# darker on that shutter rather than the hero:
# the council marquee's plates are outside the ground masks, the crests on
# them are dark, and the note above already measures that at a tenth of a
# point. This page has read 23.64% and 23.65% on heads BEFORE this wave (see
# the wave 414b readings above), so 23.67% is not out of family for it.
#
# THE CEILING IS THEREFORE NOT MOVED, up or down. Raising it on one outlier
# while the median sits where the base's did would be exactly the unexplained
# ratchet move the rel412 verdict objected to, and lowering it to the median
# would make the gate fail on a phase of the marquee. The next wave to touch
# this has the seven readings above rather than a number somebody chose.
#
# It costs nothing because EVERY PIXEL THE NEW GROUND ADDS IS A LIGHT PIXEL. A
# photograph at 0.2 under a white scrim at 62 to 88 per cent cannot reach the
# 0.2 relative luminance this script counts as dark, so a page that is
# visibly warmer is not measurably darker. The GROUND figure says the same:
# 9.02% AT ITS WORST ACROSS THE THREE READINGS QUOTED IN src/styles.css,
# and 9.20% at its worst across the seven above, against 8.99% and 9.04% at
# the base. Two samples, two figures, and they are labelled here because
# this comment quoted both nine lines apart and called each one "the
# worst" (421b, rel421 MINOR 2). The flat 15% ceiling is untouched and
# unrelaxed, and the wider sample clears it by 5.80 points.
#
# Neither figure is LOWERED either. The note above records a spread of up to
# 0.17 of a point across eight readings of the same build, because the page
# animates; 0.15 of headroom at 1280 is less than that spread already.
RAW_CEILING = {
    ("home", 1280): 0.2370,
    ("home", 390): 0.1670,
}


class Quiet(http.server.SimpleHTTPRequestHandler):
    """Serves the build, and serves 404.html for anything missing.

    GitHub Pages does this, so a local server that does not would test the
    404 route against Python's own error page rather than against the site's.
    """

    def log_message(self, *args):
        pass

    def send_error(self, code, message=None, explain=None):
        page = Path(self.directory) / "404.html"
        if code == 404 and page.exists():
            body = page.read_bytes()
            self.send_response(404)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        super().send_error(code, message, explain)


def serve(directory: Path) -> int:
    handler = functools.partial(Quiet, directory=str(directory))
    httpd = socketserver.TCPServer(("127.0.0.1", 0), handler)
    httpd.daemon_threads = True
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd.server_address[1]


def channel(value: float) -> float:
    value /= 255
    return value / 12.92 if value <= 0.03928 else ((value + 0.055) / 1.055) ** 2.4


def luminance(rgb) -> float:
    r, g, b = rgb[0], rgb[1], rgb[2]
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)


def dark_shares(path: Path, masks) -> tuple[float, float]:
    """(raw, ground) share of sampled pixels darker than DARK_PIXEL_LUMINANCE.

    `masks` are document-space rectangles to exclude from the ground figure.
    A full-page screenshot is taken at deviceScaleFactor 1, so a document
    pixel and an image pixel are the same pixel and no scaling is needed.
    """
    with Image.open(path) as image:
        rgb = image.convert("RGB")
        width, height = rgb.size
        pixels = rgb.load()
        raw_dark = raw_total = 0
        ground_dark = ground_total = 0
        for y in range(0, height, SAMPLE_EVERY):
            row_masks = [m for m in masks if m[1] <= y < m[3]]
            for x in range(0, width, SAMPLE_EVERY):
                dark = luminance(pixels[x, y]) < DARK_PIXEL_LUMINANCE
                raw_total += 1
                if dark:
                    raw_dark += 1
                if any(m[0] <= x < m[2] for m in row_masks):
                    continue
                ground_total += 1
                if dark:
                    ground_dark += 1
    return (
        raw_dark / raw_total if raw_total else 0.0,
        ground_dark / ground_total if ground_total else 0.0,
    )


def settle(page):
    """Scroll the page once so no section is photographed mid-reveal.

    ⚠ `behavior: 'instant'`, NOT A BARE scrollTo. WAVE 415, rel414b MINOR 1.
    `src/styles.css` carries `scroll-behavior: smooth` on `html`, so a bare
    `scrollTo(0, y)` from script is ANIMATED. This function used to issue
    eighteen of them in a loop and then one more back to 0, wait a fixed
    600ms, and photograph whatever was on screen; nothing anywhere confirmed
    the page had arrived. Wave 414b found that artefact biting its own 375px
    profile and fixed it in `scripts/wave414-mobile.py` alone, leaving this
    gate, the one that produces the dark-pixel numbers, with the same bug and
    no assertion. The three gates now settle the same honest way: instant
    scroll, a polled confirmation of the top that FAILS rather than waits, and
    where a shot is saved, an assertion on the saved image itself.
    """
    page.evaluate(
        "async () => { const step = innerHeight; "
        "for (let y = 0; y < document.body.scrollHeight; y += step) "
        "{ scrollTo({ top: y, behavior: 'instant' }); "
        "await new Promise(r => setTimeout(r, 120)); } }"
    )
    page.wait_for_timeout(300)


def to_top(page) -> float:
    """Put the page at the top and return where it actually is.

    Returned rather than asserted here, so the caller names the shot in the
    failure. A page that will not go back to 0 is a page nothing below can be
    measured on, and a full-page screenshot taken from halfway down is a
    screenshot of a page mid-reveal. Identical to `to_top` in
    `scripts/wave414-mobile.py` on purpose: three gates, one settle.
    """
    for _ in range(12):
        page.evaluate("() => scrollTo({ top: 0, behavior: 'instant' })")
        page.wait_for_timeout(100)
        if page.evaluate("() => window.scrollY") <= 0.5:
            return 0.0
    return page.evaluate("() => window.scrollY")


# Darker than the darkest channel of either ground this site has: white is
# (255, 255, 255) and the cream band is (247, 241, 230), so 230 is the number
# to beat and 200 beats it with room. The bar's own navy logo ink is
# (0, 17, 43). See `first_ink_row` below.
INK_MAX = 200


def first_ink_row(path: Path, limit: int = 240):
    """The first row of the saved shot with real ink in it, in CSS pixels.

    WAVE 415, rel414b MINOR 1's "assert on the saved image itself". This gate
    shoots full page at deviceScaleFactor 1, so a document pixel is an image
    pixel and no scaling is needed. The site is white at the top with the
    sticky bar's own artwork in it, so on every chromed route the first ink is
    the logo at about 14 CSS px. A shot whose top rows are blank is a shot with
    no bar in it, which is what a settle that photographs mid-animation
    produces, and it is the artefact nothing in THIS script could see before.

    ⚠ 415b, rel415 MINOR 9: WHAT COUNTS AS INK IS NOW TIGHTER THAN "NOT WHITE".
    The first draft asked whether any channel of any sampled pixel was under
    246, and the site's cream is `(247, 241, 230)`, whose green and blue are
    already under it. On any page whose top rows are cream rather than white
    that test returns the first row it looks at and passes with no bar on the
    screen at all: it asserted that something non-white was there, not that
    the bar was. `INK_MAX` is the fix. It asks for a pixel darker on EVERY
    channel than the darkest channel of either ground this site has (white
    `(255, 255, 255)` and cream `(247, 241, 230)`, so 230 is the number to
    beat), which cream cannot satisfy and the bar's navy logo ink `(0, 17, 43)`
    satisfies easily. Measured over all 28 shots of this gate, the deepest
    first ink moves from 10 CSS px to 14 and the pixel found changes from a
    near-white orange fringe to the mark's own arc and the nav's navy.

    It is still a test for INK rather than for the header specifically: it
    cannot tell the bar from anything else dark in the top `limit` rows. That
    is the limit of reading a picture, and it is stated here rather than
    claimed away.
    """
    with Image.open(path) as image:
        rgb = image.convert("RGB")
        width, height = rgb.size
        pixels = rgb.load()
        for y in range(0, min(limit, height)):
            for x in range(0, width, 2):
                if max(pixels[x, y][:3]) < INK_MAX:
                    return float(y)
    return None


# The computed background-color is read through a canvas rather than parsed.
# A custom property with an opacity modifier computes to `oklab(...)` in
# Chromium, and a colour-space parser in this script is a second place for the
# maths to be wrong. Painting the value over white and reading the pixel back
# gives the sRGB the visitor actually sees, in any colour space, composited the
# way the browser composites it.
GROUNDS = """
() => {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const read = (value) => {
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 1, 1);
    ctx.fillStyle = value;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    return [r, g, b];
  };
  const header = document.querySelector('header');
  const body = getComputedStyle(document.body).backgroundColor;
  const bar = header ? getComputedStyle(header).backgroundColor : 'rgb(255,255,255)';
  return { body, bar, bodyRgb: read(body), barRgb: read(bar) };
}
"""

# The rectangles that are CONTENT rather than ground: photographs, the map's
# canvas and its SVG, and the one navy plate a route is allowed. Read in
# document space, which is the screenshot's own space.
MASKS = """
() => {
  const out = [];
  document.querySelectorAll('img, canvas, svg, .section-dark').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return;
    out.push([
      Math.floor(r.left + scrollX),
      Math.floor(r.top + scrollY),
      Math.ceil(r.right + scrollX),
      Math.ceil(r.bottom + scrollY),
    ]);
  });
  return out;
}
"""

# ---------------------------------------------------------------------------
# 7. THE REVEAL PROBE
#
# Installed BEFORE any of the page's own scripts, so it is already sampling
# while the browser is still painting the server's HTML. It walks to the first
# `.reveal` inside <main> and records the computed opacity every 16ms.
#
# The interesting window is between the server's paint and HYDRATION, and on a
# fast local server that window is a few milliseconds wide. The caller widens
# it with real network throttling, and then waits for hydration to actually
# land before it stops sampling: a probe that finishes before the bundle runs
# proves nothing at all, which is what the first draft of this one did.
REVEAL_SAMPLER = """
(() => {
  const START = performance.now();
  const MIN_MS = 1200;
  const samples = [];
  window.__revealSamples = samples;
  window.__revealProbeStop = false;
  const tick = () => {
    const el = document.querySelector('main .reveal');
    if (el) {
      samples.push([
        Math.round(performance.now() - START),
        getComputedStyle(el).opacity,
        el.getAttribute('data-revealed') || '',
      ]);
    }
    if (performance.now() - START < MIN_MS || !window.__revealProbeStop) {
      setTimeout(tick, 16);
    }
  };
  setTimeout(tick, 0);
})();
"""

FIRST_REVEAL = (
    "() => { const el = document.querySelector('main .reveal'); return el ? {"
    "  top: Math.round(el.getBoundingClientRect().top + scrollY),"
    "  attr: el.getAttribute('data-revealed') || '(none)',"
    "} : null; }"
)

# Routes where the first `Reveal` remains in the first viewport, so its
# opacity has no legitimate reason to move. Wave 946 made About and partner
# introductions static; Legal and the registration directory retain Reveal.
# Keep the same throttled hydration and opacity assertions on those fixtures.
REVEAL_PROBE_PAGES = ["/legal", "/register"]
REVEAL_PROBE_WIDTH = 1280
REVEAL_PROBE_MIN_MS = 1200
REVEAL_SETTLE_MS = 600
REVEAL_HYDRATE_TIMEOUT_MS = 20000


def reveal_probe(browser, base: str, failures: list[str]) -> None:
    """Assert that no above-the-fold Reveal is painted, un-painted and re-faded.

    The assertion is one-directional on purpose: opacity may RISE (an element
    the component itself hid, arriving) and may never FALL once it has been 1
    (content the server already painted, being taken away).

    Wave 412 failed this. `Reveal` sent an element that was already on screen
    at mount straight to `data-revealed="true"`, and that state carries
    `animation: rise-in ... both`, whose backwards fill paints opacity 0 on
    the first frame. The prerendered page painted, the bundle landed, and the
    first block of /about blinked out and faded back in.
    """
    for path in REVEAL_PROBE_PAGES:
        page = browser.new_page(viewport={"width": REVEAL_PROBE_WIDTH, "height": 900})
        page.add_init_script(REVEAL_SAMPLER)
        # Real throttling, so the gap between the server's paint and hydration
        # is wide enough to sample rather than a race this would usually win.
        cdp = page.context.new_cdp_session(page)
        cdp.send(
            "Network.emulateNetworkConditions",
            {
                "offline": False,
                "latency": 60,
                "downloadThroughput": 400 * 1024,
                "uploadThroughput": 400 * 1024,
            },
        )
        page.goto(f"{base}{path}", wait_until="commit")

        # Hydration is the event this probe is about. `data-revealed` is set
        # from the component's layout effect and can only appear once the
        # bundle has run, so it is the marker, and waiting for it is what
        # keeps the sampling window honest.
        hydrated = True
        try:
            page.wait_for_selector(
                "main .reveal[data-revealed]", timeout=REVEAL_HYDRATE_TIMEOUT_MS
            )
        except Exception:
            hydrated = False

        # Long enough after hydration for a 350ms rise-in plus its delay to
        # have played out, and never shorter than the 1200ms window.
        page.wait_for_timeout(REVEAL_SETTLE_MS)
        elapsed = page.evaluate("() => { const s = window.__revealSamples; "
                                "return s && s.length ? s[s.length - 1][0] : 0; }")
        if elapsed < REVEAL_PROBE_MIN_MS:
            page.wait_for_timeout(REVEAL_PROBE_MIN_MS - elapsed + 50)
        page.evaluate("() => { window.__revealProbeStop = true; }")

        samples = page.evaluate("() => window.__revealSamples || []")
        first = page.evaluate(FIRST_REVEAL)
        page.close()

        where = f"reveal probe {path} @ {REVEAL_PROBE_WIDTH}"
        if first is None:
            failures.append(f"{where}: no `.reveal` inside <main> to probe.")
            continue
        if not samples:
            failures.append(f"{where}: no samples taken. The probe did not run.")
            continue

        opacities = [float(sample[1]) for sample in samples]
        window_ms = samples[-1][0]
        states = sorted({sample[2] or "(none)" for sample in samples})
        seen_full = False
        dropped = None
        for moment, opacity, attr in samples:
            value = float(opacity)
            if value >= 0.999:
                seen_full = True
            elif seen_full and dropped is None:
                dropped = (moment, value, attr)

        print(
            f"reveal {path:<26} {len(samples):>3} samples over {window_ms}ms  "
            f"min_opacity={min(opacities):.3f}  first_reveal_top={first['top']}px  "
            f"hydrated={'yes' if hydrated else 'NO'}  "
            f"states={'/'.join(states)}  final={first['attr']}"
        )

        if not hydrated:
            failures.append(
                f"{where}: no `.reveal` carried data-revealed within "
                f"{REVEAL_HYDRATE_TIMEOUT_MS}ms, so the bundle never hydrated and "
                f"this probe proved nothing. Loosen the throttle or fix the build."
            )
            continue
        if first["top"] >= 900:
            failures.append(
                f"{where}: the first Reveal is at y={first['top']}, below the "
                f"{REVEAL_PROBE_WIDTH}x900 fold. This probe only proves something "
                f"about above-the-fold content; point it at a route whose first "
                f"Reveal is in the first viewport."
            )
            continue
        if not seen_full:
            failures.append(
                f"{where}: the first Reveal never reached opacity 1 in "
                f"{window_ms}ms (lowest {min(opacities):.3f})."
            )
            continue
        if dropped is not None:
            failures.append(
                f"{where}: opacity fell to {dropped[1]:.3f} at {dropped[0]}ms after "
                f"having been 1 (data-revealed={dropped[2]!r}). Content the server "
                f"painted was taken away and faded back in."
            )


# A raw string: the JS below carries a backslash-s regex.
AXE_RUN = r"""
async () => {
  const results = await axe.run(document, {
    runOnly: { type: 'rule', values: ['color-contrast'] },
  });

  // Read a CSS colour twice, over white and over black, so the caller can
  // recover its alpha and composite it over the ground it ACTUALLY sits on.
  // Parsing `rgba(...)` here would be a second place for the maths to be
  // wrong; the compositor is already in the browser.
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const read = (value, under) => {
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = under;
    ctx.fillRect(0, 0, 1, 1);
    ctx.fillStyle = value;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    return [r, g, b];
  };

  const violations = results.violations.flatMap((v) =>
    v.nodes
      .filter((n) => n.impact === 'serious' || n.impact === 'critical')
      .map((n) => ({
        id: v.id,
        impact: n.impact,
        target: n.target.join(' '),
        detail: (n.any[0] && n.any[0].message) || '',
      })),
  );

  // INCOMPLETE IS NOT A CLEAN BILL OF HEALTH. axe returns it when it cannot
  // resolve what is behind the text: a background image, a translucent
  // ancestor, an absolutely positioned overlay. Those are exactly the places
  // an inverted palette goes wrong, so every one of them comes back here with
  // enough information for the caller to measure it off the screenshot.
  const incomplete = [];
  for (const rule of results.incomplete) {
    for (const node of rule.nodes) {
      const selector = node.target.join(' ');
      let element = null;
      try {
        element = document.querySelector(selector);
      } catch (error) {
        element = null;
      }
      const entry = {
        id: rule.id,
        impact: node.impact || '',
        target: selector,
        detail: (node.any[0] && node.any[0].message) || '',
        text: '',
        colour: '',
        overWhite: null,
        overBlack: null,
        inks: [],
        fontSize: 0,
        fontWeight: 400,
        rect: null,
        pastScrollEdge: false,
      };
      if (element) {
        const style = getComputedStyle(element);
        const box = element.getBoundingClientRect();
        entry.text = (element.innerText || element.textContent || '')
          .trim()
          .replace(/\s+/g, ' ')
          .slice(0, 60);
        entry.colour = style.color;
        entry.overWhite = read(style.color, '#ffffff');
        entry.overBlack = read(style.color, '#000000');
        // Every text colour whose own box OVERLAPS this one. An inline
        // <span> inside a two-colour headline has its SIBLING'S glyphs inside
        // its own bounding box, and without this list the ground reader picks
        // the sibling's ink as the ground and reports 2.90:1 on a headline
        // anybody can read. The overlap test matters as much as the list: a
        // white label elsewhere in the same parent would otherwise disqualify
        // a white GROUND, and then there is nothing left to measure against.
        const scope = element.parentElement || element;
        const overlaps = (other) => {
          const r = other.getBoundingClientRect();
          return !(
            r.right <= box.left ||
            r.left >= box.right ||
            r.bottom <= box.top ||
            r.top >= box.bottom
          );
        };
        const inks = new Set([style.color]);
        if (overlaps(scope)) inks.add(getComputedStyle(scope).color);
        scope.querySelectorAll('*').forEach((child) => {
          if (inks.size < 16 && overlaps(child)) inks.add(getComputedStyle(child).color);
        });
        entry.inks = [...inks].map((value) => read(value, '#ffffff'));
        entry.fontSize = parseFloat(style.fontSize) || 0;
        entry.fontWeight = parseInt(style.fontWeight, 10) || 400;
        entry.rect = [
          Math.floor(box.left + scrollX),
          Math.floor(box.top + scrollY),
          Math.ceil(box.right + scrollX),
          Math.ceil(box.bottom + scrollY),
        ];
        // Wave 964: the same hero-only snap strip now runs at every width.
        // Offscreen slides cannot yield screenshot colour samples. The bucket
        // remains limited to .hero-band, and wave909-experience checks all
        // three visible photo/caption states at both widths with axe and images.
        entry.pastScrollEdge = false;
        const strip = element.closest('.hero-band');
        if (strip && strip.scrollWidth > strip.clientWidth + 2) {
          const lane = strip.getBoundingClientRect();
          const shown = Math.min(box.right, lane.right) - Math.max(box.left, lane.left);
          if (shown < box.width / 2) entry.pastScrollEdge = true;
        }
      }
      incomplete.push(entry);
    }
  }

  return { violations, incomplete };
}
"""

# ---------------------------------------------------------------------------
# MEASURING WHAT AXE COULD NOT
#
# Wave 412 counted `results.violations` and dropped `results.incomplete`, and
# both of the AA failures the rel412 verdict found were sitting in the second
# list: the /about sourced-figure ledger, whose band carries a photograph
# behind it, and the /platform difference card, which is `bg-page/55` under a
# gradient layer and a blurred radial tint. axe declines to guess at either,
# and a gate that reads only the first list reports a clean page.
#
# So the screenshot answers instead. For each incomplete node: take its
# bounding box out of the full-page shot, call the MODAL pixel in that box the
# ground (in a box drawn round a line of text, the ground is most of it), take
# the element's own computed colour composited onto that ground as the glyph,
# and measure the pair against the floor its size and weight answer to.
#
# A node whose own colour cannot be found anywhere inside its box is not
# painted where its rect says it is (a closed disclosure, a clipped carousel
# slide, an element read at the wrong scroll). Those are reported as
# UNMEASURED and counted, rather than quietly passed.

GLYPH_TOLERANCE = 12  # per channel, enough to tell a glyph from its ground
# Looser, and only for "is this text painted here at all". A 10px glyph in a
# condensed mono face can be anti-aliased all the way through and never reach
# its own colour exactly; 18 per channel is still far nearer the ink than any
# ground the ink would be legible on.
PRESENCE_TOLERANCE = 18
GROUND_SHARE_FLOOR = 0.20  # of the box, or the glyphs have filled it
GROUND_RING = 4  # px read from just outside the box when they have
GROUND_MIN_PIXELS = 24  # below this there is nothing to call a ground
LARGE_TEXT_PX = 24.0
LARGE_BOLD_PX = 18.66
LARGE_BOLD_WEIGHT = 700
AA_BODY = 4.5
AA_LARGE = 3.0


def contrast(first, second) -> float:
    high = max(luminance(first), luminance(second))
    low = min(luminance(first), luminance(second))
    return (high + 0.05) / (low + 0.05)


def composite(over_white, over_black, ground):
    """Recover a colour's alpha from its two readings and lay it on `ground`."""
    spread = sum(w - b for w, b in zip(over_white, over_black)) / 3
    alpha = 1 - max(0.0, min(255.0, spread)) / 255
    return tuple(
        max(0, min(255, round(black + (1 - alpha) * base)))
        for black, base in zip(over_black, ground)
    )


def floor_for(font_size: float, font_weight: int) -> float:
    large = font_size >= LARGE_TEXT_PX or (
        font_size >= LARGE_BOLD_PX and font_weight >= LARGE_BOLD_WEIGHT
    )
    return AA_LARGE if large else AA_BODY


def measure_incomplete(path: Path, nodes):
    """Measure every axe `incomplete` colour-contrast node off the pixels.

    Returns (measured, unmeasured, off_screen). A measured row is
    (target, text, colour, size, weight, ground, glyph, ratio, floor).
    `off_screen` is the nodes that are not on the screen at this width and are
    therefore neither measured nor failed; `unmeasured` is still a failure.
    """
    measured = []
    unmeasured = []
    off_screen = []
    with Image.open(path) as image:
        rgb = image.convert("RGB")
        width, height = rgb.size
        pixels = rgb.load()
        for node in nodes:
            label = (
                node["target"],
                node["text"] or "(no text)",
                node["colour"] or "(no colour)",
            )
            box = node["rect"]
            if not box or node["overWhite"] is None:
                unmeasured.append((*label, "axe named an element the page no longer has"))
                continue
            left = max(0, min(width, box[0]))
            top = max(0, min(height, box[1]))
            right = max(0, min(width, box[2]))
            bottom = max(0, min(height, box[3]))
            if right - left < 2 or bottom - top < 2:
                unmeasured.append((*label, "no area inside the shot"))
                continue
            # The same rule, one box in: a node past the edge of its own
            # snap strip (the hero, below 768 only) is not on the screen either. See the
            # note beside `pastScrollEdge` in the collector above.
            if node.get("pastScrollEdge"):
                off_screen.append((*label, "past the edge of the hero strip"))
                continue

            # THE GROUND IS THE MODAL PIXEL INSIDE THE BOX THAT IS NOT A
            # GLYPH. Inside, and not outside: an element that paints its own
            # background (a filled button, a badge, a plate over a photograph)
            # carries its ground WITH it, and a ring read outside such a box
            # measures the page instead, which reported the partner pages'
            # primary button as white on cream at 1.14:1.
            #
            # "Not a glyph" means: not within tolerance of ANY text colour in
            # the neighbourhood. The element's own colour is not enough, since
            # an inline span's bounding box overlaps its siblings' glyphs, and
            # reading the box whole reported a two-colour headline as 2.90:1
            # against its own second colour.
            inks = [tuple(ink) for ink in node["inks"]] or [tuple(node["overWhite"])]

            def is_ink(pixel):
                return any(
                    max(abs(a - b) for a, b in zip(pixel, ink)) <= GLYPH_TOLERANCE
                    for ink in inks
                )

            counts = {}
            for y in range(top, bottom):
                for x in range(left, right):
                    pixel = pixels[x, y]
                    counts[pixel] = counts.get(pixel, 0) + 1
            total = sum(counts.values())
            clean = {pixel: n for pixel, n in counts.items() if not is_ink(pixel)}

            # A box the glyphs have filled has no ground in it to read, so
            # fall back to the ring immediately outside: the same place the
            # rel412 verdict read the /about ledger by hand.
            if sum(clean.values()) < GROUND_SHARE_FLOOR * total:
                clean = {}
                outer = (
                    max(0, left - GROUND_RING),
                    max(0, top - GROUND_RING),
                    min(width, right + GROUND_RING),
                    min(height, bottom + GROUND_RING),
                )
                for y in range(outer[1], outer[3]):
                    inside_rows = top <= y < bottom
                    for x in range(outer[0], outer[2]):
                        if inside_rows and left <= x < right:
                            continue
                        pixel = pixels[x, y]
                        if not is_ink(pixel):
                            clean[pixel] = clean.get(pixel, 0) + 1
            if sum(clean.values()) < GROUND_MIN_PIXELS:
                unmeasured.append((*label, "no ground to read in or around its box"))
                continue
            ground = max(clean.items(), key=lambda item: item[1])[0]
            glyph = composite(node["overWhite"], node["overBlack"], ground)

            # And the glyph has to actually be painted where its rect says it
            # is. A closed disclosure, a clipped slide or an element read at
            # the wrong scroll is reported as unmeasured, never as a pass.
            nearest = 255
            for y in range(top, bottom):
                for x in range(left, right):
                    nearest = min(
                        nearest, max(abs(a - b) for a, b in zip(pixels[x, y], glyph))
                    )
                    if nearest <= PRESENCE_TOLERANCE:
                        break
                if nearest <= PRESENCE_TOLERANCE:
                    break
            if nearest > PRESENCE_TOLERANCE:
                unmeasured.append(
                    (*label, f"its own colour is not painted in its box (nearest {nearest})")
                )
                continue

            measured.append(
                (
                    node["target"],
                    node["text"] or "(no text)",
                    node["colour"],
                    node["fontSize"],
                    node["fontWeight"],
                    ground,
                    glyph,
                    contrast(glyph, ground),
                    floor_for(node["fontSize"], node["fontWeight"]),
                )
            )
    return measured, unmeasured, off_screen


def main() -> None:
    # Element text comes straight off the page, and the page is full of
    # middots, arrows and curly quotes. A gate that dies of cp1252 on page 9
    # has asserted nothing at all about pages 10 to 14.
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--baseline",
        action="store_true",
        help="measure only: no assertions, no images kept, for reading origin/main",
    )
    parser.add_argument("--build", default=str(BUILD), help="path to a built dist/client")
    args = parser.parse_args()

    build = Path(args.build)
    if not (build / "index.html").exists():
        raise SystemExit(f"No build at {build}. Run: STATIC_BUILD=true bun run build")
    if not AXE.exists():
        raise SystemExit(f"No axe-core at {AXE}. Run: bun install")

    axe_source = AXE.read_text(encoding="utf-8")
    port = serve(build)
    base = f"http://127.0.0.1:{port}"
    out = OUT if not args.baseline else ROOT / "docs" / "screenshots" / "wave412-baseline"
    out.mkdir(parents=True, exist_ok=True)

    failures: list[str] = []
    rows: list[tuple[str, int, float, float, float, int, int, bool]] = []
    incomplete_tally: list[tuple[str, int, int, int, int, int]] = []

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        for path, slug in PAGES:
            for width in WIDTHS:
                page = browser.new_page(viewport={"width": width, "height": 900})
                page.goto(f"{base}{path}", wait_until="networkidle")
                settle(page)
                # ⚠ AND IT MUST HAVE ARRIVED. WAVE 415, rel414b MINOR 1. The
                # old settle scrolled smoothly and waited blind; every number
                # below is read off a page this line has now confirmed is at
                # the top, and a page that will not go back fails here rather
                # than quietly producing a dark-pixel share for the wrong
                # frame.
                resting = to_top(page)
                if resting > 0.5:
                    failures.append(
                        f"{slug} at {width}: the page would not return to the top "
                        f"after settle, resting at scrollY={resting:g}. Everything "
                        f"measured on this shot is measured on the wrong frame."
                    )

                overflow = page.evaluate(
                    "() => [document.documentElement.scrollWidth, window.innerWidth]"
                )
                grounds = page.evaluate(GROUNDS)
                islands = page.evaluate(
                    "() => document.querySelectorAll('main .section-dark').length"
                )
                text_chars = page.evaluate("() => document.body.innerText.trim().length")

                masks = page.evaluate(MASKS)
                target = out / f"{slug}-{width}.png"
                page.screenshot(path=str(target), full_page=True)
                share, ground = dark_shares(target, masks)
                # AND THE SHOT ITSELF IS READ, at the top, for the bar. Wave
                # 415, rel414b MINOR 1. The 404 is the one route with no
                # header, deliberately: scripts/pages-postbuild.mjs writes it
                # as a standalone document, so it is exempt by name and by
                # nothing else.
                if slug != "404":
                    ink = first_ink_row(target)
                    if ink is None or ink > HEADER_INK_MAX:
                        failures.append(
                            f"{slug} at {width}: the first ink in {target.name} is at "
                            + (
                                "nothing in the top 240px"
                                if ink is None
                                else f"y={ink:g}"
                            )
                            + f", past the {HEADER_INK_MAX:g}px the sticky bar's own "
                            "artwork occupies. The bar is not in its own shot."
                        )

                page.add_script_tag(content=axe_source)
                axe_result = json.loads(json.dumps(page.evaluate(AXE_RUN)))
                violations = axe_result["violations"]
                measured, unmeasured, off_screen = measure_incomplete(
                    target, axe_result["incomplete"]
                )

                body_luminance = luminance(grounds["bodyRgb"])
                header_luminance = luminance(grounds["barRgb"])
                fits = overflow[0] <= overflow[1]

                print(
                    f"{slug:<30} {width:>5}  raw={share * 100:5.2f}%  "
                    f"ground={ground * 100:5.2f}%  "
                    f"body_L={body_luminance:.3f}  header_L={header_luminance:.3f}  "
                    f"islands={islands}  axe={len(violations)}  "
                    f"incomplete={len(axe_result['incomplete'])}"
                    f"(measured {len(measured)}, unmeasured {len(unmeasured)}, "
                    f"off screen {len(off_screen)})  "
                    f"text={text_chars}  "
                    f"scrollWidth={overflow[0]}/{overflow[1]}"
                )
                # Every incomplete node, with the text axe found, the colour it
                # computed, and the pair read back off this shot's own pixels.
                for row in measured:
                    node, words, colour, size, weight, back, ink, value, floor = row
                    print(
                        f"    {'ok ' if value >= floor else 'FAIL'} {value:5.2f}:1 "
                        f"(floor {floor:.1f})  {size:g}px/{weight}  {colour} on "
                        f"rgb{back} -> rgb{ink}  {node}  \"{words}\""
                    )
                for node, words, colour, why in unmeasured:
                    print(f"    --  unmeasured: {why}  {node}  \"{words}\" {colour}")
                for node, words, colour, why in off_screen:
                    print(f"    --  off screen: {why}  {node}  \"{words}\" {colour}")
                incomplete_tally.append(
                    (slug, width, len(axe_result["incomplete"]) - len(off_screen),
                     len(measured), len(unmeasured), len(off_screen))
                )
                rows.append(
                    (
                        slug,
                        width,
                        share,
                        ground,
                        body_luminance,
                        header_luminance,
                        islands,
                        len(violations),
                        fits,
                    )
                )

                if not args.baseline:
                    where = f"{slug} @ {width}"
                    if text_chars < MIN_TEXT_CHARS:
                        failures.append(
                            f"{where}: only {text_chars} characters of rendered text. "
                            f"The page is blank or nearly so."
                        )
                    if not fits:
                        failures.append(
                            f"{where}: horizontal overflow, "
                            f"scrollWidth {overflow[0]} > innerWidth {overflow[1]}"
                        )
                    if body_luminance <= LIGHT_GROUND_FLOOR:
                        failures.append(
                            f"{where}: body ground {grounds['body']} has luminance "
                            f"{body_luminance:.3f}, not above {LIGHT_GROUND_FLOOR}"
                        )
                    if header_luminance <= LIGHT_GROUND_FLOOR:
                        failures.append(
                            f"{where}: header ground {grounds['bar']} has luminance "
                            f"{header_luminance:.3f}, not above {LIGHT_GROUND_FLOOR}"
                        )
                    if islands > 1:
                        failures.append(
                            f"{where}: {islands} .section-dark islands inside <main>, at most 1"
                        )
                    ceiling = RAW_CEILING.get((slug, width), DARK_PIXEL_CEILING)
                    if share >= ceiling:
                        failures.append(
                            f"{where}: {share * 100:.2f}% of pixels are dark, "
                            f"ceiling {ceiling * 100:.1f}%"
                        )
                    if ground >= DARK_PIXEL_CEILING:
                        failures.append(
                            f"{where}: {ground * 100:.2f}% of the page's own GROUND is "
                            f"dark (photographs, the map field and the island masked "
                            f"out), ceiling {DARK_PIXEL_CEILING * 100:.0f}%"
                        )
                    for violation in violations:
                        failures.append(
                            f"{where}: axe {violation['id']} ({violation['impact']}) "
                            f"on {violation['target']}: {violation['detail']}"
                        )
                    for row in measured:
                        node, words, colour, size, weight, back, ink, value, floor = row
                        if value < floor:
                            failures.append(
                                f"{where}: {value:.2f}:1 against a {floor:.1f}:1 floor. "
                                f"{colour} at {size:g}px/{weight} on rgb{back}, measured "
                                f"off the shot's pixels because axe returned it as "
                                f"INCOMPLETE. {node} \"{words}\""
                            )
                    # AN UNMEASURED NODE IS NOT A PASS. rel412b MINOR 3.
                    # Until wave 413 this list was printed and tallied and
                    # nothing more, so a later wave that put a failing pairing
                    # inside a closed disclosure, a clipped slide or an
                    # element read at the wrong scroll would have got a
                    # printed line and a green gate. The count is 0 on every
                    # page at the head this was added on, so nothing is being
                    # grandfathered in: it fails on the first one.
                    for node, words, colour, why in unmeasured:
                        failures.append(
                            f"{where}: an axe INCOMPLETE colour-contrast node could not "
                            f"be measured off the shot ({why}), so its pair is unproven. "
                            f"{node} \"{words}\" {colour}"
                        )

                page.close()

        if not args.baseline:
            reveal_probe(browser, base, failures)
        browser.close()

    total_incomplete = sum(entry[2] for entry in incomplete_tally)
    total_measured = sum(entry[3] for entry in incomplete_tally)
    total_unmeasured = sum(entry[4] for entry in incomplete_tally)
    # Wave 490b: the off-screen bucket is counted where it is used, so a
    # reader of the log can see how many nodes it took and on which shots.
    total_off_screen = sum(entry[5] for entry in incomplete_tally)
    off_screen_shots = [f"{e[0]} @ {e[1]}" for e in incomplete_tally if e[5]]
    print(
        f"\naxe colour-contrast INCOMPLETE nodes: {total_incomplete} across "
        f"{len(incomplete_tally)} shots, {total_measured} measured off the pixels, "
        f"{total_unmeasured} unmeasured; {total_off_screen} off screen past the "
        f"hero strip's edge below 768, on {', '.join(off_screen_shots) or 'no shot'}."
    )

    worst_raw = max(rows, key=lambda r: r[2])
    worst_ground = max(rows, key=lambda r: r[3])
    print(
        f"\n{len(rows)} shots in {out.relative_to(ROOT)}. "
        f"Darkest raw: {worst_raw[0]} @ {worst_raw[1]}, {worst_raw[2] * 100:.2f}%. "
        f"Darkest ground: {worst_ground[0]} @ {worst_ground[1]}, "
        f"{worst_ground[3] * 100:.2f}%."
    )

    if failures:
        print(f"\n{len(failures)} FAILURE(S):")
        for failure in failures:
            print(f"  - {failure}")
        raise SystemExit(1)
    if not args.baseline:
        print("All assertions passed.")


if __name__ == "__main__":
    main()

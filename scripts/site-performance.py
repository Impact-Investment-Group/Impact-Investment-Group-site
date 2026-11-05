"""CI-only, same-runner browser measurements. No live forms or external data."""
import argparse
import functools
import hashlib
import http.server
import json
from pathlib import Path
import threading

from playwright.sync_api import sync_playwright, expect

parser = argparse.ArgumentParser()
parser.add_argument("--site", type=Path)
parser.add_argument("--output", type=Path)
parser.add_argument("--compare", type=Path)
parser.add_argument("--assert-optimised", action="store_true")
args = parser.parse_args()

if args.compare:
    before = json.loads((args.compare / "baseline/report.json").read_text())
    after = json.loads((args.compare / "candidate/report.json").read_text())
    rows = []
    for old, new in zip(before["pages"], after["pages"], strict=True):
        assert (old["path"], old["width"]) == (new["path"], new["width"])
        if old.get("map_hash"):
            assert old["map_hash"] == new["map_hash"], "Map coastline pixels changed"
        rows.append({"path": new["path"], "width": new["width"], "baseline": old, "candidate": new})
    (args.compare / "comparison.json").write_text(json.dumps(rows, indent=2))
    print(json.dumps(rows, indent=2))
    raise SystemExit(0)

site = args.site.resolve()
out = args.output.resolve()
out.mkdir(parents=True, exist_ok=True)

class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(Handler, directory=str(site / "dist/client")))
threading.Thread(target=server.serve_forever, daemon=True).start()
base = f"http://127.0.0.1:{server.server_address[1]}"
stock = {"as_of": "2026-11-05T09:00:00Z", "total": 4321, "regions": {"North West": {"count": 4000}, "London": {"count": 231}, "Northern Ireland": {"count": 0}, "Unmapped": {"count": 90}}, "basis": "Demonstration aggregate for browser verification."}
instrumentation = """(() => {
  window.__perf = {raf:0, rect:0, longTasks:[], shifts:[]};
  const raf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = cb => raf(time => { window.__perf.raf++; cb(time); });
  const rect = Element.prototype.getBoundingClientRect;
  Element.prototype.getBoundingClientRect = function() { window.__perf.rect++; return rect.call(this); };
  new PerformanceObserver(list => list.getEntries().forEach(e => window.__perf.longTasks.push({at:e.startTime, ms:e.duration}))).observe({type:'longtask', buffered:true});
  new PerformanceObserver(list => list.getEntries().forEach(e => { if(!e.hadRecentInput) window.__perf.shifts.push(e.value); })).observe({type:'layout-shift', buffered:true});
})()"""

def snap(page):
    return page.evaluate("({time:performance.now(), raf:__perf.raf, rect:__perf.rect})")

def duration_metrics(session):
    return {m["name"]: m["value"] for m in session.send("Performance.getMetrics")["metrics"]}

report = {"cpu_slowdown": 4, "network": "local static HTTP; decoded bytes, not a network speed claim", "pages": []}
with sync_playwright() as pw:
    browser = pw.chromium.launch()
    for width in (390, 1280):
        for path in ("/", "/platform/", "/partner-with-investor/"):
            context = browser.new_context(viewport={"width": width, "height": 900}, device_scale_factor=1, has_touch=width == 390, is_mobile=width == 390, reduced_motion="no-preference")
            context.route("**/*", lambda route: route.abort() if route.request.method == "POST" else route.continue_())
            context.route("**/public/showcase-counts*", lambda route: route.fulfill(status=200, content_type="application/json", headers={"Access-Control-Allow-Origin":"*"}, body=json.dumps(stock)))
            context.add_init_script(instrumentation)
            page = context.new_page()
            session = context.new_cdp_session(page)
            session.send("Emulation.setCPUThrottlingRate", {"rate": 4})
            session.send("Performance.enable")
            errors = []
            page.on("pageerror", lambda error: errors.append(str(error)))
            response = page.goto(base + path, wait_until="networkidle")
            assert response.status == 200
            page.wait_for_timeout(1500)
            start = snap(page)
            page.wait_for_timeout(1000)
            stop = snap(page)
            row = {"path": path, "width": width, "idle_raf_per_second": round((stop["raf"]-start["raf"]) * 1000 / (stop["time"]-start["time"]), 1)}
            row["initial"] = page.evaluate("""() => ({js_bytes:performance.getEntriesByType('resource').filter(r=>r.name.endsWith('.js')).reduce((s,r)=>s+r.decodedBodySize,0), long_tasks:__perf.longTasks, cls:__perf.shifts.reduce((a,b)=>a+b,0), lenis:document.documentElement.classList.contains('lenis')})""")
            page.screenshot(path=str(out / f"{path.strip('/').replace('/','-') or 'home'}-{width}.png"))
            before = duration_metrics(session)
            start = snap(page)
            frames = page.evaluate("""async () => {
              const intervals=[]; let last=0; const start=performance.now();
              await new Promise(resolve => {
                const tick = now => {
                  if(last) intervals.push(now-last); last=now;
                  const t=Math.min(1,(now-start)/2400);
                  const end=Math.min(3600,document.documentElement.scrollHeight-innerHeight);
                  scrollTo({top:end*t,behavior:'instant'});
                  if(t<1) requestAnimationFrame(tick); else resolve();
                }; requestAnimationFrame(tick);
              });
              return intervals;
            }""")
            stop = snap(page)
            after = duration_metrics(session)
            frames.sort()
            row["scroll"] = {"rect_calls": stop["rect"]-start["rect"], "p95_frame_ms": round(frames[int(len(frames)*.95)],2), "frames_over_50ms": sum(f>50 for f in frames), "layout_ms": round((after["LayoutDuration"]-before["LayoutDuration"])*1000,2), "script_ms": round((after["ScriptDuration"]-before["ScriptDuration"])*1000,2), "task_ms": round((after["TaskDuration"]-before["TaskDuration"])*1000,2)}
            if path == "/":
                canvas = page.locator("[data-property-map] canvas")
                canvas.scroll_into_view_if_needed()
                page.wait_for_function("document.querySelector('[data-property-map] canvas').width > 300")
                page.wait_for_timeout(400)
                row["map_hash"] = hashlib.sha256(canvas.evaluate("n => n.toDataURL()").encode()).hexdigest()
                page.locator("[data-region-picker]").select_option("London")
                assert "231" in page.locator("[data-property-map]").inner_text()
                if args.assert_optimised:
                    expect(page.locator("[data-property-map]")).to_have_attribute("data-motion", "running")
                    page.emulate_media(reduced_motion="reduce")
                    expect(page.locator("[data-property-map]")).to_have_attribute("data-motion", "paused")
                    page.emulate_media(reduced_motion="no-preference")
                    expect(page.locator("[data-property-map]")).to_have_attribute("data-motion", "running")
            page.evaluate("scrollTo({top:0,behavior:'instant'})")
            page.wait_for_timeout(400)
            row["offscreen_running_animations"] = page.evaluate("""() => document.getAnimations().filter(a => {
              const t=a.effect?.target; if(!t || a.playState!=='running' || a.effect.getTiming().iterations!==Infinity) return false;
              const r=t.getBoundingClientRect(); return r.bottom<0 || r.top>innerHeight;
            }).length""")
            if width == 1280:
                page.mouse.move(900, 500)
                page.mouse.wheel(0, 600)
                page.wait_for_timeout(100)
                row["wheel_position_after_100ms"] = page.evaluate("scrollY")
            assert not errors, errors
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth + 1")
            if args.assert_optimised:
                assert row["idle_raf_per_second"] < 5, "Continuous idle animation loop remains"
                assert not row["initial"]["lenis"], "Wheel scrolling is still intercepted"
                assert row["offscreen_running_animations"] == 0, "Offscreen decorative animation remains active"
                if width == 390:
                    assert page.locator("header").evaluate("n => getComputedStyle(n).backdropFilter") == "none"
                # An unfinished image removed during navigation must release its listeners.
                page.evaluate("""() => {
                  const image = new Image(); Object.defineProperty(image, 'complete', {get:()=>false});
                  image.style.cssText='position:fixed;left:-100px;width:1px;height:1px';
                  image.id='performance-pending-image'; window.__pendingImage=image; document.body.append(image);
                }""")
                expect(page.locator("#performance-pending-image")).to_have_attribute("data-img", "pending")
                page.evaluate("__pendingImage.remove()")
                page.wait_for_function("__pendingImage.dataset.img === 'in'")
                page.evaluate("delete window.__pendingImage")
            report["pages"].append(row)
            print(json.dumps(row), flush=True)
            context.close()
    browser.close()
server.shutdown()
(out / "report.json").write_text(json.dumps(report, indent=2))

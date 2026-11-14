"""CI-only real vector-renderer contact sheets, tornado and construction samples.

The diagnostic bundle uses the production renderer source without canvas stubs.
Normal site-buddy.py journeys separately exercise the shipped Pages bundle.
"""
import functools
import http.server
import json
from pathlib import Path
import threading
from urllib.parse import urlparse

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs/screenshots/wave909/buddy-artwork"
OUT.mkdir(parents=True, exist_ok=True)
REPORT = {"checks": [], "failures": [], "basis": "real source bundled for CI; not a production-byte identity claim"}


class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass

    def translate_path(self, path):
        if urlparse(path).path == "/props.webp":
            return str(ROOT / "public/images/buddy/play-props-v1.webp")
        return super().translate_path(path)


server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(Handler, directory=str(OUT)))
threading.Thread(target=server.serve_forever, daemon=True).start()
BASE = f"http://127.0.0.1:{server.server_address[1]}"

RENDER = """async ({kind}) => {
  const {Character,pose,drawAmbientScene,sampleAmbientScene,AMBIENT_DURATIONS} = await import('./buddy-engine-proof.js');
  const rig = new Character();
  let props;
  if(kind==='construction'){
    props=new Image();props.src='./props.webp';await props.decode();
  }
  const forms=['Property / key','Investment / pound','Care / heart'];
  const sheet=document.createElement('main');sheet.id='sheet';
  const columns=kind==='turns'||kind==='construction'?4:kind==='poses'?6:8;
  sheet.style.cssText=`display:grid;grid-template-columns:repeat(${columns},1fr);gap:12px;padding:20px`;
  document.body.append(sheet);
  const records=[];
  function cell(label,draw) {
    const card=document.createElement('figure');card.style.cssText='margin:0;background:white;border:1px solid #dddeda;border-radius:16px;overflow:hidden';
    const canvas=document.createElement('canvas');canvas.width=kind==='construction'?952:560;canvas.height=kind==='construction'?672:560;canvas.style.cssText='width:100%;height:auto;display:block';
    const context=canvas.getContext('2d');context.scale(1.4,1.4);draw(context);
    const pixels=context.getImageData(0,0,canvas.width,canvas.height).data;
    let count=0,left=canvas.width,right=0,top=canvas.height,bottom=0;
    for(let i=3;i<pixels.length;i+=4){if(pixels[i]>8){const pixel=(i-3)/4,x=pixel%canvas.width,y=Math.floor(pixel/canvas.width);count++;left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}}
    const caption=document.createElement('figcaption');caption.textContent=label;caption.style.cssText='padding:8px 12px 14px;font-size:12px;line-height:1.35';
    card.append(canvas,caption);sheet.append(card);
    records.push({label,painted:count,size:{width:canvas.width,height:canvas.height},bounds:{left,right,top,bottom},pixels:canvas.toDataURL()});
  }
  const formCount=kind==='construction'?1:3;
  for(let form=0;form<formCount;form++){
    if(kind==='turns'){
      for(const [label,yaw] of [['Front',0],['Three-quarter',Math.PI/3],['Side',Math.PI/2],['Back',Math.PI]]){
        const p={...pose(form,0,.55,0,2),yaw};
        cell(`${forms[form]}: ${label}`,ctx=>rig.draw(ctx,form,p,200,200,.92));
      }
    }else if(kind==='poses'){
      for(const [label,state,time] of [['Wave',1,.3],['Listening',2,.6],['Thinking',3,.5],['Celebrate',9,.4],['Dance',24,.7],['Build stance',28,.8]]){
        cell(`${forms[form]}: ${label}`,ctx=>rig.draw(ctx,form,pose(form,state,time,1,0),200,200,.88));
      }
    }else if(kind==='construction'){
      const source=pose(form,0,.55,0,2),target=pose(form,0,.55,0,2);
      for(let frame=0;frame<=15;frame++){
        const seconds=AMBIENT_DURATIONS.build*frame/15;
        cell(`Buddy builds a home: ${seconds.toFixed(2)} seconds`,ctx=>drawAmbientScene(ctx,rig,props,form,'build',seconds,20,20,1,2,source,target));
        const sampled=sampleAmbientScene(form,'build',seconds,2,source,target);
        records.at(-1).actor={x:sampled.x,y:sampled.y,scale:sampled.scale};
      }
    }else{
      const to=(form+1)%3,fromPose=pose(form,0,.55,0,2),toPose=pose(to,0,.55,0,2);
      for(let frame=0;frame<=15;frame++){
        const progress=frame/15;
        cell(`${forms[form]} to ${forms[to]}: ${progress.toFixed(2)}`,ctx=>rig.transition(ctx,form,to,'Tornado',progress,0,1,200,200,.88,fromPose,toPose));
      }
    }
  }
  const distinct=new Set(records.map(row=>row.pixels)).size;
  const size=records.length/formCount;
  const distinctByForm=Array.from({length:formCount},(_,form)=>new Set(records.slice(form*size,(form+1)*size).map(row=>row.pixels)).size);
  return {kind,distinct,distinctByForm,frames:records.map(({pixels,...record})=>record)};
}"""

try:
    assert (OUT / "buddy-engine-proof.js").is_file(), "CI renderer bundle is missing"
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        context = browser.new_context(viewport={"width": 1600, "height": 1100}, device_scale_factor=1)
        page = context.new_page()
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.goto(BASE, wait_until="networkidle")
        for kind, expected in [("turns", 12), ("poses", 18), ("tornado", 48), ("construction", 16)]:
            page.set_content('<html><head><style>body{margin:0;background:#F9F9F4;color:#14366A;font:14px Arial,sans-serif}h1{margin:24px 28px 0;font-size:22px}</style></head><body><h1>Buddy vector renderer: ' + kind + '</h1></body></html>')
            result = page.evaluate(RENDER, {"kind": kind})
            assert len(result["frames"]) == expected
            minimum_distinct = expected - 1 if kind == "construction" else expected // 3
            assert all(count >= minimum_distinct for count in result["distinctByForm"]), "A form repeats its views or animation frames"
            for frame in result["frames"]:
                assert frame["painted"] > 500, f'Blank or vanishing character: {frame["label"]}'
                b = frame["bounds"]
                assert b["right"] - b["left"] > 12, f'Side geometry collapsed into a line: {frame["label"]}'
                assert 0 < b["left"] < b["right"] < frame["size"]["width"] - 1 and 0 < b["top"] < b["bottom"] < frame["size"]["height"] - 1, f'Artwork clipped by its canvas: {frame["label"]}'
            page.screenshot(path=str(OUT / f"buddy-{kind}.png"), full_page=True)
            REPORT["checks"].append(result)
        assert not errors, errors
        browser.close()
except Exception as error:
    REPORT["failures"].append(str(error))
finally:
    server.shutdown()
    server.server_close()
    (OUT / "report.json").write_text(json.dumps(REPORT, indent=2), encoding="utf-8")
    print(json.dumps({"checks": len(REPORT["checks"]), "failures": REPORT["failures"]}))

raise SystemExit(1 if REPORT["failures"] else 0)

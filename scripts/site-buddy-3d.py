"""CI-only inspection of real skinned 3D geometry, hands and authored movement."""
import functools
import http.server
import json
from pathlib import Path
import threading
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs/screenshots/wave909/buddy-3d'
REPORT = {'checks': [], 'failures': [], 'basis': 'Real OGL renderer and production GLB; CI-only browser proof'}


class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass

    def translate_path(self, path):
        if urlparse(path).path == '/images/buddy/3d/buddy.glb':
            return str(ROOT / 'public/images/buddy/3d/buddy.glb')
        return super().translate_path(path)


server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Handler, directory=str(OUT)))
threading.Thread(target=server.serve_forever, daemon=True).start()
BASE = f'http://127.0.0.1:{server.server_address[1]}'

RENDER = """async kind => {
  const {loadBuddyModel, createBuddyRenderer} = await import('./buddy-3d-proof.js');
  const model = await loadBuddyModel('/images/buddy/3d/buddy.glb');
  const canvas = document.createElement('canvas');
  const renderer = await createBuddyRenderer(canvas, model);
  renderer.resize(512,512,1);
  const sheet = document.createElement('main'); sheet.id='sheet';
  sheet.style.cssText='display:grid;grid-template-columns:repeat(4,1fr);gap:12px;padding:20px';
  document.body.append(sheet);
  const records=[];
  function cell(label, options) {
    // Settle clip cross-fade without replacing the real rig or shader.
    renderer.draw({...options,time:Math.max(0,(options.time||0)-.5),size:300,x:256,y:256});
    for(let i=0;i<8;i++)renderer.draw({...options,time:(options.time||0)-.35+i*.05,size:300,x:256,y:256});
    const copy=document.createElement('canvas');copy.width=512;copy.height=512;
    const ctx=copy.getContext('2d');ctx.drawImage(canvas,0,0);
    const pixels=ctx.getImageData(0,0,512,512).data;
    let painted=0,left=512,right=0,top=512,bottom=0;
    for(let i=3;i<pixels.length;i+=4)if(pixels[i]>8){const n=(i-3)/4,x=n%512,y=Math.floor(n/512);painted++;left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
    const image=copy.toDataURL();
    const figure=document.createElement('figure');figure.style.cssText='margin:0;border:1px solid #d8dedb;border-radius:16px;overflow:hidden;background:#fdfdfb';
    const img=document.createElement('img');img.src=image;img.style.cssText='display:block;width:100%';
    const caption=document.createElement('figcaption');caption.textContent=label;caption.style.cssText='padding:8px 12px;font:13px Arial';
    figure.append(img,caption);sheet.append(figure);
    records.push({label,painted,bounds:{left,right,top,bottom},image});
  }
  const forms=['property','investment','support'];
  for(const form of forms){
    if(kind==='turns')for(const [name,viewYaw]of[['front',0],['left',Math.PI/2],['back',Math.PI],['right',-Math.PI/2]])cell(`${form}: ${name}`,{form,time:1,viewYaw});
    if(kind==='poses')for(const action of ['wave','listen','think','talk','explain','reassure','approve','celebrate','dance','glide','stretch','peek'])cell(`${form}: ${action}`,{form,action,time:1.2});
    if(kind==='tornado')for(const to of forms.filter(x=>x!==form))for(let i=0;i<16;i++)cell(`${form} to ${to}: ${i+1}/16`,{form,time:i*.21,transition:{from:form,to,progress:i/15}});
    if(kind==='construction')for(let i=0;i<16;i++)cell(`${form}: build ${i+1}/16`,{form,time:i*.62,ambient:{kind:'build',time:i*.62,variant:0}});
    if(kind==='closeups')for(const action of ['approve','inspect'])for(let i=0;i<8;i++)cell(`${form}: ${action} ${i+1}/8`,{form,action,time:.2+i*.4});
    if(kind==='hands')for(const direction of ['left','right','up','down'])cell(`${form}: glass ${direction}`,{form,time:1,inspect:{hand:direction==='right'?'left':'right',direction,radius:68}});
  }
  const groups=kind==='tornado'?6:kind==='closeups'?6:3;
  const groupSize=records.length/groups;
  const distinct=Array.from({length:groups},(_,i)=>new Set(records.slice(i*groupSize,(i+1)*groupSize).map(row=>row.image)).size);
  const rig=renderer.inspectRig?.()||null;
  renderer.dispose();
  return {kind,distinct,rig,frames:records.map(({image,...row})=>row)};
}"""

try:
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
        page = browser.new_page(viewport={'width': 1440, 'height': 1000})
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(BASE, wait_until='networkidle')
        for kind, expected, distinct in [('turns', 12, 4), ('poses', 36, 10), ('tornado', 96, 14), ('construction', 48, 14), ('closeups', 48, 7), ('hands', 12, 4)]:
            page.set_content(f'<html><body style="margin:0;background:#f9f9f4;color:#14366a"><h1 style="font:24px Arial;padding:24px">Buddy hologram: {kind}</h1></body></html>')
            result = page.evaluate(RENDER, kind)
            page.screenshot(path=str(OUT / f'buddy-3d-{kind}.png'), full_page=True)
            REPORT['checks'].append(result)
            assert len(result['frames']) == expected, 'Missing authored views'
            assert all(n >= distinct for n in result['distinct']), f'{kind}: repeated poses or frames'
            for frame in result['frames']:
                b = frame['bounds']
                assert frame['painted'] > 500, f'Blank 3D frame: {frame["label"]}'
                assert b['right'] - b['left'] > 12, f'Collapsed profile: {frame["label"]}'
                assert 0 < b['left'] < b['right'] < 511 and 0 < b['top'] < b['bottom'] < 511, f'Clipped 3D character: {frame["label"]}'
            assert not errors, errors
        browser.close()
except Exception as error:
    REPORT['failures'].append(str(error))
finally:
    server.shutdown()
    server.server_close()
    (OUT / 'report.json').write_text(json.dumps(REPORT, indent=2), encoding='utf-8')
    print(json.dumps({'checks': len(REPORT['checks']), 'failures': REPORT['failures']}))
raise SystemExit(1 if REPORT['failures'] else 0)

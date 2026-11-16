"""CI-only inspection of real skinned 3D geometry, hands and authored movement."""
import base64
import functools
import http.server
import json
import math
from pathlib import Path
import re
import struct
import threading
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs/screenshots/wave909/buddy-3d'
REPORT = {'checks': [], 'failures': [], 'basis': 'Real OGL renderer and production GLB; CI-only browser proof'}
POSES = {
    'wave': ('Wave', 2.4), 'listen': ('Listen', 3.2), 'think': ('Think', 3.4),
    'talk': ('Talk', 2.8), 'explain': ('Explain', 2.8), 'reassure': ('Reassure', 3),
    'approve': ('Closeup_Thumb_R', 3.2), 'celebrate': ('Celebrate', 3),
    'dance': ('Dance', 4.8), 'glide': ('Glide', 2), 'stretch': ('Stretch', 4.2),
    'peek': ('Peek', 4.6), 'polish': ('Polish', 6.6),
}
RIG_NAMES = {'Hand.L', 'Hand.R', 'Grip.L', 'Grip.R'}
# Peek and Glide intentionally move the root. Other gestures must articulate
# the arms, so root motion alone cannot satisfy their sequence proof.
ARTICULATED = set(POSES) - {'peek', 'glide'}


def clip_catalogue():
    """Inspect the shipped binary, not the authoring manifest's promises."""
    binary = (ROOT / 'public/images/buddy/3d/buddy.glb').read_bytes()
    magic, version, length = struct.unpack_from('<4sII', binary)
    assert magic == b'glTF' and version == 2 and length == len(binary), 'Invalid production GLB'
    json_length, chunk = struct.unpack_from('<I4s', binary, 12)
    assert chunk == b'JSON', 'Missing production GLB metadata'
    gltf = json.loads(binary[20:20 + json_length])
    nodes = gltf.get('nodes', [])
    node_names = [node.get('name') for node in nodes]
    assert all(node_names.count(name) == 1 for name in RIG_NAMES), 'Missing or duplicated handed rig nodes'
    joints = {node_names[index] for skin in gltf.get('skins', []) for index in skin.get('joints', [])}
    assert {'Hand.L', 'Hand.R'} <= joints, 'Hands are not separate joints in the shipped skin'
    data_length, data_chunk = struct.unpack_from('<I4s', binary, 20 + json_length)
    assert data_chunk == b'BIN\x00', 'Missing production GLB skin data'
    data = memoryview(binary)[28 + json_length:28 + json_length + data_length]

    def vectors(accessor_index, width=4):
        accessor = gltf['accessors'][accessor_index]
        assert accessor['type'] == ('SCALAR' if width == 1 else 'VEC4') and not accessor.get('sparse'), 'Unsupported hand skin accessor'
        view = gltf['bufferViews'][accessor['bufferView']]
        assert view.get('buffer', 0) == 0, 'Hand skin is outside the production GLB'
        formats = {5121: ('B', 1), 5123: ('H', 2), 5125: ('I', 4), 5126: ('f', 4)}
        assert accessor['componentType'] in formats, 'Unsupported hand skin component type'
        code, size = formats[accessor['componentType']]
        offset = view.get('byteOffset', 0) + accessor.get('byteOffset', 0)
        stride = view.get('byteStride', size * width)
        rows = [struct.unpack_from('<' + code * width, data, offset + item * stride)
                for item in range(accessor['count'])]
        if accessor.get('normalized'):
            divisor = {5121: 255, 5123: 65535}[accessor['componentType']]
            rows = [tuple(value / divisor for value in row) for row in rows]
        return rows

    hand_weights = {}
    for side in ('L', 'R'):
        name = f'HandMesh.{side}'
        assert node_names.count(name) == 1, f'Missing or duplicated {name}'
        hand = nodes[node_names.index(name)]
        skin = gltf['skins'][hand['skin']]['joints']
        weighted_digits, vertices, triangles = set(), 0, 0
        for primitive_index, primitive in enumerate(gltf['meshes'][hand['mesh']]['primitives']):
            joint_rows = vectors(primitive['attributes']['JOINTS_0'])
            weight_rows = vectors(primitive['attributes']['WEIGHTS_0'])
            assert len(joint_rows) == len(weight_rows), f'{name}: mismatched hand skin rows'
            dominant_digits = []
            for vertex, (joint_row, weight_row) in enumerate(zip(joint_rows, weight_rows)):
                vertices += 1
                chains, chain_weights = set(), {}
                digit_weight = 0
                for joint, weight in zip(joint_row, weight_row):
                    assert math.isfinite(weight) and weight >= 0, f'{name}: invalid hand weight'
                    if weight == 0:
                        continue
                    joint_name = node_names[skin[joint]]
                    digit = re.fullmatch(r'(Index|Middle|Ring|Pinky|Thumb)\.\d{2}\.([LR])', joint_name)
                    if digit:
                        chain = f'{digit[1]}.{digit[2]}'
                        chains.add(chain)
                        digit_weight += weight
                        chain_weights[chain] = chain_weights.get(chain, 0) + weight
                        weighted_digits.add(chain)
                dominant_digits.append(max(chain_weights, key=chain_weights.get) if digit_weight > .5 else None)
                # A palm plus one finger's own joints is valid. Two different
                # digit chains pulling the same vertex deform the curled hand.
                assert len(chains) <= 1, f'{name} primitive {primitive_index} vertex {vertex}: mixed digit chains {sorted(chains)}'
            assert primitive.get('mode', 4) == 4, f'{name}: unsupported hand topology'
            indices = ([row[0] for row in vectors(primitive['indices'], 1)]
                       if 'indices' in primitive else list(range(len(joint_rows))))
            assert len(indices) % 3 == 0, f'{name}: incomplete hand triangles'
            assert all(isinstance(index, int) and 0 <= index < len(joint_rows) for index in indices), f'{name}: invalid hand indices'
            for index in range(0, len(indices), 3):
                triangles += 1
                chains = {dominant_digits[vertex] for vertex in indices[index:index + 3]} - {None}
                # Palm-majority web roots may join the hand; two different
                # digit-majority regions must never share a membrane face.
                assert len(chains) <= 1, f'{name} primitive {primitive_index} triangle {index // 3}: bridged digit chains {sorted(chains)}'
        expected_digits = {f'{digit}.{side}' for digit in ('Index', 'Middle', 'Ring', 'Pinky', 'Thumb')}
        assert vertices > 0 and triangles > 0 and weighted_digits == expected_digits, f'{name}: missing actual weighted fingers'
        hand_weights[side] = {'vertices': vertices, 'triangles': triangles, 'weighted_digits': sorted(weighted_digits),
                             'mixed_digit_vertices': 0, 'bridged_digit_triangles': 0}
    REPORT['hand_weight_contract'] = hand_weights
    clips = {clip.get('name'): clip for clip in gltf.get('animations', [])}
    required = {value[0] for value in POSES.values()} | {
        'Idle', 'Build', 'Closeup_Inspect_R', 'InspectLeft', 'InspectRight', 'InspectUp', 'InspectDown',
    }
    assert required <= clips.keys(), f'Missing real clips: {sorted(required - clips.keys())}'
    catalogue = {}
    for name in sorted(required):
        clip = clips[name]
        channels = clip.get('channels', [])
        targets = {nodes[channel['target']['node']].get('name') for channel in channels}
        assert targets & joints, f'{name}: no animation channels target the real skeleton'
        samples = [gltf['accessors'][sampler['input']]['count'] for sampler in clip.get('samplers', [])]
        # A static digit channel may legitimately be optimized to one key.
        # The clip as a whole must contain a sampled authored trajectory.
        assert samples and max(samples) >= 3, f'{name}: no sampled authored animation'
        catalogue[name] = {'channels': len(channels), 'minimum_samples': min(samples),
                           'maximum_samples': max(samples), 'rig_targets': sorted(targets)}
    return catalogue


def determinant(matrix):
    return (matrix[0] * (matrix[5] * matrix[10] - matrix[6] * matrix[9])
            - matrix[4] * (matrix[1] * matrix[10] - matrix[2] * matrix[9])
            + matrix[8] * (matrix[1] * matrix[6] - matrix[2] * matrix[5]))


def validate_rig(frame):
    rig, label = frame['rig'], frame['label']
    assert len(rig) == 4 and {bone['name'] for bone in rig} == RIG_NAMES, f'{label}: missing handed rig metadata'
    by_name = {bone['name']: bone for bone in rig}
    for bone in rig:
        for key, length in [('scale', 3), ('quaternion', 4), ('local', 16), ('world', 16)]:
            values = bone[key]
            assert len(values) == length and all(isinstance(value, (int, float)) and math.isfinite(value) for value in values), f'{label}: invalid {bone["name"]} {key}'
        assert all(value > 0 for value in bone['scale']), f'{label}: reflected {bone["name"]} scale'
        assert determinant(bone['local']) > 1e-8 and determinant(bone['world']) > 1e-8, f'{label}: collapsed or reflected {bone["name"]}'
        assert math.isfinite(bone['determinant']) and math.isclose(bone['determinant'], determinant(bone['world']), rel_tol=1e-6, abs_tol=1e-8), f'{label}: inconsistent handedness metadata'
    for prefix in ['Hand', 'Grip']:
        left, right = (by_name[f'{prefix}.{side}']['world'][12:15] for side in ['L', 'R'])
        assert math.dist(left, right) > 1e-6, f'{label}: left and right {prefix.lower()} occupy the same point'


def rig_signature(frame):
    return tuple(round(value, 6) for bone in sorted(frame['rig'], key=lambda item: item['name']) for value in bone['world'])


def hand_separation(frame):
    bones = {bone['name']: bone for bone in frame['rig']}
    return math.dist(bones['Hand.L']['world'][12:15], bones['Hand.R']['world'][12:15])


def validate_sequence(sequence):
    frames = sequence['frames']
    for frame in frames:
        validate_rig(frame)
    distinct = len({rig_signature(frame) for frame in frames})
    assert distinct >= sequence['minimum_distinct'], f'{sequence["label"]}: rig stayed still while pixels changed'
    separation = [hand_separation(frame) for frame in frames]
    spread = max(separation) - min(separation)
    if sequence.get('articulated'):
        assert spread > 1e-4, f'{sequence["label"]}: no independent arm movement; only the whole character moved'
    return {'label': sequence['label'], 'distinct_world_poses': distinct, 'hand_separation_range': spread}


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

RENDER = """async ({kind,poses}) => {
  const {loadBuddyModel, createBuddyRenderer, frameBuddyInspection, buddyCanvasLayout} = await import('./buddy-3d-proof.js');
  const model = await loadBuddyModel('/images/buddy/3d/buddy.glb');
  const canvas = document.createElement('canvas');
  const renderer = await createBuddyRenderer(canvas, model);
  if(typeof renderer.inspectRig!=='function')throw new Error('Production renderer lacks rig inspection');
  renderer.resize(512,512,1);
  const sheet = document.createElement('main'); sheet.id='sheet';
  sheet.style.cssText=`display:grid;grid-template-columns:repeat(${kind==='native'?8:4},1fr);gap:12px;padding:20px`;
  document.body.append(sheet);
  const records=[],sequences=[];
  function drawPose(options,settle=true,layout={}) {
    const side=layout.side||512, body=layout.body||300;
    const viewport=layout.native ? buddyCanvasLayout({size:body,inspect:Boolean(layout.inspectFit)})
      : {width:side,height:side,size:body,x:side/2,y:side/2};
    renderer.resize(viewport.width,viewport.height,1);
    const frame=layout.inspectFit ? frameBuddyInspection(renderer,{form:options.form,size:body,width:viewport.width,height:viewport.height,inspect:options.inspect})
      : viewport;
    // Warm the actual clip cross-fade, then sample the exact requested time.
    // Negative/early samples cannot retain the preceding action's pose.
    if(settle){renderer.draw({...options,...frame,time:0});
      for(let i=1;i<=8;i++)renderer.draw({...options,...frame,time:i*.05});}
    renderer.draw({...options,...frame});
    return renderer.inspectRig();
  }
  function cell(label, options, layout={}) {
    const side=layout.side||512;
    const rig=drawPose(options,true,layout);
    const copy=document.createElement('canvas');copy.width=canvas.width;copy.height=canvas.height;
    const width=copy.width,height=copy.height;
    const ctx=copy.getContext('2d');ctx.drawImage(canvas,0,0);
    const pixels=ctx.getImageData(0,0,width,height).data;
    let painted=0,left=width,right=0,top=height,bottom=0;
    for(let i=3;i<pixels.length;i+=4)if(pixels[i]>8){const n=(i-3)/4,x=n%width,y=Math.floor(n/width);painted++;left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
    const image=copy.toDataURL();
    const figure=document.createElement('figure');figure.style.cssText='margin:0;border:1px solid #d8dedb;border-radius:16px;overflow:hidden;background:#fdfdfb';
    const img=document.createElement('img');img.src=image;img.style.cssText='display:block;width:100%';
    const caption=document.createElement('figcaption');caption.textContent=label;caption.style.cssText='padding:8px 12px;font:13px Arial';
    figure.append(img,caption);sheet.append(figure);
    records.push({label,painted,canvasSize:side,canvasWidth:width,canvasHeight:height,bodySize:layout.body||300,bounds:{left,right,top,bottom},image,rig});
  }
  const forms=['property','investment','support'];
  for(const form of forms){
    if(kind==='turns')for(const [name,viewYaw]of[['front',0],['three-quarter',.24],['left',Math.PI/2],['back',Math.PI],['right',-Math.PI/2]])cell(`${form}: ${name}`,{form,time:1,viewYaw});
    if(kind==='poses')for(const {action}of poses)cell(`${form}: ${action}`,{form,action,time:1.2});
    if(kind==='tornado')for(const to of forms.filter(x=>x!==form))for(let i=0;i<16;i++)cell(`${form} to ${to}: ${i+1}/16`,{form,time:i*.21,transition:{from:form,to,progress:i/15}});
    if(kind==='construction')for(let i=0;i<16;i++)cell(`${form}: build ${i+1}/16`,{form,time:i*.62,ambient:{kind:'build',time:i*.62,variant:0}});
    if(kind==='closeups')for(const action of ['approve','inspect'])for(let i=0;i<8;i++)cell(`${form}: ${action} ${i+1}/8`,{form,action,time:.2+i*.4});
    if(kind==='hands')for(const direction of ['left','right','up','down'])cell(`${form}: glass ${direction}`,{form,time:1,inspect:{hand:direction==='right'?'left':'right',direction,radius:68}});
    if(kind==='native')for(const side of [112,144,160,192,208,224,256,288]){
      cell(`${form}: idle ${side}px`,{form,action:'idle',time:1},{side,body:side,native:true});
      for(const [action,duration]of [['wave',2.4],['explain',2.8],['dance',4.8],['approve',3.2],['inspect',3.6]])
        for(const fraction of [0,.25,.5,.75,1])cell(`${form}: ${action} ${side}px ${fraction}`,{form,action,time:duration*fraction},{side,body:side,native:true});
      cell(`${form}: held page glass ${side}px`,{form,time:1,inspect:{hand:'left',direction:'right',radius:42}},{side,body:side,native:true,inspectFit:true});
    }
  }
  const groups=kind==='tornado'?6:kind==='closeups'?6:3;
  const groupSize=records.length/groups;
  const distinct=Array.from({length:groups},(_,i)=>new Set(records.slice(i*groupSize,(i+1)*groupSize).map(row=>row.image)).size);
  if(kind==='poses')for(const form of forms)for(const {action,duration,articulated}of poses){
    const frames=[.12,.29,.47,.66,.83].map((fraction,index)=>({label:`${form}: ${action} @ ${(fraction*duration).toFixed(3)}`,
      rig:drawPose({form,action,time:fraction*duration},index===0)}));
    sequences.push({label:`${form}: ${action}`,minimum_distinct:3,articulated,frames});
  }
  if(kind!=='poses'&&kind!=='native')for(let i=0;i<groups;i++)sequences.push({label:`${kind}: group ${i+1}`,
    minimum_distinct:kind==='turns'||kind==='hands'?4:kind==='closeups'?6:12,
    articulated:kind==='construction'||kind==='closeups',
    frames:records.slice(i*groupSize,(i+1)*groupSize).map(({label,rig})=>({label,rig}))});
  renderer.dispose();
  return {kind,distinct,sequences,frames:records.map(({image,...row})=>row)};
}"""

try:
    REPORT['clip_catalogue'] = clip_catalogue()
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
        page = browser.new_page(viewport={'width': 1440, 'height': 1000})
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(BASE, wait_until='networkidle')
        for kind, expected, distinct in [('turns', 15, 5), ('poses', 39, 10), ('tornado', 96, 14), ('construction', 48, 14), ('closeups', 48, 7), ('hands', 12, 4), ('native', 648, 1)]:
            page.set_content(f'<html><body style="margin:0;background:#f9f9f4;color:#14366a"><h1 style="font:24px Arial;padding:24px">Buddy hologram: {kind}</h1></body></html>')
            result = page.evaluate(RENDER, {'kind': kind, 'poses': [
                {'action': action, 'duration': duration, 'articulated': action in ARTICULATED}
                for action, (_clip, duration) in POSES.items()
            ]})
            page.screenshot(path=str(OUT / f'buddy-3d-{kind}.png'), full_page=True)
            if kind == 'turns':
                for form_index, form in enumerate(['property', 'investment', 'support']):
                    source = page.locator('#sheet figure img').nth(form_index * 5 + 1).get_attribute('src')
                    (OUT / f'{form}-three-quarter.png').write_bytes(base64.b64decode(source.split(',', 1)[1]))
            if kind == 'closeups':
                # Keep native renderer pixels for a readable gesture review,
                # alongside the complete frame sheet and numerical evidence.
                for form_index, form in enumerate(['property', 'investment', 'support']):
                    for offset, gesture in [(3, 'thumb'), (12, 'magnifier')]:
                        source = page.locator('#sheet figure img').nth(form_index * 16 + offset).get_attribute('src')
                        (OUT / f'{form}-closeup-{gesture}.png').write_bytes(base64.b64decode(source.split(',', 1)[1]))
            REPORT['checks'].append(result)
            assert len(result['frames']) == expected, 'Missing authored views'
            assert all(n >= distinct for n in result['distinct']), f'{kind}: repeated poses or frames'
            for frame in result['frames']:
                validate_rig(frame)
                b = frame['bounds']
                assert frame['painted'] > 500, f'Blank 3D frame: {frame["label"]}'
                if kind == 'native' and ': idle ' in frame['label']:
                    assert (b['bottom'] - b['top']) / frame['bodySize'] >= .60, f'Undersized resting character: {frame["label"]}'
                assert b['right'] - b['left'] > 12, f'Collapsed profile: {frame["label"]}'
                right_edge, bottom_edge = frame['canvasWidth'] - 1, frame['canvasHeight'] - 1
                assert 0 < b['left'] < b['right'] < right_edge and 0 < b['top'] < b['bottom'] < bottom_edge, f'Clipped 3D character: {frame["label"]}'
            result['rig_checks'] = [validate_sequence(sequence) for sequence in result['sequences']]
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

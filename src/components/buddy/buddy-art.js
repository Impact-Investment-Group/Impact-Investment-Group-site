/** Resolution-independent artwork, redrawn from the supplied v2-refined lineup.
 * Layered vector extrusion, not a bitmap squeeze or a claimed 3D model.
 * All three forms share the same material, cuff and hand construction.
 */
const paths = new Map();
const contours = new Map();
const shapes = {
  key: 'M -34 -112 C -37 -173 38 -173 35 -112 C 35 -104 50 -105 60 -100 C 82 -94 87 -80 87 -60 L 87 -25 C 87 -1 71 12 31 12 L 31 52 L 62 52 Q 75 52 75 65 L 75 74 Q 75 84 63 84 L 44 84 L 44 95 L 62 95 Q 75 95 75 107 Q 75 120 62 120 L 31 120 L 31 131 C 31 170 -31 170 -31 131 L -31 12 C -72 12 -87 0 -87 -25 L -87 -60 C -87 -88 -68 -102 -47 -104 Q -34 -105 -34 -112 Z M -16 -130 C -16 -106 18 -106 18 -130 C 18 -153 -16 -153 -16 -130 Z',
  head: 'M -34 -112 C -37 -173 38 -173 35 -112 C 35 -104 50 -105 60 -100 C 82 -94 87 -80 87 -60 L 87 -25 C 87 -1 70 12 44 12 L -44 12 C -72 12 -87 0 -87 -25 L -87 -60 C -87 -88 -68 -102 -47 -104 Q -34 -105 -34 -112 Z M -16 -130 C -16 -106 18 -106 18 -130 C 18 -153 -16 -153 -16 -130 Z',
  screen: 'M -47 -87 Q -71 -87 -71 -62 L -71 -28 Q -71 -6 -47 -6 L 48 -6 Q 71 -6 71 -29 L 71 -62 Q 71 -87 48 -87 Z',
  stem: 'M -28 9 L 30 9 L 30 130 C 30 166 -28 166 -28 130 Z',
  cuff: 'M -36 9 Q 0 4 37 9 L 34 28 Q 0 32 -33 28 Z',
  teeth: 'M 30 52 L 62 52 Q 75 52 75 65 L 75 74 Q 75 84 63 84 L 44 84 L 44 95 L 62 95 Q 75 95 75 107 Q 75 120 62 120 L 30 120 Z',
  pound: 'M 94 -113 C 78 -153 23 -164 -19 -145 C -82 -119 -104 -54 -76 -5 L -90 -5 Q -109 -5 -109 17 Q -109 37 -87 37 L -59 37 C -63 61 -89 90 -102 117 C -113 140 -105 157 -82 151 C -17 134 39 162 91 143 C 118 134 117 104 105 87 C 96 74 85 79 67 87 C 45 98 16 92 -27 92 C -10 73 1 57 4 37 L 63 37 Q 83 37 83 16 Q 83 -5 62 -5 L 5 -5 C -10 -31 -11 -52 4 -66 C 21 -82 36 -78 58 -70 C 88 -59 111 -82 94 -113 Z',
  poundFace: 'M 81 -111 C 68 -140 24 -151 -14 -134 C -60 -115 -84 -74 -73 -39 C -59 -25 -38 -22 -21 -31 C -24 -51 -16 -69 -1 -80 C 20 -95 39 -90 59 -82 C 80 -75 92 -87 81 -111 Z',
  heart: 'M 0 -79 C -47 -137 -117 -107 -121 -52 C -128 8 -57 77 0 119 C 57 77 128 8 121 -52 C 117 -107 47 -137 0 -79 Z',
  heartFace: 'M 0 -57 C -47 -113 -103 -88 -103 -48 C -107 0 -51 58 0 97 C 51 58 107 0 103 -48 C 103 -88 47 -113 0 -57 Z',
};

function trace(ctx, source) {
  let commands = paths.get(source);
  if (!commands) {
    const tokens = source.match(/[A-Z]|-?\d+(?:\.\d+)?/g);
    const lengths = { M: 2, L: 2, Q: 4, C: 6, Z: 0 };
    commands = [];
    for (let i = 0; i < tokens.length;) {
      const kind = tokens[i++], values = tokens.slice(i, i + lengths[kind]).map(Number);
      commands.push([kind, values]); i += lengths[kind];
    }
    paths.set(source, commands);
  }
  ctx.beginPath();
  for (const [kind, values] of commands) {
    if (kind === 'M') ctx.moveTo(...values);
    else if (kind === 'L') ctx.lineTo(...values);
    else if (kind === 'Q') ctx.quadraticCurveTo(...values);
    else if (kind === 'C') ctx.bezierCurveTo(...values);
    else ctx.closePath();
  }
}

function gradient(ctx, stops, x = -90, y = -140, x2 = 85, y2 = 155) {
  const fill = ctx.createLinearGradient(x, y, x2, y2);
  stops.forEach(([at, color]) => fill.addColorStop(at, color));
  return fill;
}
const orange = [[0, '#FFC194'], [.15, '#F18B51'], [.43, '#E15E31'], [.76, '#C64A22'], [1, '#8B3019']];
const navy = [[0, '#547598'], [.2, '#2D5078'], [.55, '#14366A'], [.9, '#102644'], [1, '#203E61']];
const teal = [[0, '#73CCC1'], [.22, '#3BA59D'], [.65, '#258D8A'], [1, '#125B61']];

function plate(ctx, path, fill, edge, width = 1.2) {
  trace(ctx, path); ctx.fillStyle = fill; ctx.fill('evenodd');
  if (edge) { ctx.strokeStyle = edge; ctx.lineWidth = width; ctx.stroke(); }
}

/** Orthographic depth used by body, arms and tests; side-on stays 28px deep. */
export function projectBuddyPoint(x, y, z, yaw = 0) {
  return { x: x * Math.cos(yaw) + z * Math.sin(yaw), y: y - z * .12,
    depth: z * Math.cos(yaw) - x * Math.sin(yaw) };
}

function outlinePoints(source) {
  if (contours.has(source)) return contours.get(source);
  const result = []; let loop, previous;
  for (const [kind, v] of paths.get(source)) {
    if (kind === 'M') { loop = [[...v]]; result.push(loop); previous = v; }
    else if (kind === 'L') { loop.push(v); previous = v; }
    else if (kind === 'Q' || kind === 'C') {
      const end = v.slice(-2), start = previous;
      for (let i = 1; i <= 9; i++) {
        const t = i / 9, u = 1 - t;
        loop.push([0, 1].map(axis => kind === 'Q'
          ? u*u*start[axis] + 2*u*t*v[axis] + t*t*end[axis]
          : u*u*u*start[axis] + 3*u*u*t*v[axis] + 3*u*t*t*v[axis+2] + t*t*t*end[axis]));
      }
      previous = end;
    }
  }
  contours.set(source, result); return result;
}

function shell(ctx, source, yaw) {
  // Connected bevel quads have a real width at an exact profile view.
  // Cached curve samples are geometry, never a rasterized front photograph.
  trace(ctx, source);
  const faces = [], rings = [[-14, .965], [-10, 1], [9, 1], [14, .975]];
  for (const loop of outlinePoints(source)) for (let i = 0; i < loop.length; i++) {
    const a = loop[i], b = loop[(i + 1) % loop.length];
    for (let j = 1; j < rings.length; j++) {
      const [z0, r0] = rings[j-1], [z1, r1] = rings[j];
      const points = [[a[0]*r0,a[1]*r0,z0],[b[0]*r0,b[1]*r0,z0],
        [b[0]*r1,b[1]*r1,z1],[a[0]*r1,a[1]*r1,z1]];
      const u=points[1].map((v,k)=>v-points[0][k]), v=points[3].map((v,k)=>v-points[0][k]);
      const normal=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
      const length=Math.hypot(...normal)||1, nx=normal[0]/length, ny=normal[1]/length, nz=normal[2]/length;
      const toward=nz*Math.cos(yaw)-nx*Math.sin(yaw);
      if(toward < -.04) continue;
      const projected=points.map(p=>projectBuddyPoint(...p,yaw));
      const lighting=.74+.42*Math.max(0,-nx*.45-ny*.6+nz*.55)+.12*Math.max(0,toward);
      const color=j===3?[225,94,49]:[32,65,103];
      faces.push({points:projected,depth:projected.reduce((sum,p)=>sum+p.depth,0)/4,
        color:`rgb(${color.map(c=>Math.min(255,Math.round(c*lighting))).join(',')})`});
    }
  }
  faces.sort((a,b)=>a.depth-b.depth);
  for(const face of faces){
    ctx.beginPath();face.points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();
    ctx.fillStyle=face.color;ctx.fill();ctx.strokeStyle=face.color;ctx.lineWidth=.55;ctx.stroke();
  }
}

export function drawBuddyBody(ctx, form, yaw = 0) {
  const cosine = Math.cos(yaw), sine = Math.sin(yaw);
  const outline = shapes[['key', 'pound', 'heart'][form]];
  const front = cosine >= 0;
  // Signed projection means the rear of the pound has its correct reversed shape.
  const end = front ? 14 : -14;
  shell(ctx, outline, yaw);
  ctx.save(); ctx.translate(end * sine, -end * .12); ctx.scale(cosine, 1);
  if (front) {
    if (form === 0) {
      plate(ctx, shapes.stem, gradient(ctx, navy), '#173456');
      plate(ctx, shapes.head, gradient(ctx, orange), '#AF421E', 1.7);
      plate(ctx, shapes.screen, '#164B56', '#AD3E1C', 2);
      ctx.save(); ctx.translate(0, 1); ctx.scale(.973, .965);
      plate(ctx, shapes.screen, gradient(ctx, teal), '#1B716F'); ctx.restore();
      plate(ctx, shapes.cuff, gradient(ctx, teal), '#176864');
      plate(ctx, shapes.teeth, gradient(ctx, orange), '#A43C1B');
    } else {
      plate(ctx, outline, gradient(ctx, orange), '#A63D1D', 1.5);
      if (form === 1) {
        ctx.save(); ctx.scale(.91, .91); plate(ctx, outline, gradient(ctx, navy)); ctx.restore();
        plate(ctx, shapes.poundFace, gradient(ctx, teal), '#255A63', 1.3);
      } else plate(ctx, shapes.heartFace, gradient(ctx, teal), '#A24425', 2);
    }
    // Soft reflected rim. This follows the silhouette, including the key's hole.
    ctx.save(); ctx.translate(-.8, -1.3); ctx.scale(.98, .985);
    trace(ctx, form === 0 ? shapes.head : outline);
    ctx.strokeStyle = gradient(ctx, [[0, '#FFE0BA'], [.37, 'rgba(255,215,180,.5)'], [.7, 'rgba(255,215,180,0)'], [1, 'rgba(255,215,180,0)']]);
    ctx.lineWidth = 2.2; ctx.stroke(); ctx.restore();
  } else {
    plate(ctx, outline, gradient(ctx, navy), '#173456', 1.5);
    ctx.save(); ctx.scale(.91, .92); trace(ctx, outline);
    ctx.strokeStyle = 'rgba(141,176,200,.22)'; ctx.lineWidth = 1.4; ctx.stroke(); ctx.restore();
  }
  ctx.restore();
}

/** A continuous glove: fingers share a palm, palm shares the forearm cuff. */
export function drawBuddyHand(ctx, x, y, angle, kind = 0, mirror = false) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle); if (mirror) ctx.scale(-1, 1);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const curled = kind === 1 || kind === 5;
  const lengths = kind === 2 ? [25, 9, 8, 7] : kind === 3 ? [8, 9, 8, 7]
    : curled ? [9, 11, 10, 8] : kind === 4 ? [18, 21, 19, 14] : [23, 28, 25, 18];
  for (let i = 3; i >= 0; i--) {
    const px = -8 + i * 5.7, py = -20 + Math.abs(i - 1.4) * 1.2;
    const tipX = px + (i - 1.4) * (curled ? 1 : 2.3), tipY = py - lengths[i];
    ctx.beginPath(); ctx.moveTo(px, py); ctx.quadraticCurveTo(tipX, py - lengths[i] * .6, tipX, tipY);
    ctx.strokeStyle = '#176965'; ctx.lineWidth = 8; ctx.stroke();
    ctx.strokeStyle = gradient(ctx, teal, -14, -46, 14, -2); ctx.lineWidth = 6.5; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(px - 1, py - 3); ctx.quadraticCurveTo(tipX - 1, py - lengths[i] * .6, tipX - .7, tipY + 1);
    ctx.strokeStyle = 'rgba(173,235,219,.45)'; ctx.lineWidth = 1.3; ctx.stroke();
  }
  ctx.beginPath(); ctx.moveTo(-10, -23); ctx.bezierCurveTo(-13, -12, -10, -4, -5, -2);
  ctx.bezierCurveTo(-2, 2, 7, 1, 10, -5); ctx.bezierCurveTo(15, -12, 16, -21, 10, -26);
  ctx.bezierCurveTo(4, -30, -5, -30, -10, -23); ctx.closePath();
  ctx.fillStyle = gradient(ctx, teal, -12, -28, 15, 0); ctx.fill(); ctx.strokeStyle = '#1C7973'; ctx.lineWidth = .9; ctx.stroke();
  // Opposing thumb, never a detached sprite or a reversed wrist.
  ctx.beginPath(); ctx.moveTo(-7, -11);
  if (kind === 3) ctx.bezierCurveTo(-20, -16, -15, -28, -16, -35);
  else ctx.bezierCurveTo(-15, -11, -17, -19, -20, -22);
  ctx.strokeStyle = '#1C7973'; ctx.lineWidth = 9; ctx.stroke();
  ctx.strokeStyle = gradient(ctx, teal, -22, -30, -3, -3); ctx.lineWidth = 7.2; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-7, -4); ctx.quadraticCurveTo(0, -6, 8, -4);
  ctx.lineTo(7, 4); ctx.quadraticCurveTo(0, 6, -6, 3); ctx.closePath();
  ctx.fillStyle = gradient(ctx, teal, -8, -5, 8, 5); ctx.fill();
  ctx.strokeStyle = '#1B6C68'; ctx.lineWidth = 1; ctx.stroke();
  ctx.restore();
}

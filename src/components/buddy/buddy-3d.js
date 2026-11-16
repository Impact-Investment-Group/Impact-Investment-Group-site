import {
  Renderer,
  Camera,
  Transform,
  Vec3,
  Mat4,
  GLTFLoader,
  GLTFAnimation,
} from "ogl";
import { hologramMaterial } from "./buddy-3d-material.js";
import { sampleBuddyBuild } from "./buddy-3d-build.js";

export const BUDDY_FORM_CHANGE_MS = 3200;
export const BUDDY_MODEL_URL = "/images/buddy/3d/buddy.glb";
const models = new Map();
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const smooth = (n) => {
  const t = clamp(n, 0, 1);
  return t * t * (3 - 2 * t);
};
const forms = ["property", "investment", "support"];
const clips = {
  idle: "Idle",
  wave: "Wave",
  listen: "Listen",
  think: "Think",
  talk: "Talk",
  explain: "Explain",
  reassure: "Reassure",
  approve: "Closeup_Thumb_R",
  celebrate: "Celebrate",
  dance: "Dance",
  glide: "Glide",
  inspect: "Closeup_Inspect_R",
  build: "Build",
  peek: "Peek",
  stretch: "Stretch",
  polish: "Polish",
};
// Eye height, brow lift, inward brow angle, mouth height, smile width, asymmetry.
const faces = {
  neutral: [1, 0, 0, 1, 1, 0],
  warm: [1, 0.015, 0, 1, 1.08, 0],
  curious: [1.07, 0.04, 0, 1, 0.92, 0.045],
  focused: [0.86, -0.025, -0.12, 0.8, 0.94, 0],
  thoughtful: [0.94, 0.025, 0.05, 0.7, 0.92, 0.025],
  delighted: [0.93, 0.055, 0, 1.55, 1.14, 0],
  reassuring: [0.96, 0.025, 0.04, 0.9, 1.08, 0],
  concerned: [0.92, 0.018, 0.16, 0.8, 0.85, 0],
  surprised: [1.2, 0.08, 0, 1.85, 0.7, 0],
  unsure: [0.96, 0.02, 0.1, 0.8, 0.9, 0.04],
  resting: [0.7, -0.01, 0, 0.7, 1, 0],
  confident: [0.94, 0, -0.06, 1, 1.06, 0],
};

/** OGL's Quat is array-like and intentionally has no clone() method. */
export function captureBuddyPose(node) {
  return {
    position: node.position.clone(),
    quaternion: Array.from(node.quaternion),
    scale: node.scale.clone(),
  };
}

export function blendBuddyPose(node, previous, amount) {
  const weight = 1 - clamp(amount, 0, 1);
  node.position.lerp(previous.position, weight);
  node.quaternion.slerp(previous.quaternion, weight);
  node.scale.lerp(previous.scale, weight);
}

/** Foreground accents leave the authored wrist/forearm joint untouched. */
export function applyBuddyForeground(nodes, form, name, amount) {
  const close = clamp(amount, 0, 1),
    hand = nodes.get("Hand.R");
  if (name === "Closeup_Thumb_R" && hand) hand.scale.multiply(1 + 0.3 * close);
  if (name !== "Closeup_Inspect_R") return;
  const factor = 1 + 0.25 * close;
  // Blender's prop -Y axis becomes local +Z in this exported glTF. The handle
  // telescopes from its fixed grip; moving the lens never moves the hand root.
  // The authored close-up centres the lens on the key's eye at Y=.555.
  // Other forms telescope to their eye height; aperture growth is about its
  // centre so it cannot pull the handle out of the corrected palm grip.
  const eyeY = { property: 0.555, investment: 1.0475, support: 0.125 }[form];
  const extension = (eyeY - 0.555) * close;
  for (const part of ["GlassRing.R", "GlassLens.R", "LensCentre.R"]) {
    const node = nodes.get(part);
    if (node) node.position.z += extension;
  }
  sizeBuddyLens(nodes, "R", factor);
}

/** Calibrate the aperture about its centre, never by lengthening the grip. */
export function sizeBuddyLens(nodes, suffix, factor) {
  const scale = Math.max(0.05, factor);
  for (const part of ["GlassRing.", "GlassLens."]) {
    const node = nodes.get(part + suffix);
    if (node) node.scale.set(scale);
  }
  const centre = nodes.get("LensCentre." + suffix),
    handle = nodes.get("GlassHandle." + suffix);
  if (centre && handle) {
    const length = Math.max(0.04, centre.position.z - 0.4 * scale);
    handle.position.z = length / 2;
    handle.scale.y = length / 0.63;
  }
}

export function followBuddyEyeCatchlight(
  eye,
  glint,
  eyeRest,
  glintRest,
  factor,
) {
  glint.position.set(
    eye.position.x + (glintRest.x - eyeRest.x) * factor,
    eye.position.y + (glintRest.y - eyeRest.y) * factor,
    eye.position.z + (glintRest.z - eyeRest.z) * factor,
  );
  glint.scale.multiply(factor);
}

/** GPU bitmap sizing must never replace the caller's CSS layout contract. */
export function preserveBuddyCanvasLayout(canvas, operation) {
  const width = canvas.style.width,
    height = canvas.style.height;
  try {
    return operation();
  } finally {
    canvas.style.width = width;
    canvas.style.height = height;
  }
}

function broadenRibbon(geometry) {
  const attribute = geometry.attributes.position,
    positions = attribute.data;
  for (let i = 0; i < positions.length; i += 3) {
    const t = clamp((positions[i + 1] + 1.7) / 3.4, 0, 1);
    const centre = 0.4 + 1.05 * Math.sin(Math.PI * t) ** 0.65;
    const edge = Math.hypot(positions[i], positions[i + 2]) - centre;
    positions[i + 1] += clamp(edge, -0.08, 0.08) * 2.6;
  }
  attribute.needsUpdate = true;
}

export function loadBuddyModel(url = BUDDY_MODEL_URL) {
  if (!models.has(url)) {
    const abort = new AbortController(),
      timer = setTimeout(() => abort.abort(), 15000);
    const loading = fetch(url, { credentials: "omit", cache: "no-cache", signal: abort.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Buddy model unavailable");
        return response.arrayBuffer();
      })
      .then((binary) => {
        const json = GLTFLoader.unpackGLB(binary);
        if (json.asset?.version !== "2.0" || !json.skins?.length)
          throw new Error("Buddy rig unavailable");
        return { binary, url };
      })
      .catch((error) => {
        models.delete(url);
        throw error;
      })
      .finally(() => clearTimeout(timer));
    models.set(url, loading);
  }
  return models.get(url);
}

function clonePoseGraph(gltf) {
  const map = new Map();
  gltf.nodes.forEach((node) => {
    const copy = new Transform();
    copy.name = node.name;
    copy.position.copy(node.position);
    copy.quaternion.copy(node.quaternion);
    copy.scale.copy(node.scale);
    map.set(node, copy);
  });
  gltf.nodes.forEach((node) => {
    if (map.has(node.parent)) map.get(node).setParent(map.get(node.parent));
  });
  const root = new Transform();
  gltf.scene.forEach((node) => map.get(node).setParent(root));
  return {
    root,
    nodes: new Map([...map.values()].map((node) => [node.name, node])),
    clips: new Map(
      gltf.animations.map(({ name, animation }) => [
        name,
        new GLTFAnimation(
          animation.data.map((channel) => ({
            ...channel,
            node: map.get(channel.node),
          })),
        ),
      ]),
    ),
  };
}

/** One explicit drawing owner. No RAF is created inside the renderer. */
export async function createBuddyRenderer(canvas, library) {
  const renderer = preserveBuddyCanvasLayout(
    canvas,
    () =>
      new Renderer({
        canvas,
        alpha: true,
        antialias: true,
        dpr: 1,
        powerPreference: "low-power",
        preserveDrawingBuffer: true,
      }),
  );
  const gl = renderer.gl;
  try {
    let gltf;
    try {
      gltf = await GLTFLoader.parse(
        gl,
        GLTFLoader.unpackGLB(library.binary.slice(0)),
        library.url.slice(0, library.url.lastIndexOf("/") + 1),
      );
    } catch (error) {
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      throw error;
    }
    const scene = new Transform();
    gltf.scene.forEach((node) => node.setParent(scene));
    const nodes = new Map(gltf.nodes.map((node) => [node.name, node]));
    const animations = new Map(
      (gltf.animations || []).map(({ name, animation }) => [name, animation]),
    );
    const probe = clonePoseGraph(gltf);
    const camera = new Camera(gl, { fov: 32, near: 0.1, far: 50 });
    camera.position.z = 8;
    camera.lookAt([0, 0, 0]);
    const meshEffects = new Map();
    let frameOpacity = 1;
    const materials = [],
      programCache = new Map(),
      geometries = new Set(),
      textures = new Set();
    scene.traverse((node) => {
      if (!node.geometry) return;
      const previous = node.program;
      const vertexColors = Boolean(node.geometry.attributes.color);
      const key =
        (previous.gltfMaterial?.name || "default") +
        ":" +
        Boolean(node.skeleton) + ":" + vertexColors;
      if (!programCache.has(key)) {
        const program = hologramMaterial(
          gl,
          previous.gltfMaterial,
          Boolean(node.skeleton),
          vertexColors,
        );
        programCache.set(key, program);
        materials.push(program);
      }
      node.program = programCache.get(key);
      if (node.name?.startsWith("VortexRibbon_")) broadenRibbon(node.geometry);
      node.onBeforeRender(() => {
        const effect = meshEffects.get(node);
        node.program.uniforms.opacity.value =
          frameOpacity * (effect?.opacity ?? 1);
        node.program.uniforms.glow.value = effect?.glow ?? 0;
      });
      geometries.add(node.geometry);
      if (node.boneTexture) textures.add(node.boneTexture);
      if (previous?.program) gl.deleteProgram(previous.program);
      node.frustumCulled = false;
    });
    let width = 400,
      height = 400,
      disposed = false,
      lastName = "",
      blendTime = 1,
      lastTime = 0,
      materialSeconds = 0;
    const rest = new Map(
      gltf.nodes.map((node) => [
        node,
        {
          ...captureBuddyPose(node),
        },
      ]),
    );
    let captured = null,
      closeState = 0;
    let faceState = null;
    const point = new Vec3();
    const bodyBounds = new Map();
    scene.updateMatrixWorld();
    for (const form of forms) {
      const min = [Infinity, Infinity, Infinity],
        max = [-Infinity, -Infinity, -Infinity];
      const formNode = nodes.get("Form_" + form);
      const inverseForm = new Mat4().inverse(formNode.worldMatrix);
      // Cache in the form's local frame, then project through its posed graph.
      // World-space rest bounds would omit the turn and the root bone's lean.
      formNode.traverse((node) => {
        const positions = node.geometry?.attributes.position?.data;
        if (!positions) return;
        for (let i = 0; i < positions.length; i += 3) {
          point
            .set(positions[i], positions[i + 1], positions[i + 2])
            .applyMatrix4(node.worldMatrix)
            .applyMatrix4(inverseForm);
          for (let axis = 0; axis < 3; axis++) {
            min[axis] = Math.min(min[axis], point[axis]);
            max[axis] = Math.max(max[axis], point[axis]);
          }
        }
      });
      bodyBounds.set(form, { min, max });
    }
    const probeRest = new Map(
      [...probe.nodes.values()].map((node) => [
        node,
        {
          ...captureBuddyPose(node),
        },
      ]),
    );
    function restore(graph, rests) {
      for (const [node, state] of rests) {
        node.position.copy(state.position);
        node.quaternion.copy(state.quaternion);
        node.scale.copy(state.scale);
      }
    }
    function effectFor(node, opacity = 1, glow = 0) {
      const effect = { opacity, glow };
      node?.traverse((part) => {
        if (part.geometry) meshEffects.set(part, effect);
      });
    }
    function applyClip(graph, name, time) {
      const clip = graph.get(name) || graph.get("Idle");
      if (clip) {
        clip.elapsed = Math.max(0, time);
        clip.update(1, true);
      }
    }
    function inspectName(inspect) {
      return (
        "Inspect" +
        (inspect?.direction || "right").replace(/^./, (c) => c.toUpperCase())
      );
    }
    function configure(nodesMap, form, inspect) {
      forms.forEach((name) => {
        const node = nodesMap.get("Form_" + name);
        if (node) node.visible = name === form;
      });
      for (const suffix of ["L", "R"]) {
        const glass = nodesMap.get("Magnifier." + suffix),
          hammer = nodesMap.get("Hammer." + suffix);
        if (glass) {
          glass.visible =
            Boolean(inspect) &&
            (inspect.hand === "left" ? "L" : "R") === suffix;
          glass.scale.set(1);
        }
        if (hammer) hammer.visible = false;
      }
      const house = nodesMap.get("House");
      if (house) house.visible = false;
      const dust = nodesMap.get("BuildDust");
      if (dust) dust.visible = false;
      const vortex = nodesMap.get("Vortex");
      if (vortex) vortex.visible = false;
    }
    function project(node, out = point) {
      if (!node) return { x: 0, y: 0 };
      out.set(node.worldMatrix[12], node.worldMatrix[13], node.worldMatrix[14]);
      out.applyMatrix4(camera.viewMatrix);
      out.applyMatrix4(camera.projectionMatrix);
      return {
        x: (out.x * 0.5 + 0.5) * width,
        y: (0.5 - out.y * 0.5) * height,
      };
    }
    function fitLens(nodesMap, inspect) {
      if (!inspect) return 0;
      const suffix = inspect.hand === "left" ? "L" : "R",
        glass = nodesMap.get("Magnifier." + suffix),
        centre = nodesMap.get("LensCentre." + suffix);
      if (!glass || !centre) return 0;
      const p = project(centre);
      point
        .set(0.375, 0, 0)
        .applyMatrix4(centre.worldMatrix)
        .applyMatrix4(camera.viewMatrix)
        .applyMatrix4(camera.projectionMatrix);
      const actual = Math.hypot(
        (point.x * 0.5 + 0.5) * width - p.x,
        (0.5 - point.y * 0.5) * height - p.y,
      );
      if (actual > 0.001) {
        sizeBuddyLens(nodesMap, suffix, inspect.radius / actual);
      }
      return inspect.radius;
    }
    function place(root, size, x, y, closeup = 0) {
      const viewHeight = 2 * 8 * Math.tan((16 * Math.PI) / 180);
      const scale = ((size / height) * viewHeight) / 4.4;
      root.scale.set(scale);
      root.position.set(
        (((x - width / 2) * viewHeight) / height) * (1 - (closeup * 1.25) / 8),
        (((height / 2 - y) * viewHeight) / height) * (1 - (closeup * 1.25) / 8),
        closeup * 1.25,
      );
    }
    function resetProbe() {
      restore(probe, probeRest);
    }
    function resize(w, h, dpr = 1) {
      width = Math.max(1, w);
      height = Math.max(1, h);
      renderer.dpr = clamp(dpr, 1, 2);
      preserveBuddyCanvasLayout(canvas, () => renderer.setSize(width, height));
      camera.perspective({ aspect: width / height });
    }
    resize(400, 400, 1);
    return {
      canvas,
      resize,
      metrics({ form = "property", size = 192, inspect } = {}) {
        resetProbe();
        applyClip(
          probe.clips,
          inspect ? inspectName(inspect) : "Idle",
          inspect ? 1 : 0,
        );
        configure(probe.nodes, form, inspect);
        const posedRoot = probe.nodes.get("BuddyRoot");
        if (posedRoot) posedRoot.rotation.y = inspect ? 0 : 0.24;
        place(probe.root, size, width / 2, height / 2);
        probe.root.updateMatrixWorld();
        camera.updateMatrixWorld();
        const aperture = fitLens(probe.nodes, inspect);
        probe.root.updateMatrixWorld();
        const suffix = inspect?.hand === "left" ? "L" : "R";
        const hand = project(probe.nodes.get("Grip." + suffix));
        const lens = project(probe.nodes.get("LensCentre." + suffix));
        const bounds = bodyBounds.get(form);
        let left = Infinity,
          right = -Infinity,
          top = Infinity,
          bottom = -Infinity;
        for (let index = 0; index < 8; index++) {
          point.set(
            bounds[index & 1 ? "max" : "min"][0],
            bounds[index & 2 ? "max" : "min"][1],
            bounds[index & 4 ? "max" : "min"][2],
          );
          point
            .applyMatrix4(probe.nodes.get("Form_" + form).worldMatrix)
            .applyMatrix4(camera.viewMatrix)
            .applyMatrix4(camera.projectionMatrix);
          const px = (point.x * 0.5 + 0.5) * width,
            py = (0.5 - point.y * 0.5) * height;
          left = Math.min(left, px);
          right = Math.max(right, px);
          top = Math.min(top, py);
          bottom = Math.max(bottom, py);
        }
        return {
          body: { width: right - left, height: bottom - top },
          hand: { x: hand.x - width / 2, y: hand.y - height / 2 },
          lens: {
            x: lens.x - width / 2,
            y: lens.y - height / 2,
            radius: aperture || size * 0.1,
          },
        };
      },
      draw({
        form = "property",
        action = "idle",
        expression = "warm",
        time = 0,
        size = 192,
        x = width / 2,
        y = height / 2,
        inspect,
        transition,
        attention,
        ambient,
        viewYaw = inspect ? 0 : 0.24,
      } = {}) {
        if (disposed) return;
        meshEffects.clear();
        const kind = ambient?.kind;
        const build =
          kind === "build" ? sampleBuddyBuild(ambient.time || 0) : null;
        const name = inspect
          ? inspectName(inspect)
          : build?.finished
            ? "Approve"
            : clips[kind || action] || "Idle";
        if (name !== lastName) {
          captured = new Map(
            gltf.nodes.map((node) => [
              node,
              {
                ...captureBuddyPose(node),
              },
            ]),
          );
          blendTime = 0;
          lastName = name;
        }
        const delta = Math.min(0.35, Math.max(0, time - lastTime));
        lastTime = time;
        materialSeconds += delta;
        blendTime = Math.min(1, blendTime + delta / 0.35);
        restore(scene, rest);
        applyClip(
          animations,
          name,
          inspect
            ? 1
            : build?.finished
              ? ambient.time - 5.4
              : (ambient?.time ?? time),
        );
        if (captured && blendTime < 1) {
          const a = smooth(blendTime);
          for (const [node, previous] of captured) {
            blendBuddyPose(node, previous, a);
          }
        }
        configure(nodes, form, inspect);
        if (name === "Closeup_Inspect_R") {
          const glass = nodes.get("Magnifier.R");
          if (glass) glass.visible = true;
        }
        const close = name.startsWith("Closeup")
          ? Math.sin(
              Math.PI *
                clamp(time / (name === "Closeup_Thumb_R" ? 3.2 : 3.6), 0, 1),
            ) ** 2
          : 0;
        closeState += (close - closeState) * (1 - Math.exp(-delta * 12));
        place(scene, size, x, y, closeState);
        const root = nodes.get("BuddyRoot");
        if (root) {
          root.rotation.y = viewYaw + (attention?.x || 0) * 0.1;
          root.rotation.x = (attention?.y || 0) * 0.035;
        }
        if (close) applyBuddyForeground(nodes, form, name, close);
        let opacity = 1;
        if (transition && root) {
          const p = clamp(transition.progress, 0, 1);
          const turn = smooth(p) * Math.PI * 8;
          root.rotation.y += turn;
          form = p < 0.5 ? transition.from : transition.to;
          configure(nodes, form, undefined);
          opacity =
            0.7 +
            0.3 *
              (p < 0.5
                ? 1 - smooth((p - 0.22) / 0.25)
                : smooth((p - 0.53) / 0.3));
          root.position.y += Math.sin(p * Math.PI) * 0.18;
          const vortex = nodes.get("Vortex");
          if (vortex) {
            vortex.visible = p > 0.03 && p < 0.98;
            vortex.rotation.y = -turn * 0.7;
            effectFor(vortex, 1, 0.12);
          }
        }
        if (build) {
          const house = nodes.get("House"),
            hammer = nodes.get("Hammer.R");
          if (house) house.visible = build.visible;
          effectFor(house, build.opacity);
          if (hammer) hammer.visible = build.hammerVisible;
          for (const brick of build.bricks) {
            const node = nodes.get(brick.name);
            if (!node) continue;
            node.visible = brick.visible;
            node.position.x += brick.x;
            node.position.y += brick.y;
            node.position.z += brick.z;
            node.rotation.z += brick.tilt;
            node.scale.x *= brick.scaleX;
            node.scale.y *= brick.scaleY;
            effectFor(node, brick.opacity);
          }
          const roof = nodes.get("HouseRoof");
          if (roof) {
            roof.visible = build.roof.visible;
            roof.position.y += build.roof.y;
            roof.rotation.z += build.roof.tilt;
          }
          const door = nodes.get("HouseDoor");
          if (door) {
            door.visible = build.door.visible;
            door.position.x += build.door.x;
            door.position.z += build.door.z;
            door.rotation.y -= build.door.angle;
            effectFor(door, build.opacity, build.door.glow);
          }
          const window = nodes.get("HouseWindow");
          if (window) {
            window.visible = build.window.visible;
            effectFor(window, build.opacity, build.window.glow);
          }
          const dust = nodes.get("BuildDust");
          if (dust) dust.visible = true;
          for (const puff of build.dust) {
            const node = nodes.get(puff.name);
            if (!node) continue;
            node.visible = puff.visible;
            node.position.x += puff.x;
            node.position.y += puff.y;
            node.position.z += puff.z;
            node.scale.set(puff.scale);
            effectFor(node, puff.opacity, 0.18);
          }
        }
        // Variant changes are bounded accents on the authored take, not mirrored
        // hands or a substitute for its actual joint animation.
        if (kind && root) {
          const envelope = Math.sin(
            Math.PI *
              clamp(
                (ambient.time || 0) /
                  ({
                    build: 9.4,
                    dance: 4.8,
                    peek: 4.6,
                    stretch: 4.2,
                    polish: 6.6,
                  }[kind] || 5),
                0,
                1,
              ),
          );
          root.rotation.y += ((ambient.variant || 0) - 1) * 0.07 * envelope;
        }
        const automatic = build?.finished
          ? "delighted"
          : {
              listen: "curious",
              think: "thoughtful",
              talk: "warm",
              explain: "confident",
              reassure: "reassuring",
              approve: "delighted",
              celebrate: "delighted",
              inspect: "focused",
            }[action] || "warm";
        const targetFace =
          faces[expression === "automatic" ? automatic : expression] ||
          faces.warm;
        if (!faceState) faceState = [...targetFace];
        else {
          const a = 1 - Math.exp(-delta * 10);
          for (let i = 0; i < faceState.length; i++)
            faceState[i] += (targetFace[i] - faceState[i]) * a;
        }
        const blink = Math.pow(Math.max(0, Math.cos(time * 0.68 + 1.6)), 40);
        for (const current of forms) {
          for (const [suffix, sign] of [
            ["L", 1],
            ["R", -1],
          ]) {
            const eye = nodes.get("Eye_" + current + "_" + suffix);
            if (eye) {
              eye.scale.y *= Math.max(
                0.08,
                (faceState[0] + sign * faceState[5]) * (1 - blink * 0.9),
              );
              if (name === "Closeup_Inspect_R" && suffix === "R") {
                // The domed eye advances as it grows, keeping its back
                // inside the face panel and its front behind the glass.
                eye.position.z += close * 0.045;
                const k = 1 + close * 0.95;
                eye.scale.set(
                  eye.scale.x * k,
                  eye.scale.y * k,
                  eye.scale.z * k,
                );
              }
            }
            const brow = nodes.get("Brow_" + current + sign);
            if (brow) {
              brow.position.y += faceState[1] + sign * faceState[5];
              brow.rotation.z += sign * faceState[2];
            }
            const glint = nodes.get("Catchlight_" + current + sign);
            if (glint) {
              glint.visible = blink < 0.92;
              if (eye && name === "Closeup_Inspect_R" && suffix === "R") {
                followBuddyEyeCatchlight(
                  eye,
                  glint,
                  rest.get(eye).position,
                  rest.get(glint).position,
                  1 + close * 0.95,
                );
              }
            }
          }
          const mouth = nodes.get("Mouth_" + current);
          if (mouth)
            mouth.scale.y *=
              faceState[3] *
              (action === "talk" ? 1 + Math.abs(Math.sin(time * 8)) * 1.1 : 1);
          const smile = nodes.get("Smile_" + current);
          if (smile) smile.scale.x *= faceState[4];
        }
        materials.forEach((program) => {
          program.uniforms.time.value = materialSeconds;
          program.uniforms.opacity.value = opacity;
          // Keep reconstruction lines at least four CSS pixels apart even
          // in the small chat portrait, avoiding subpixel moire as he moves.
          program.uniforms.rasterFrequency.value = Math.min(
            170, (Math.PI * height) / (4 * 8 * Math.tan((16 * Math.PI) / 180)),
          );
        });
        frameOpacity = opacity;
        scene.updateMatrixWorld();
        camera.updateMatrixWorld();
        fitLens(nodes, inspect);
        scene.updateMatrixWorld();
        renderer.render({ scene, camera, sort: true });
      },
      inspectRig() {
        return ["Hand.L", "Hand.R", "Grip.L", "Grip.R"].map((name) => {
          const node = nodes.get(name),
            m = node.worldMatrix;
          return {
            name,
            scale: [...node.scale],
            quaternion: [...node.quaternion],
            local: [...node.matrix],
            world: [...m],
            determinant:
              m[0] * (m[5] * m[10] - m[6] * m[9]) -
              m[4] * (m[1] * m[10] - m[2] * m[9]) +
              m[8] * (m[1] * m[6] - m[2] * m[5]),
          };
        });
      },
      dispose({ loseContext = true } = {}) {
        if (disposed) return;
        disposed = true;
        for (const geometry of geometries) geometry.remove();
        for (const texture of textures) gl.deleteTexture(texture.texture);
        for (const program of materials) program.remove();
        if (loseContext) gl.getExtension("WEBGL_lose_context")?.loseContext();
      },
    };
  } catch (error) {
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    throw error;
  }
}

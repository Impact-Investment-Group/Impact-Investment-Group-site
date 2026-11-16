import {
  Renderer,
  Camera,
  Transform,
  Vec3,
  GLTFLoader,
  GLTFAnimation,
} from "ogl";
import { hologramMaterial } from "./buddy-3d-material.js";

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

export function loadBuddyModel(url = BUDDY_MODEL_URL) {
  if (!models.has(url)) {
    const abort = new AbortController(),
      timer = setTimeout(() => abort.abort(), 15000);
    const loading = fetch(url, { credentials: "omit", signal: abort.signal })
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
  const renderer = new Renderer({
    canvas,
    alpha: true,
    antialias: true,
    dpr: 1,
    powerPreference: "low-power",
    preserveDrawingBuffer: true,
  });
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
    const materials = [],
      programCache = new Map(),
      geometries = new Set(),
      textures = new Set();
    scene.traverse((node) => {
      if (!node.geometry) return;
      const previous = node.program;
      const key =
        (previous.gltfMaterial?.name || "default") +
        ":" +
        Boolean(node.skeleton);
      if (!programCache.has(key)) {
        const program = hologramMaterial(
          gl,
          previous.gltfMaterial,
          Boolean(node.skeleton),
        );
        programCache.set(key, program);
        materials.push(program);
      }
      node.program = programCache.get(key);
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
      lastTime = 0;
    const rest = new Map(
      gltf.nodes.map((node) => [
        node,
        {
          position: node.position.clone(),
          quaternion: node.quaternion.clone(),
          scale: node.scale.clone(),
        },
      ]),
    );
    let captured = null;
    let faceState = null;
    const point = new Vec3();
    const bodyBounds = new Map();
    scene.updateMatrixWorld();
    for (const form of forms) {
      const min = [Infinity, Infinity, Infinity],
        max = [-Infinity, -Infinity, -Infinity];
      nodes.get("Form_" + form)?.traverse((node) => {
        const positions = node.geometry?.attributes.position?.data;
        if (!positions) return;
        for (let i = 0; i < positions.length; i += 3) {
          point
            .set(positions[i], positions[i + 1], positions[i + 2])
            .applyMatrix4(node.worldMatrix);
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
          position: node.position.clone(),
          quaternion: node.quaternion.clone(),
          scale: node.scale.clone(),
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
    function configure(nodesMap, form, inspect, size) {
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
          glass.scale.set(
            inspect ? clamp(inspect.radius / ((size / 4) * 0.4), 0.5, 3) : 1,
          );
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
        .set(0.375, -1.02, 0)
        .applyMatrix4(glass.worldMatrix)
        .applyMatrix4(camera.viewMatrix)
        .applyMatrix4(camera.projectionMatrix);
      const actual = Math.hypot(
        (point.x * 0.5 + 0.5) * width - p.x,
        (0.5 - point.y * 0.5) * height - p.y,
      );
      if (actual > 0.001) {
        const k = inspect.radius / actual;
        glass.scale.set(
          glass.scale.x * k,
          glass.scale.y * k,
          glass.scale.z * k,
        );
      }
      return inspect.radius;
    }
    function place(root, size, x, y, closeup = 0) {
      const viewHeight = 2 * 8 * Math.tan((16 * Math.PI) / 180);
      const scale = ((size / height) * viewHeight) / 4;
      root.scale.set(scale);
      root.position.set(
        ((x - width / 2) * viewHeight) / height,
        ((height / 2 - y) * viewHeight) / height,
        closeup * 0.85,
      );
    }
    function resetProbe() {
      restore(probe, probeRest);
    }
    function resize(w, h, dpr = 1) {
      width = Math.max(1, w);
      height = Math.max(1, h);
      renderer.dpr = clamp(dpr, 1, 2);
      renderer.setSize(width, height);
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
        configure(probe.nodes, form, inspect, size);
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
            .applyMatrix4(probe.root.worldMatrix)
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
        viewYaw = 0,
      } = {}) {
        if (disposed) return;
        const kind = ambient?.kind;
        const name = inspect
          ? inspectName(inspect)
          : clips[kind || action] || "Idle";
        if (name !== lastName) {
          captured = new Map(
            gltf.nodes.map((node) => [
              node,
              {
                position: node.position.clone(),
                quaternion: node.quaternion.clone(),
              },
            ]),
          );
          blendTime = 0;
          lastName = name;
        }
        const delta = Math.min(0.08, Math.max(0, time - lastTime));
        lastTime = time;
        blendTime = Math.min(1, blendTime + delta / 0.35);
        restore(scene, rest);
        applyClip(animations, name, inspect ? 1 : (ambient?.time ?? time));
        if (captured && blendTime < 1) {
          const a = smooth(blendTime);
          for (const [node, previous] of captured) {
            node.position.lerp(previous.position, 1 - a);
            node.quaternion.slerp(previous.quaternion, 1 - a);
          }
        }
        configure(nodes, form, inspect, size);
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
        place(scene, size, x, y, close);
        const root = nodes.get("BuddyRoot");
        if (root) {
          root.rotation.y = viewYaw + (attention?.x || 0) * 0.1;
          root.rotation.x = (attention?.y || 0) * 0.035;
        }
        let opacity = 1;
        if (transition && root) {
          const p = clamp(transition.progress, 0, 1);
          const turn = smooth(p) * Math.PI * 8;
          root.rotation.y += turn;
          form = p < 0.5 ? transition.from : transition.to;
          configure(nodes, form, undefined, size);
          opacity =
            0.4 +
            0.6 *
              (p < 0.5
                ? 1 - smooth((p - 0.22) / 0.25)
                : smooth((p - 0.53) / 0.3));
          root.position.y += Math.sin(p * Math.PI) * 0.18;
          const vortex = nodes.get("Vortex");
          if (vortex) {
            vortex.visible = p > 0.03 && p < 0.98;
            vortex.rotation.y = -turn * 0.7;
          }
        }
        if (kind === "build") {
          const t = ambient.time || 0,
            phase = clamp(t / 9.4, 0, 1),
            house = nodes.get("House"),
            hammer = nodes.get("Hammer.R");
          const finish = 1 - smooth((phase - 0.86) / 0.13);
          if (house) {
            house.visible = phase > 0.12 && phase < 1;
            house.scale.set(Math.max(0.001, finish));
          }
          if (hammer) hammer.visible = phase > 0.06 && phase < 0.92;
          for (let i = 0; i < 4; i++) {
            const row = nodes.get("HouseCourse_" + i);
            if (row) {
              const grow = smooth((phase - 0.15 - i * 0.12) / 0.08);
              row.visible = grow > 0;
              row.scale.y = Math.max(0.001, grow);
            }
          }
          const roof = nodes.get("HouseRoof");
          if (roof) {
            roof.visible = phase > 0.68;
            roof.scale.y = Math.max(0.001, smooth((phase - 0.68) / 0.1));
          }
          const dust = nodes.get("BuildDust");
          if (dust) {
            dust.visible = phase > 0.15 && phase < 0.98;
            const puff = 0.55 + 0.45 * Math.abs(Math.sin(t * 5));
            dust.scale.set(Math.max(0.001, puff * finish));
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
        const automatic =
          {
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
                const k = 1 + close * 0.35;
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
            if (glint) glint.visible = blink < 0.92;
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
          program.uniforms.time.value = time;
          program.uniforms.opacity.value = opacity;
        });
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

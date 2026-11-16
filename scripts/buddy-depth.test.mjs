import assert from "node:assert/strict";
import test from "node:test";
import { Camera, Renderer, Transform } from "ogl";
import { renderBuddyProjection } from "../src/components/buddy/buddy-3d.js";

// Use OGL's visibility/sort implementation, substituting three depth samples
// for a GPU buffer. Artwork CI separately exercises the real shader and skin.
function projectionFixture(reverse = false) {
  let colourMask = true, depthMask = true, depthFunc = 513;
  const depth = [1, 1, 1], pixels = [[], [], []], draws = [];
  const gl = {
    COLOR_BUFFER_BIT: 1, DEPTH_BUFFER_BIT: 2, DEPTH_TEST: 3,
    LESS: 513, LEQUAL: 515,
    depthFunc(value) { depthFunc = value; },
    colorMask(...channels) { colourMask = channels.every(Boolean); },
    clear(flags) {
      if ((flags & 1) && colourMask) pixels.forEach((pixel) => pixel.splice(0));
      if ((flags & 2) && depthMask) depth.fill(1);
    },
  };
  const renderer = {
    gl, width: 100, height: 100, dpr: 1,
    // Match the pinned OGL cache, which differs from WebGL's initial LESS.
    state: { depthFunc: gl.LEQUAL },
    bindFramebuffer() {}, setViewport() {}, enable() {},
    setDepthMask(value) { depthMask = value; },
    setDepthFunc: Renderer.prototype.setDepthFunc,
    getRenderList: Renderer.prototype.getRenderList,
    sortOpaque: Renderer.prototype.sortOpaque,
    sortTransparent: Renderer.prototype.sortTransparent,
    sortUI: Renderer.prototype.sortUI,
  };
  const scene = new Transform(), camera = new Camera(gl);
  camera.position.z = 8;
  const specs = [
    ["Body", [[0, .5], [1, .5], [2, .5]], .94],
    ["ArmMesh.L", [[0, .7]], .86],
    ["ArmMesh.R", [[1, .2]], .86],
    ["GlassLens.R", [[2, .1]], .15],
    ["Dust_front", [[0, .3]], .2],
    ["VortexRibbon_back", [[0, .8]], .5],
  ];
  if (reverse) specs.reverse();
  const meshes = specs.map(([name, samples, alpha], index) => {
    const mesh = new Transform();
    mesh.name = name;
    mesh.id = mesh.renderOrder = index + 1;
    mesh.program = {
      id: index + 1, transparent: true, depthTest: true, depthWrite: false, depthFunc: gl.LEQUAL,
      uniforms: {
        opacity: { value: alpha }, depthPass: { value: 0 },
        lens: { value: name.startsWith("GlassLens") ? 1 : 0 }, trace: { value: 0 },
      },
    };
    mesh.draw = () => {
      if (mesh.fail) throw new Error("draw failed");
      const program = mesh.program;
      renderer.setDepthMask(program.depthWrite);
      renderer.setDepthFunc(program.depthFunc);
      draws.push([name, program.uniforms.depthPass.value, depthFunc]);
      for (const [pixel, z] of samples) {
        if (depthFunc === gl.LESS ? z >= depth[pixel] : z > depth[pixel]) continue;
        if (depthMask) depth[pixel] = z;
        if (colourMask) pixels[pixel].push([name, program.uniforms.opacity.value]);
      }
    };
    mesh.setParent(scene);
    return mesh;
  });
  return { renderer, scene, camera, meshes, pixels, draws,
    state: () => ({ colourMask, depthMask, depthFunc }) };
}

test("rear arms cannot blend through the body; front arms and glass retain alpha", () => {
  for (const reverse of [false, true]) {
    const frame = projectionFixture(reverse);
    assert.equal(frame.state().depthFunc, frame.renderer.gl.LESS);
    assert.equal(frame.renderer.state.depthFunc, frame.renderer.gl.LEQUAL);
    const hidden = new Transform();
    hidden.visible = false;
    hidden.draw = () => { throw new Error("inactive form rendered"); };
    hidden.setParent(frame.scene);
    renderBuddyProjection(frame.renderer, frame.scene, frame.camera);
    assert.deepEqual(frame.pixels, [
      [["Body", .94], ["Dust_front", .2]],
      [["ArmMesh.R", .86]],
      [["Body", .94], ["GlassLens.R", .15]],
    ]);
    assert.deepEqual(
      frame.draws.filter(([, pass]) => pass === 1).map(([name]) => name).sort(),
      ["ArmMesh.L", "ArmMesh.R", "Body"],
    );
    assert.ok(frame.draws.every(([, pass, func]) => func === (pass ? frame.renderer.gl.LESS : frame.renderer.gl.LEQUAL)));
    assert.deepEqual(frame.state(), { colourMask: true, depthMask: false, depthFunc: frame.renderer.gl.LEQUAL });
    renderBuddyProjection(frame.renderer, frame.scene, frame.camera);
    assert.deepEqual(frame.pixels[2], [["Body", .94], ["GlassLens.R", .15]]);
  }
});

test("a failed depth draw restores state for the next frame", () => {
  const frame = projectionFixture();
  frame.meshes[1].fail = true;
  assert.throws(
    () => renderBuddyProjection(frame.renderer, frame.scene, frame.camera),
    /draw failed/,
  );
  assert.deepEqual(frame.state(), { colourMask: true, depthMask: false, depthFunc: frame.renderer.gl.LEQUAL });
  assert.ok(frame.meshes.every(({ program }) =>
    !program.depthWrite && program.uniforms.depthPass.value === 0));
  frame.meshes[1].fail = false;
  renderBuddyProjection(frame.renderer, frame.scene, frame.camera);
  assert.deepEqual(frame.pixels[1], [["ArmMesh.R", .86]]);
});

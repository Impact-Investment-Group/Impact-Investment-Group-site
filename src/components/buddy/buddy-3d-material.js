import { Program } from "ogl";

const skin = `
attribute vec4 skinIndex;
attribute vec4 skinWeight;
uniform sampler2D boneTexture;
uniform float boneTextureSize;
mat4 bone(float index) {
  float j=index*4.0;
  float x=mod(j,boneTextureSize), y=floor(j/boneTextureSize);
  float s=1.0/boneTextureSize;
  return mat4(texture2D(boneTexture,vec2((x+.5)*s,(y+.5)*s)),
    texture2D(boneTexture,vec2((x+1.5)*s,(y+.5)*s)),
    texture2D(boneTexture,vec2((x+2.5)*s,(y+.5)*s)),
    texture2D(boneTexture,vec2((x+3.5)*s,(y+.5)*s)));
}`;

/** GLTFLoader.parseMaterials flattens the PBR base color onto its material. */
export function hologramColor(material) {
  return material?.baseColorFactor?.slice(0, 3) || [0.08, 0.55, 0.52];
}

/** The same GPU material is applied to every authored body, hand and prop. */
export function hologramMaterial(gl, material, skinned = false) {
  const name = material?.name || "";
  const ink = name === "Face_Ink";
  const lens = name === "Hologram_Lens";
  const color = hologramColor(material);
  return new Program(gl, {
    vertex: `precision highp float;
      attribute vec3 position, normal;
      uniform mat4 modelMatrix, modelViewMatrix, projectionMatrix, viewMatrix;
      uniform mat3 normalMatrix;
      varying vec3 vNormal, vView, vWorld;
      ${skinned ? skin : ""}
      void main(){
        ${skinned ? "mat4 deformation=bone(skinIndex.x)*skinWeight.x+bone(skinIndex.y)*skinWeight.y+bone(skinIndex.z)*skinWeight.z+bone(skinIndex.w)*skinWeight.w; vec4 world=deformation*vec4(position,1.0); vec4 view=viewMatrix*world; vNormal=normalize(mat3(viewMatrix)*mat3(deformation)*normal);" : "vec4 world=modelMatrix*vec4(position,1.0); vec4 view=modelViewMatrix*vec4(position,1.0); vNormal=normalize(normalMatrix*normal);"}
        vWorld=world.xyz;vView=-view.xyz;gl_Position=projectionMatrix*view;
      }`,
    fragment: `precision highp float;
      uniform vec3 baseColor;
      uniform float time, opacity, ink, lens;
      varying vec3 vNormal,vView,vWorld;
      void main(){
        vec3 n=normalize(vNormal),v=normalize(vView);
        float edge=pow(1.0-abs(dot(n,v)),2.0);
        float light=.50+.50*max(0.0,dot(n,normalize(vec3(-.5,.8,1.0))));
        float scan=.87+.13*sin(vWorld.y*105.0-time*.55);
        vec3 hologram=baseColor*light*scan+vec3(.10,.72,.73)*edge*.78;
        vec3 color=mix(hologram,baseColor,ink);
        float alpha=mix(.62+.27*edge,1.0,ink)*opacity;
        alpha=mix(alpha,(.10+.35*edge)*opacity,lens);
        gl_FragColor=vec4(pow(max(color,vec3(0.0)),vec3(1.0/2.2)),alpha);
      }`,
    uniforms: {
      baseColor: { value: color },
      time: { value: 0 },
      opacity: { value: 1 },
      ink: { value: ink ? 1 : 0 },
      lens: { value: lens ? 1 : 0 },
    },
    transparent: true,
    depthWrite: !lens,
    cullFace: gl.BACK,
  });
}

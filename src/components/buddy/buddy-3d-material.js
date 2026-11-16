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

/** Preserve the authored material separation in the lightweight studio renderer. */
export function hologramMaterial(gl, material, skinned = false) {
  const name = material?.name || "";
  const lens = name === "Hologram_Lens";
  const color = hologramColor(material);
  const roughness = Math.max(0.16, Math.min(1, material?.roughnessFactor ?? 0.3));
  const metallic = Math.max(0, Math.min(1, material?.metallicFactor ?? 0.15));
  const coat = material?.extensions?.KHR_materials_clearcoat?.clearcoatFactor ??
    (name === "Face_Ink" || name === "Eye_Catchlight" ? 0.18 : 0.42);
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
      uniform vec3 baseColor, emission;
      uniform float time, opacity, roughness, metallic, coat, lens, glow;
      varying vec3 vNormal,vView,vWorld;
      const float PI=3.14159265;
      vec3 fresnel(float cosine,vec3 f0){
        return f0+(1.0-f0)*pow(1.0-cosine,5.0);
      }
      // Isotropic GGX with Schlick masking, evaluated in linear light.
      vec3 studioLight(vec3 n,vec3 v,vec3 direction,vec3 radiance,vec3 f0){
        vec3 l=normalize(direction),h=normalize(v+l);
        float nl=max(dot(n,l),0.0),nv=max(dot(n,v),0.001);
        float nh=max(dot(n,h),0.0),vh=max(dot(v,h),0.0);
        float a=roughness*roughness,a2=a*a;
        float d=nh*nh*(a2-1.0)+1.0;
        float distribution=a2/max(PI*d*d,0.0001);
        float k=(roughness+1.0)*(roughness+1.0)/8.0;
        float geometry=(nv/(nv*(1.0-k)+k))*(nl/(nl*(1.0-k)+k));
        vec3 f=fresnel(vh,f0);
        vec3 specular=distribution*geometry*f/max(4.0*nv*nl,0.001);
        vec3 diffuse=(1.0-f)*(1.0-metallic)*baseColor/PI;
        return (diffuse+specular)*radiance*nl;
      }
      // Broad studio softboxes give the curved surfaces readable reflections
      // without an environment download or an expensive postprocessing pass.
      vec3 studioReflection(vec3 r){
        float key=pow(max(dot(r,normalize(vec3(-.65,.8,1.25))),0.0),18.0);
        float fill=pow(max(dot(r,normalize(vec3(.8,.3,1.1))),0.0),10.0);
        float top=pow(max(dot(r,normalize(vec3(.0,1.0,-.2))),0.0),8.0);
        return vec3(.98,.97,.94)*key*1.6+vec3(.66,.83,1.0)*fill*.65+vec3(.72,1.0,.96)*top*.75;
      }
      vec3 toSRGB(vec3 linearColor){
        vec3 low=12.92*linearColor;
        vec3 high=1.055*pow(max(linearColor,vec3(0.0)),vec3(1.0/2.4))-.055;
        return mix(low,high,step(vec3(.0031308),linearColor));
      }
      void main(){
        vec3 n=normalize(vNormal),v=normalize(vView);
        float nv=max(dot(n,v),0.0),edge=pow(1.0-nv,3.0);
        vec3 f0=mix(vec3(.04),baseColor,metallic);
        vec3 sky=mix(vec3(.10,.13,.17),vec3(.43,.48,.51),n.y*.5+.5);
        vec3 color=baseColor*sky*(1.0-metallic*.65);
        color+=studioLight(n,v,vec3(-.6,.85,1.4),vec3(3.2,3.1,2.9),f0);
        color+=studioLight(n,v,vec3(.9,.2,1.0),vec3(.65,.84,1.05),f0);
        color+=studioLight(n,v,vec3(.15,.7,-1.0),vec3(.65,1.15,1.2),f0);
        vec3 reflection=studioReflection(reflect(-v,n));
        color+=reflection*(fresnel(nv,f0)*(1.0-roughness*.65)+coat*.11);
        // A restrained cool edge retains the digital identity without stripes
        // or washing out the face and hands.
        color+=vec3(.025,.12,.14)*edge*coat+emission;
        color+=vec3(.06,.65,.55)*glow;
        // Gentle photographic highlight compression, then one linear-to-sRGB conversion.
        color=color/(vec3(1.0)+color*.28);
        float alpha=mix(1.0,.055+.24*edge,lens)*opacity;
        gl_FragColor=vec4(toSRGB(clamp(color,0.0,1.0)),alpha);
      }`,
    uniforms: {
      baseColor: { value: color },
      time: { value: 0 },
      opacity: { value: 1 },
      glow: { value: 0 },
      roughness: { value: roughness },
      metallic: { value: metallic },
      coat: { value: coat },
      emission: { value: material?.emissiveFactor || [0, 0, 0] },
      lens: { value: lens ? 1 : 0 },
    },
    transparent: true,
    depthWrite: !lens,
    cullFace: gl.BACK,
  });
}

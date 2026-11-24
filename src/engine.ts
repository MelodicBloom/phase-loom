import * as THREE from "three";
import { normalize, type LoomState } from "./core";

const vertex = `
precision highp float;
uniform float uAperture; uniform vec2 uPhaseSC; uniform vec2 uWaveSC; uniform vec2 uRatio;
in vec4 aFrame; in vec4 aModes;
out vec3 vNormal; out vec3 vWorld; out float vRib; out float vU;
const float PI=3.141592653589793;
void main(){
 float u=position.x;float v=position.y;float t=position.z;
 vec3 radial=vec3(aFrame.x,aFrame.y,0.);
 vec3 tangent=vec3(-aFrame.y,aFrame.x,0.);
 float wave=.16*(aFrame.z*uWaveSC.y+aFrame.w*uWaveSC.x);
 float dr=.48*(aFrame.w*uWaveSC.y-aFrame.z*uWaveSC.x);
 float radius=1.28+.34*uAperture+wave;
 vec2 pm=uRatio.x<1.5?aModes.xy:(uRatio.x<2.5?aModes.zw:aFrame.zw);
 vec2 qm=uRatio.y<1.5?aModes.xy:aModes.zw;
 float ps=pm.x*uPhaseSC.y+pm.y*uPhaseSC.x;
 float pc=pm.y*uPhaseSC.y-pm.x*uPhaseSC.x;
 float twist=1.5*u+.32*ps*qm.y+.5*uPhaseSC.x;
 float dt=1.5+.32*(uRatio.x*pc*qm.y-uRatio.y*ps*qm.x);
 float st=sin(twist),ct=cos(twist),width=.83-.25*uAperture;
 vec3 B=width*(ct*radial+st*vec3(0.,0.,1.));
 vec3 db=width*(-st*dt*radial+ct*tangent+ct*dt*vec3(0.,0.,1.));
 vec3 center=radius*radial+vec3(0.,0.,.10*aFrame.z);
 vec3 du=dr*radial+radius*tangent+vec3(0.,0.,.3*aFrame.w)+v*db;
 vec3 p=center+v*B;
 vec3 N=normalize(cross(du,B));
 vec3 n=normalize(N-normalize(B)*.28*sin(t*2.*PI));
 vec4 world=modelMatrix*vec4(p,1.);
 vNormal=normalize(mat3(modelMatrix)*n);vWorld=world.xyz;vRib=t;vU=u;
 gl_Position=projectionMatrix*viewMatrix*world;
}`;
const fragment = `
precision highp float;
in vec3 vNormal; in vec3 vWorld; in float vRib; in float vU;
uniform float uLens; uniform vec2 uRatio; uniform vec2 uPhaseSC;
out vec4 fragColor;
const float PI=3.141592653589793;
vec3 fresnel(float x,vec3 f){return f+(1.-f)*pow(1.-x,5.);}
vec3 light(vec3 N,vec3 V,vec3 L,vec3 radiance,vec3 color){
 vec3 H=normalize(V+L);
 float nl=max(dot(N,L),0.); float nv=max(dot(N,V),.001);float nh=max(dot(N,H),0.);
 float a=.20;float a2=a*a;float d=a2/(PI*pow(nh*nh*(a2-1.)+1.,2.));
 float k=.18;float g=(nv/(nv*(1.-k)+k))*(nl/(nl*(1.-k)+k));
 vec3 F=fresnel(max(dot(H,V),0.),color);
 return radiance*nl*(F*d*g/(4.*nv*max(nl,.001))+.06*color);
}
void main(){
 vec3 N=normalize(vNormal);if(!gl_FrontFacing)N=-N;
 if(uLens>.5&&uLens<1.5){fragColor=vec4(N*.5+.5,1.);return;}
 if(uLens>1.5&&uLens<2.5){
  float wave=.5+.5*(sin(vU*uRatio.x)*uPhaseSC.y+cos(vU*uRatio.x)*uPhaseSC.x);
  float grid=1.-smoothstep(.01,.04,abs(fract(vU/(2.*PI)*12.)-.5));
  vec3 c=mix(vec3(.08,.22,.48),vec3(1.,.65,.18),wave);
  fragColor=vec4(mix(c,vec3(.95,.95,.8),grid*.45),1.);return;
 }
 vec3 V=normalize(cameraPosition-vWorld);vec3 R=reflect(-V,N);
 vec3 copper=vec3(.52,.22,.10);
 // Artistic conductor shading; not a calibrated thin-film material.
 vec3 color=mix(copper,vec3(.42,.43,.47),.25+.15*sin(vU*3.));
 vec3 c=color*.09;
 c+=light(N,V,normalize(vec3(-3.,4.,5.)),vec3(5.0,3.6,2.5),color);
 c+=light(N,V,normalize(vec3(3.,1.,2.)),vec3(.6,1.8,5.5),mix(color,vec3(.5,.6,.85),.5));
 c+=light(N,V,normalize(vec3(-1.,-3.,2.)),vec3(3.0,1.4,.55),color);
 // Broad studio reflection cards make the rib curvature legible.
 float strip=pow(max(dot(R,normalize(vec3(-.6,1.,1.))),0.),32.);
 float blue=pow(max(dot(R,normalize(vec3(1.,.15,.5))),0.),12.);
 c+=strip*vec3(2.8,2.3,1.8)*fresnel(max(dot(N,V),0.),color);
 c+=blue*vec3(.13,.37,1.4);
 float edge=.82+.18*smoothstep(0.,.15,sin(vRib*PI));
 float interior=.65+.35*smoothstep(.1,1.6,length(vWorld.xy));
 c*=edge*interior;
 c=c/(c+vec3(1.));c=pow(c,vec3(1./2.2));
 fragColor=vec4(c,1.);
}`;

export interface Engine {
  update: (s: LoomState) => void;
  resize: () => void;
  render: () => void;
  dispose: () => void;
  capture: () => string;
  info: () => Record<string, unknown>;
}
export function mountLoom(
  canvas: HTMLCanvasElement,
  initial: LoomState,
): Engine {
  const context = canvas.getContext("webgl2", {
    alpha: true,
    antialias: true,
    preserveDrawingBuffer: true,
    powerPreference: "high-performance",
  });
  if (!context) throw new Error("WebGL2 is unavailable");
  const renderer = new THREE.WebGLRenderer({
    canvas,
    context,
    alpha: true,
    antialias: true,
  });
  renderer.setClearColor(0x100e0d, 0);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(33, 1, 0.1, 50);
  camera.position.set(0, 0, 7.9);
  const ribs = 64,
    segments = 128,
    cross = 4;
  const params: number[] = [];
  const frames: number[] = [],
    modes: number[] = [];
  const indices: number[] = [];
  for (let rib = 0; rib < ribs; rib++) {
    const start = params.length / 3;
    for (let i = 0; i <= segments; i++)
      for (let j = 0; j <= cross; j++) {
        const t = j / cross;
        const u = (i / segments) * Math.PI * 2;
        frames.push(Math.cos(u), Math.sin(u), Math.sin(3 * u), Math.cos(3 * u));
        modes.push(Math.sin(u), Math.cos(u), Math.sin(2 * u), Math.cos(2 * u));
        params.push(
          (i / segments) * Math.PI * 2,
          -1 + (2 * (rib + 0.006 + t * 0.988)) / ribs,
          t,
        );
      }
    for (let i = 0; i < segments; i++)
      for (let j = 0; j < cross; j++) {
        const a = start + i * (cross + 1) + j,
          b = a + cross + 1;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(params, 3),
  );
  geometry.setAttribute("aFrame", new THREE.Float32BufferAttribute(frames, 4));
  geometry.setAttribute("aModes", new THREE.Float32BufferAttribute(modes, 4));
  geometry.setIndex(indices);
  const material = new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    vertexShader: vertex,
    fragmentShader: fragment,
    side: THREE.DoubleSide,
    uniforms: {
      uAperture: { value: 1 },
      uLens: { value: 0 },
      uPhaseSC: { value: new THREE.Vector2(0, 1) },
      uWaveSC: { value: new THREE.Vector2(0, 1) },
      uRatio: { value: new THREE.Vector2(3, 2) },
      uRibs: { value: ribs },
    },
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  scene.add(mesh);
  let state = normalize(initial);
  let disposed = false;
  const update = (value: LoomState) => {
    state = normalize(value);
    material.uniforms.uLens.value = state.lens;
    material.uniforms.uAperture.value = state.aperture / 8;
    const phase =
      (state.phase * Math.PI) / 6 + (state.tick / 720) * Math.PI * 2;
    material.uniforms.uPhaseSC.value.set(Math.sin(phase), Math.cos(phase));
    const wave = 0.35 * Math.sin(phase);
    material.uniforms.uWaveSC.value.set(Math.sin(wave), Math.cos(wave));
    const ratios = [
      [1, 1],
      [3, 2],
      [2, 1],
    ];
    material.uniforms.uRatio.value.set(
      ...(ratios[state.ratio] as [number, number]),
    );
    mesh.rotation.set(
      0.42 + (state.pitch * Math.PI) / 180,
      -0.25 + (state.yaw * Math.PI) / 180,
      -0.24,
    );
  };
  const resize = () => {
    if (disposed) return;
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width)),
      h = Math.max(1, Math.round(rect.height));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.z = 7.9 / Math.min(1, camera.aspect);
    camera.updateProjectionMatrix();
  };
  update(state);
  resize();
  const render = () => {
    if (!disposed) renderer.render(scene, camera);
  };
  render();
  if (context.getError() !== context.NO_ERROR)
    throw new Error("WebGL reported a rendering error");
  return {
    update,
    resize,
    render,
    capture: () => {
      render();
      return canvas.toDataURL("image/png");
    },
    info: () => {
      const ext = context.getExtension("WEBGL_debug_renderer_info");
      return {
        renderer: ext
          ? context.getParameter(ext.UNMASKED_RENDERER_WEBGL)
          : context.getParameter(context.RENDERER),
        triangles: renderer.info.render.triangles,
        drawCalls: renderer.info.render.calls,
        webgl: 2,
        glsl: "300 es",
        dpr: renderer.getPixelRatio(),
        width: canvas.width,
        height: canvas.height,
      };
    },
    dispose: () => {
      disposed = true;
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    },
  };
}

import { useEffect, useRef } from "react";
import * as THREE from "three";

/* ============================================================
   NoiseField — a TouchDesigner-style fbm / domain-warp noise field
   in blue (cyan) + red. Reactive to room NOISE (mic) and your
   MOVEMENT (pointer / device orientation). During the cover
   transition `enterRef` (0..1) drives zoom + glitch + white-out.
   ============================================================ */

const FRAG = `
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform float uLevel;   // mic 0..1
uniform float uMotion;  // movement 0..1
uniform float uEnter;   // transition 0..1
uniform float uIntensity; // base visibility (cover=1, backdrop<1)
uniform vec2  uRes;

vec3 RED  = vec3(0.90, 0.13, 0.10);
vec3 CYAN = vec3(0.11, 0.92, 0.86);

float hash(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p,p+45.32); return fract(p.x*p.y); }
float vnoise(vec2 p){
  vec2 i=floor(p), f=fract(p);
  float a=hash(i), b=hash(i+vec2(1.,0.)), c=hash(i+vec2(0.,1.)), d=hash(i+vec2(1.,1.));
  vec2 u=f*f*(3.-2.*f);
  return mix(a,b,u.x)+(c-a)*u.y*(1.-u.x)+(d-b)*u.x*u.y;
}
float fbm(vec2 p){
  float s=0., a=0.5;
  for(int i=0;i<5;i++){ s+=a*vnoise(p); p*=2.02; a*=0.5; }
  return s;
}

void main(){
  vec2 uv = vUv;
  float asp = uRes.x/uRes.y;
  vec2 p = (uv-0.5)*vec2(asp,1.0);

  // zoom in during transition
  float zoom = 1.0 - uEnter*0.72;
  p *= zoom;

  float t = uTime*(0.06 + uLevel*0.35 + uEnter*0.9);
  float warpAmt = 0.6 + uLevel*1.4 + uMotion*1.2 + uEnter*3.0;

  // domain warp
  vec2 q = vec2(fbm(p*1.6 + t), fbm(p*1.6 - t + 5.2));
  vec2 r = vec2(fbm(p*2.2 + q*warpAmt + t*0.7), fbm(p*2.2 + q*warpAmt - t*0.6));
  float n = fbm(p*2.4 + r*warpAmt);

  // glitch: horizontal band displacement rises with enter+motion
  float g = uEnter*0.9 + uMotion*0.3;
  float band = step(0.985 - g*0.5, hash(vec2(floor(uv.y*90.0), floor(uTime*12.0))));
  n += band * g * (hash(vec2(floor(uv.y*90.0), 3.0))-0.5) * 2.0;

  // color ramp: dark -> red -> cyan
  vec3 col = mix(vec3(0.015,0.02,0.025), RED, smoothstep(0.32,0.58,n));
  col = mix(col, CYAN, smoothstep(0.60,0.86,n));
  col += CYAN * pow(max(n-0.8,0.0),2.0) * (0.6+uLevel);

  // rgb split glitch
  float sh = g*0.02;
  float nr = fbm(p*2.4 + r*warpAmt + vec2(sh,0.));
  float nb = fbm(p*2.4 + r*warpAmt - vec2(sh,0.));
  col.r = mix(col.r, smoothstep(0.32,0.58,nr), g*0.6);
  col.b = mix(col.b, smoothstep(0.60,0.86,nb), g*0.6);

  // brightness from noise energy
  col *= (0.5 + uLevel*0.7 + uMotion*0.4);

  // vignette
  float vig = smoothstep(1.25,0.2,length((uv-0.5)*vec2(asp,1.)));
  col *= mix(0.55,1.0,vig);

  // white-out then black-out at the very end of the transition
  float white = smoothstep(0.72,0.9,uEnter)*(1.0-smoothstep(0.9,1.0,uEnter));
  col = mix(col, vec3(1.0), white*0.85);
  float black = smoothstep(0.92,1.0,uEnter);
  col = mix(col, vec3(0.02), black);

  col *= uIntensity;
  gl_FragColor = vec4(col, 1.0);
}
`;

const VERT = `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0);} `;

export function NoiseField({ levelRef, bandsRef, enterRef, intensity = 1, accent }) {
  const mountRef = useRef(null);
  const motionRef = useRef(0);
  void accent; void bandsRef;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: "high-performance" });
    } catch (e) {
      console.warn("NoiseField: WebGL unavailable.", e?.message);
      mount.classList.add("noise-field--fallback");
      return;
    }
    renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.display = "block";

    const scene = new THREE.Scene();
    const camera = new THREE.Camera();
    const uniforms = {
      uTime: { value: 0 },
      uLevel: { value: 0 },
      uMotion: { value: 0 },
      uEnter: { value: 0 },
      uIntensity: { value: intensity },
      uRes: { value: new THREE.Vector2(1, 1) },
    };
    const mat = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms, depthTest: false });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
    quad.frustumCulled = false;
    scene.add(quad);

    const resize = () => {
      const w = mount.clientWidth || window.innerWidth;
      const h = mount.clientHeight || window.innerHeight;
      renderer.setSize(w, h, false);
      uniforms.uRes.value.set(w, h);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    let px = 0, py = 0, hp = false;
    const onPointer = (e) => {
      const tt = e.touches ? e.touches[0] : e;
      if (hp) motionRef.current = Math.min(1, motionRef.current + Math.hypot(tt.clientX - px, tt.clientY - py) / 240);
      px = tt.clientX; py = tt.clientY; hp = true;
    };
    let go = null;
    const onOrient = (e) => {
      if (e.gamma == null) return;
      if (go) motionRef.current = Math.min(1, motionRef.current + (Math.abs(e.gamma - go.g) + Math.abs((e.beta || 0) - go.b)) / 40);
      go = { g: e.gamma, b: e.beta || 0 };
    };
    window.addEventListener("pointermove", onPointer);
    window.addEventListener("deviceorientation", onOrient, true);

    let raf = 0, last = performance.now();
    const loop = () => {
      const now = performance.now();
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      motionRef.current *= 0.92;
      const idle = 0.04 + Math.abs(Math.sin(now * 0.0006)) * 0.05;
      uniforms.uTime.value += dt;
      uniforms.uLevel.value += (Math.max(idle, levelRef?.current ?? 0) - uniforms.uLevel.value) * 0.2;
      uniforms.uMotion.value = motionRef.current;
      uniforms.uEnter.value = enterRef?.current ?? 0;
      uniforms.uIntensity.value = intensity;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("deviceorientation", onOrient, true);
      renderer.dispose();
      mat.dispose();
      quad.geometry.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, [levelRef, enterRef, intensity]);

  return <div ref={mountRef} className="noise-field" aria-hidden="true" />;
}

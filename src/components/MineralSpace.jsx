import { useEffect, useRef } from "react";
import * as THREE from "three";

/* ============================================================
   MineralSpace — a WebGL "specimen in space" backdrop.
   Low-poly mineral shards drift in dark space; a field of little
   framed squares (the poster motif) floats among them and BLINKS
   + JITTERS to the ambient sound the phone hears (levelRef).
   It listens to the room and comes alive.

   Props:
     levelRef  – ref<number> ambient loudness 0..1 (from useMic)
     bandsRef  – ref<{low,mid,high}> optional spectral split
     accent    – 'aqua' | 'red'
     tone      – 'space' (near-black) | 'paper' (light mineral)
   ============================================================ */
export function MineralSpace({ levelRef, bandsRef, accent = "aqua", tone = "space" }) {
  const mountRef = useRef(null);
  const pointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const paper = tone === "paper";
    const ACCENT = accent === "red" ? 0xe5241c : 0x1eeadb;
    const ACCENT2 = accent === "red" ? 0x1eeadb : 0xe5241c;
    const bgTop = paper ? 0xe7e2dd : 0x0b0d0f;
    const bgBottom = paper ? 0xd8d1ca : 0x050607;
    const rockCol = paper ? 0x8f877e : 0x3a4046;
    const squareCol = paper ? 0x2a2a2a : 0xcfd6d8;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(bgBottom, paper ? 0.02 : 0.03);

    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200);
    camera.position.set(0, 0, 34);

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, failIfMajorPerformanceCaveat: false });
    } catch (e) {
      // no WebGL (some devices / headless) — the CSS gradient fallback stays
      console.warn("MineralSpace: WebGL unavailable, using static backdrop.", e?.message);
      mount.classList.add("mineral-space--fallback");
      return;
    }
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.display = "block";

    /* gradient backdrop */
    const bgGeo = new THREE.PlaneGeometry(2, 2);
    const bgMat = new THREE.ShaderMaterial({
      depthWrite: false,
      depthTest: false,
      uniforms: {
        top: { value: new THREE.Color(bgTop) },
        bottom: { value: new THREE.Color(bgBottom) },
      },
      vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.999,1.0);}`,
      fragmentShader: `varying vec2 vUv; uniform vec3 top; uniform vec3 bottom;
        void main(){ gl_FragColor=vec4(mix(bottom,top,pow(vUv.y,1.3)),1.0);}`,
    });
    const bgMesh = new THREE.Mesh(bgGeo, bgMat);
    bgMesh.frustumCulled = false;
    scene.add(bgMesh);

    /* lights */
    scene.add(new THREE.AmbientLight(0xffffff, paper ? 0.9 : 0.35));
    const key = new THREE.DirectionalLight(0xffffff, paper ? 0.6 : 0.8);
    key.position.set(6, 10, 8);
    scene.add(key);
    const glowA = new THREE.PointLight(ACCENT, paper ? 0.5 : 1.4, 90);
    glowA.position.set(-14, 6, 12);
    scene.add(glowA);
    const glowB = new THREE.PointLight(ACCENT2, paper ? 0.35 : 0.9, 90);
    glowB.position.set(16, -8, 8);
    scene.add(glowB);

    /* ---- mineral shards ---- */
    const rocks = [];
    const geoms = [
      new THREE.IcosahedronGeometry(1, 0),
      new THREE.DodecahedronGeometry(1, 0),
      new THREE.OctahedronGeometry(1, 0),
      new THREE.TetrahedronGeometry(1, 0),
    ];
    const rockMat = new THREE.MeshStandardMaterial({
      color: rockCol,
      flatShading: true,
      roughness: 0.95,
      metalness: 0.15,
    });
    for (let i = 0; i < 13; i++) {
      const g = geoms[i % geoms.length];
      const s = 1.6 + Math.random() * 3.6;
      const mesh = new THREE.Mesh(g, rockMat);
      mesh.scale.setScalar(s);
      mesh.position.set(
        (Math.random() - 0.5) * 46,
        (Math.random() - 0.5) * 40,
        -6 - Math.random() * 40
      );
      mesh.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
      // faint wireframe crust
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(g),
        new THREE.LineBasicMaterial({ color: paper ? 0x555555 : 0x8a949a, transparent: true, opacity: 0.35 })
      );
      mesh.add(edges);
      mesh.userData = {
        spin: new THREE.Vector3((Math.random() - 0.5) * 0.004, (Math.random() - 0.5) * 0.004, (Math.random() - 0.5) * 0.004),
        drift: (Math.random() - 0.5) * 0.01,
        phase: Math.random() * 6.28,
      };
      rocks.push(mesh);
      scene.add(mesh);
    }

    /* ---- listening squares (poster motif) ---- */
    const squares = [];
    const sqGroup = new THREE.Group();
    const unit = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-0.5, -0.5, 0), new THREE.Vector3(0.5, -0.5, 0),
      new THREE.Vector3(0.5, 0.5, 0), new THREE.Vector3(-0.5, 0.5, 0),
      new THREE.Vector3(-0.5, -0.5, 0),
    ]);
    for (let i = 0; i < 46; i++) {
      const accentSq = Math.random() < 0.16;
      const mat = new THREE.LineBasicMaterial({
        color: accentSq ? ACCENT : squareCol,
        transparent: true,
        opacity: 0.5,
      });
      const line = new THREE.Line(unit, mat);
      const base = new THREE.Vector3(
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 44,
        2 - Math.random() * 30
      );
      line.position.copy(base);
      const sc = 0.8 + Math.random() * 3;
      line.scale.setScalar(sc);
      line.userData = { base: base.clone(), sc, phase: Math.random() * 6.28, accent: accentSq, blink: Math.random() };
      // center dot
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 6, 6),
        new THREE.MeshBasicMaterial({ color: accentSq ? ACCENT : squareCol, transparent: true, opacity: 0.7 })
      );
      line.add(dot);
      squares.push(line);
      sqGroup.add(line);
    }
    scene.add(sqGroup);

    /* ---- dust ---- */
    const dustN = 320;
    const dustPos = new Float32Array(dustN * 3);
    for (let i = 0; i < dustN; i++) {
      dustPos[i * 3] = (Math.random() - 0.5) * 80;
      dustPos[i * 3 + 1] = (Math.random() - 0.5) * 70;
      dustPos[i * 3 + 2] = -Math.random() * 60;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
    const dust = new THREE.Points(
      dustGeo,
      new THREE.PointsMaterial({ color: paper ? 0x777777 : 0x9fb0b5, size: 0.13, transparent: true, opacity: 0.55 })
    );
    scene.add(dust);

    /* ---- resize ---- */
    const resize = () => {
      const w = mount.clientWidth || window.innerWidth;
      const h = mount.clientHeight || window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    const onPointer = (e) => {
      const t = e.touches ? e.touches[0] : e;
      pointer.current.x = (t.clientX / window.innerWidth - 0.5);
      pointer.current.y = (t.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener("pointermove", onPointer);

    /* ---- loop ---- */
    let raf = 0;
    let t = 0;
    let last = performance.now();
    const animate = () => {
      const now = performance.now();
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      t += dt;
      // idle "breathing" floor so the scene lives even before it hears the room
      const idle = 0.05 + Math.abs(Math.sin(t * 0.6)) * 0.06;
      const level = Math.max(idle, levelRef?.current ?? 0);
      const b = bandsRef?.current ?? {};
      const bands = {
        low: Math.max(idle, b.low ?? level),
        mid: Math.max(idle, b.mid ?? level),
        high: Math.max(idle, b.high ?? level),
      };
      const kick = Math.min(1, level * 1.5);

      // camera parallax + slow orbit
      camera.position.x += (pointer.current.x * 8 - camera.position.x) * 0.03;
      camera.position.y += (-pointer.current.y * 6 - camera.position.y) * 0.03;
      camera.position.z = 34 - kick * 3;
      camera.lookAt(0, 0, -12);

      rocks.forEach((m) => {
        const u = m.userData;
        m.rotation.x += u.spin.x * (1 + kick * 3);
        m.rotation.y += u.spin.y * (1 + kick * 3);
        m.rotation.z += u.spin.z;
        m.position.y += Math.sin(t * 0.4 + u.phase) * 0.006;
      });

      squares.forEach((s) => {
        const u = s.userData;
        const j = (0.4 + kick * 3.2);
        s.position.x = u.base.x + Math.sin(t * 1.6 + u.phase) * j;
        s.position.y = u.base.y + Math.cos(t * 1.3 + u.phase) * j;
        s.lookAt(camera.position);
        // blink to the sound
        const react = u.accent ? bands.high : bands.mid;
        const target = 0.18 + (0.25 + react * 0.9) + Math.sin(t * 3 + u.phase) * 0.12 * kick;
        s.material.opacity += (Math.min(1, target) - s.material.opacity) * 0.3;
        const pulse = 1 + kick * (u.accent ? 0.5 : 0.28) * (0.6 + Math.sin(t * 6 + u.phase) * 0.4);
        s.scale.setScalar(u.sc * pulse);
        if (s.children[0]) s.children[0].material.opacity = 0.4 + kick * 0.6;
      });

      sqGroup.rotation.z = Math.sin(t * 0.05) * 0.04;
      dust.rotation.y += 0.0004 + kick * 0.001;
      glowA.intensity = (paper ? 0.5 : 1.4) + kick * 1.2;
      glowB.intensity = (paper ? 0.35 : 0.9) + bands.low * 1.0;

      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onPointer);
      renderer.dispose();
      geoms.forEach((g) => g.dispose());
      unit.dispose();
      dustGeo.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, [accent, tone, levelRef, bandsRef]);

  return <div ref={mountRef} className="mineral-space" aria-hidden="true" />;
}

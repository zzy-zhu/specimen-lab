import { useEffect, useRef } from "react";

/* ============================================================
   CoverField — the box + node network overlay (transparent) that
   sits on the NoiseField. Blinks/drifts with room noise (mic) and
   your movement. During the cover transition (enterRef 0..1) the
   network ACCUMULATES boxes, the lines turn CHAOTIC, it ZOOMS in,
   and GLITCHES (rgb split + band offsets).
   ============================================================ */
function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function CoverField({ levelRef, enterRef }) {
  const canvasRef = useRef(null);
  const motionRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let W = 0, H = 0;

    const rand = mulberry(20260718);
    const nodes = [];
    const clusters = [];
    for (let c = 0; c < 7; c++) {
      const cx = 0.1 + rand() * 0.8, cy = 0.08 + rand() * 0.84;
      const count = 4 + Math.floor(rand() * 7);
      const spread = 0.05 + rand() * 0.08;
      const start = nodes.length;
      for (let i = 0; i < count; i++)
        nodes.push({ bx: cx + (rand() - 0.5) * spread * 2, by: cy + (rand() - 0.5) * spread * 2, box: 10 + rand() * 46, ph: rand() * 6.28, jx: 0.4 + rand() * 0.8, jy: 0.4 + rand() * 0.8, blink: rand() });
      clusters.push({ start, end: nodes.length });
    }
    const edges = [];
    clusters.forEach(({ start, end }) => {
      for (let i = start; i < end; i++) for (let j = i + 1; j < end; j++) if (rand() < 0.5) edges.push([i, j]);
    });
    for (let k = 0; k < 8; k++) edges.push([Math.floor(rand() * nodes.length), Math.floor(rand() * nodes.length)]);
    const extra = [];
    const chaos = [];

    const resize = () => {
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

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

    let raf = 0, t = 0, last = performance.now();

    const drawNet = (ox, oy, color, alphaMul, energy, ep, zoom) => {
      const cx = W / 2, cy = H / 2;
      const pos = (n) => {
        const jit = (0.006 + energy * 0.05) * (1 + ep * 3);
        let x = (n.bx + Math.sin(t * 1.3 + n.ph) * n.jx * jit) * W;
        let y = (n.by + Math.cos(t * 1.1 + n.ph) * n.jy * jit) * H;
        x = cx + (x - cx) * zoom + ox;
        y = cy + (y - cy) * zoom + oy;
        return [x, y];
      };
      ctx.strokeStyle = color;
      ctx.lineWidth = 0.7;
      ctx.globalAlpha = (0.4 + energy * 0.5) * alphaMul;
      edges.forEach(([a, b]) => {
        const [x1, y1] = pos(nodes[a]); const [x2, y2] = pos(nodes[b]);
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      });
      // chaotic lines during enter
      if (chaos.length) {
        ctx.globalAlpha = ep * 0.7 * alphaMul;
        chaos.forEach(([a, b]) => {
          const [x1, y1] = pos(nodes[a % nodes.length]); const [x2, y2] = pos(nodes[b % nodes.length]);
          ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        });
      }
      nodes.forEach((n) => {
        const [x, y] = pos(n);
        const blink = 0.4 + (0.4 + energy * 0.6) * (0.6 + Math.sin(t * 3 + n.blink * 9) * 0.4);
        const s = n.box * (1 + ep * 0.6) * zoom;
        ctx.globalAlpha = Math.min(1, blink) * alphaMul;
        ctx.strokeRect(x - s / 2, y - s / 2, s, s);
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(x, y, 2, 0, 6.28); ctx.fill();
      });
      // accumulated transient boxes
      if (extra.length) {
        ctx.globalAlpha = ep * alphaMul;
        extra.forEach((n) => {
          let x = (n.bx + Math.sin(t * 2 + n.ph) * 0.05) * W;
          let y = (n.by + Math.cos(t * 1.7 + n.ph) * 0.05) * H;
          x = cx + (x - cx) * zoom + ox; y = cy + (y - cy) * zoom + oy;
          ctx.strokeRect(x - n.box / 2 * zoom, y - n.box / 2 * zoom, n.box * zoom, n.box * zoom);
        });
      }
      ctx.globalAlpha = 1;
    };

    const loop = () => {
      const now = performance.now();
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now; t += dt;
      motionRef.current *= 0.9;
      const idle = 0.04 + Math.abs(Math.sin(t * 0.7)) * 0.05;
      const level = Math.max(idle, levelRef?.current ?? 0);
      const energy = Math.min(1, level + motionRef.current * 0.8);
      const ep = enterRef?.current ?? 0;

      // grow accumulation + chaos with enter progress
      const targetExtra = Math.floor(ep * ep * 300);
      while (extra.length < targetExtra) {
        const a = nodes[Math.floor(Math.random() * nodes.length)];
        extra.push({ bx: a.bx + (Math.random() - 0.5) * 0.55, by: a.by + (Math.random() - 0.5) * 0.55, box: 6 + Math.random() * 40, ph: Math.random() * 6.28 });
      }
      const targetChaos = Math.floor(ep * 140);
      while (chaos.length < targetChaos) chaos.push([Math.floor(Math.random() * nodes.length), Math.floor(Math.random() * nodes.length)]);

      const zoom = 1 + ep * ep * 2.6;
      ctx.clearRect(0, 0, W, H);

      if (ep > 0.25) {
        // rgb split glitch
        const sh = ep * 10;
        drawNet(-sh, 0, "rgba(229,36,28,0.9)", 0.8, energy, ep, zoom);
        drawNet(sh, 0, "rgba(18,224,230,0.9)", 0.8, energy, ep, zoom);
        drawNet(0, 0, "rgba(255,255,255,0.9)", 1, energy, ep, zoom);
        // random band displacement
        if (Math.random() < ep * 0.8) {
          const by = Math.random() * H, bh = 6 + Math.random() * 40, dx = (Math.random() - 0.5) * ep * 60;
          const img = ctx.getImageData(0, by * dpr, canvas.width, bh * dpr);
          ctx.putImageData(img, dx * dpr, by * dpr);
        }
      } else {
        drawNet(0, 0, "rgba(247,245,243,0.92)", 1, energy, ep, zoom);
      }
      raf = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("deviceorientation", onOrient, true);
    };
  }, [levelRef, enterRef]);

  return <canvas ref={canvasRef} className="cover-field" aria-hidden="true" />;
}

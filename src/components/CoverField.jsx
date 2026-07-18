import { useEffect, useRef } from "react";

/* ============================================================
   CoverField — the living red cover.
   Boxes + a connected node network (the poster motif) drawn on
   canvas. They blink and drift with:
     · surrounding NOISE   (mic level, via levelRef)
     · your MOVEMENT       (pointer / device orientation)
   On `entering`, the network multiplies — more and more nodes and
   roots — then the whole field is swallowed to black.
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

export function CoverField({ levelRef, entering, onBlack }) {
  const canvasRef = useRef(null);
  const motionRef = useRef(0);
  const enterRef = useRef(0); // 0..1 progress once entering
  const blackFiredRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);

    // build clustered node network (poster-like)
    const rand = mulberry(20260718);
    const CLUSTERS = 7;
    const nodes = [];
    const clusters = [];
    for (let c = 0; c < CLUSTERS; c++) {
      const cx = 0.1 + rand() * 0.8;
      const cy = 0.08 + rand() * 0.84;
      const count = 4 + Math.floor(rand() * 7);
      const spread = 0.05 + rand() * 0.08;
      const start = nodes.length;
      for (let i = 0; i < count; i++) {
        nodes.push({
          bx: cx + (rand() - 0.5) * spread * 2,
          by: cy + (rand() - 0.5) * spread * 2,
          box: 10 + rand() * 46,
          ph: rand() * 6.28,
          jx: 0.4 + rand() * 0.8,
          jy: 0.4 + rand() * 0.8,
          blink: rand(),
        });
      }
      clusters.push({ start, end: nodes.length });
    }
    // edges: dense within clusters + a few long links
    const edges = [];
    clusters.forEach(({ start, end }) => {
      for (let i = start; i < end; i++)
        for (let j = i + 1; j < end; j++)
          if (rand() < 0.5) edges.push([i, j]);
    });
    for (let k = 0; k < 8; k++) edges.push([Math.floor(rand() * nodes.length), Math.floor(rand() * nodes.length)]);

    // transient nodes spawned during the "enter" densify
    const extra = [];

    const resize = () => {
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // ---- movement inputs ----
    let px = 0, py = 0, haveP = false;
    const onPointer = (e) => {
      const t = e.touches ? e.touches[0] : e;
      if (haveP) {
        const d = Math.hypot(t.clientX - px, t.clientY - py);
        motionRef.current = Math.min(1, motionRef.current + d / 260);
      }
      px = t.clientX; py = t.clientY; haveP = true;
    };
    let go = null;
    const onOrient = (e) => {
      if (e.gamma == null) return;
      if (go) {
        const d = Math.abs(e.gamma - go.g) + Math.abs((e.beta || 0) - go.b);
        motionRef.current = Math.min(1, motionRef.current + d / 40);
      }
      go = { g: e.gamma, b: e.beta || 0 };
    };
    window.addEventListener("pointermove", onPointer);
    window.addEventListener("deviceorientation", onOrient, true);

    const RED = "229,36,28";
    let raf = 0, t = 0, last = performance.now();

    const pos = (n, energy, spawnBoost) => {
      const jit = (0.006 + energy * 0.05) * (1 + spawnBoost * 2);
      const x = (n.bx + Math.sin(t * 1.3 + n.ph) * n.jx * jit) * W;
      const y = (n.by + Math.cos(t * 1.1 + n.ph) * n.jy * jit) * H;
      return [x, y];
    };

    const draw = () => {
      const now = performance.now();
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now; t += dt;

      const idle = 0.04 + Math.abs(Math.sin(t * 0.7)) * 0.05;
      const level = Math.max(idle, levelRef?.current ?? 0);
      motionRef.current *= 0.9; // decay
      const energy = Math.min(1, level + motionRef.current * 0.8);

      // enter progress
      if (entering) enterRef.current = Math.min(1, enterRef.current + dt / 1.1);
      const ep = enterRef.current;
      const spawnBoost = ep;

      // grow transient nodes as we enter
      const targetExtra = Math.floor(ep * ep * 240);
      while (extra.length < targetExtra) {
        const anchor = nodes[Math.floor(Math.random() * nodes.length)];
        extra.push({
          bx: anchor.bx + (Math.random() - 0.5) * 0.5,
          by: anchor.by + (Math.random() - 0.5) * 0.5,
          box: 6 + Math.random() * 40,
          ph: Math.random() * 6.28,
          jx: 0.6 + Math.random(), jy: 0.6 + Math.random(),
          link: Math.floor(Math.random() * nodes.length),
        });
      }

      // paper bg
      ctx.fillStyle = "#ece7e3";
      ctx.fillRect(0, 0, W, H);

      // dashed crosshair grid
      ctx.save();
      ctx.setLineDash([3, 6]);
      ctx.strokeStyle = `rgba(${RED},0.4)`;
      ctx.lineWidth = 1;
      [0.28, 0.62].forEach((f) => { ctx.beginPath(); ctx.moveTo(0, H * f); ctx.lineTo(W, H * f); ctx.stroke(); });
      [0.32, 0.78].forEach((f) => { ctx.beginPath(); ctx.moveTo(W * f, 0); ctx.lineTo(W * f, H); ctx.stroke(); });
      ctx.restore();

      // edges
      ctx.lineWidth = 0.7;
      edges.forEach(([a, b]) => {
        const [x1, y1] = pos(nodes[a], energy, spawnBoost);
        const [x2, y2] = pos(nodes[b], energy, spawnBoost);
        ctx.strokeStyle = `rgba(${RED},${0.35 + energy * 0.5})`;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      });

      // base nodes: box + dot, blinking with noise
      nodes.forEach((n) => {
        const [x, y] = pos(n, energy, spawnBoost);
        const blink = 0.35 + (0.4 + energy * 0.6) * (0.6 + Math.sin(t * 3 + n.blink * 9) * 0.4);
        const s = n.box * (1 + spawnBoost * 0.6);
        ctx.strokeStyle = `rgba(${RED},${Math.min(1, blink * 0.8)})`;
        ctx.lineWidth = 0.9;
        ctx.strokeRect(x - s / 2, y - s / 2, s, s);
        ctx.fillStyle = `rgba(${RED},${Math.min(1, blink)})`;
        ctx.beginPath(); ctx.arc(x, y, 2, 0, 6.28); ctx.fill();
      });

      // transient nodes during enter
      if (extra.length) {
        ctx.strokeStyle = `rgba(${RED},${0.5 * ep})`;
        ctx.lineWidth = 0.6;
        extra.forEach((n) => {
          const x = (n.bx + Math.sin(t * 2 + n.ph) * n.jx * 0.05) * W;
          const y = (n.by + Math.cos(t * 1.7 + n.ph) * n.jy * 0.05) * H;
          const [lx, ly] = pos(nodes[n.link], energy, spawnBoost);
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(lx, ly); ctx.stroke();
          ctx.strokeRect(x - n.box / 2, y - n.box / 2, n.box, n.box);
          ctx.fillStyle = `rgba(${RED},${ep})`;
          ctx.beginPath(); ctx.arc(x, y, 1.6, 0, 6.28); ctx.fill();
        });
      }

      // swallow to black in the back third of the transition
      if (ep > 0.55) {
        const k = (ep - 0.55) / 0.45;
        ctx.fillStyle = `rgba(5,6,7,${Math.min(1, k)})`;
        ctx.fillRect(0, 0, W, H);
        if (k >= 0.98 && !blackFiredRef.current) {
          blackFiredRef.current = true;
          onBlack?.();
        }
      }

      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("deviceorientation", onOrient, true);
    };
  }, [entering, levelRef, onBlack]);

  return <canvas ref={canvasRef} className="cover-field" aria-hidden="true" />;
}

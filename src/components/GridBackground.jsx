import { useMemo } from "react";

/* deterministic pseudo-random so the constellation is stable per `seed` */
function rng(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

/**
 * GridBackground — the poster's technical scaffold: a dashed crosshair
 * grid with a scattered constellation of little squares, node dots and
 * connecting lines, each tagged with a monospace coordinate.
 */
export function GridBackground({ seed = 7, color = "var(--ink)", nodes = 12, links = true }) {
  const W = 480;
  const H = 900;

  const points = useMemo(() => {
    const rand = rng(seed * 97 + 13);
    return Array.from({ length: nodes }, () => {
      const x = 30 + rand() * (W - 60);
      const y = 40 + rand() * (H - 80);
      const box = 14 + rand() * 40;
      const cx = Math.round((x / W) * 800);
      const cy = Math.round((y / H) * 1600);
      return { x, y, box, label: `${cx},${cy}` };
    });
  }, [seed, nodes]);

  const edges = useMemo(() => {
    if (!links) return [];
    const rand = rng(seed * 31 + 5);
    const out = [];
    points.forEach((p, i) => {
      const n = 1 + Math.floor(rand() * 2);
      for (let k = 0; k < n; k++) {
        const j = Math.floor(rand() * points.length);
        if (j !== i) out.push([p, points[j]]);
      }
    });
    return out;
  }, [points, links, seed]);

  return (
    <svg
      className="grid-bg"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      style={{ color }}
    >
      {/* dashed crosshair grid */}
      <g stroke="currentColor" strokeWidth="1" strokeDasharray="3 6" opacity="0.5">
        <line x1="0" y1={H * 0.28} x2={W} y2={H * 0.28} />
        <line x1="0" y1={H * 0.62} x2={W} y2={H * 0.62} />
        <line x1={W * 0.32} y1="0" x2={W * 0.32} y2={H} />
        <line x1={W * 0.78} y1="0" x2={W * 0.78} y2={H} />
      </g>

      {/* connecting lines */}
      <g stroke="currentColor" strokeWidth="0.6" opacity="0.55">
        {edges.map(([a, b], i) => (
          <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
        ))}
      </g>

      {/* nodes: square + dot + coordinate */}
      <g>
        {points.map((p, i) => (
          <g key={i}>
            <rect
              x={p.x - p.box / 2}
              y={p.y - p.box / 2}
              width={p.box}
              height={p.box}
              fill="none"
              stroke="currentColor"
              strokeWidth="0.8"
              opacity="0.55"
            />
            <circle cx={p.x} cy={p.y} r="2" fill="currentColor" />
            <text
              x={p.x + p.box / 2 + 4}
              y={p.y + 3}
              fontFamily="var(--mono)"
              fontSize="7"
              fill="currentColor"
              opacity="0.55"
            >
              {p.label}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}

import { useMemo } from "react";
import { motion } from "framer-motion";
import { themeFor, THEME_SEEDS } from "../data/lab";

/* ============================================================
   WoodWideWeb — the finale. Every specimen is a node in a living
   mycelial network; roots grow between people who share instincts
   (tension answers), rhythm (shake) or material (idea theme).
   Organic curved edges + staggered growth animation.
   ============================================================ */

function themeIndex(key) {
  return Math.max(0, THEME_SEEDS.findIndex((t) => t.key === key));
}
function tensionShared(a = [], b = []) {
  const n = Math.min(a.length, b.length);
  let s = 0;
  for (let i = 0; i < n; i++) if (a[i] === b[i]) s++;
  return s;
}

export function WoodWideWeb({ people, meId, dark = false }) {
  const W = 460;
  const H = 460;
  const cx = W / 2;
  const cy = H / 2;

  const nodes = useMemo(() => {
    const list = people.filter(Boolean);
    // cluster by theme into angular sectors, spiral outwards within
    const perTheme = {};
    return list.map((p) => {
      const key = themeFor(`${p.idea} ${p.tech}`).key;
      perTheme[key] = (perTheme[key] || 0) + 1;
      const ti = themeIndex(key);
      const base = (ti / THEME_SEEDS.length) * Math.PI * 2;
      const k = perTheme[key];
      const ang = base + (k * 2.399) % (Math.PI / 1.6) - Math.PI / 3.2;
      const rad = 70 + ((k * 47) % 130);
      return {
        ...p,
        key,
        x: cx + Math.cos(ang) * rad,
        y: cy + Math.sin(ang) * rad,
        me: p.id === meId,
      };
    });
  }, [people, meId, cx, cy]);

  const edges = useMemo(() => {
    const out = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        let w = 0;
        let kind = "";
        if (a.key === b.key) { w = 0.6; kind = "theme"; }
        if (a.shake != null && b.shake != null && Math.abs(a.shake - b.shake) < 1.4) { w = 1; kind = "rhythm"; }
        if (tensionShared(a.answers, b.answers) >= 3) { w = 1.2; kind = "instinct"; }
        if (w > 0) out.push({ a, b, w, kind, mine: a.me || b.me });
      }
    }
    // cap density: keep strongest ~3 per node
    const perNode = {};
    return out
      .sort((x, y) => y.w - x.w)
      .filter((e) => {
        perNode[e.a.id] = (perNode[e.a.id] || 0) + 1;
        perNode[e.b.id] = (perNode[e.b.id] || 0) + 1;
        return e.mine || (perNode[e.a.id] <= 3 && perNode[e.b.id] <= 3);
      });
  }, [nodes]);

  const stroke = dark ? "rgba(30,234,219,0.55)" : "rgba(10,10,10,0.4)";
  const strokeMine = "var(--red)";
  const label = dark ? "rgba(247,245,243,0.85)" : "var(--ink)";

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="woodweb" role="img" aria-label="Wood Wide Web network">
      <defs>
        <radialGradient id="wwCore" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={dark ? "rgba(30,234,219,0.18)" : "rgba(229,36,28,0.10)"} />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={200} fill="url(#wwCore)" />

      {/* mycelial roots */}
      <g>
        {edges.map((e, i) => {
          const mx = (e.a.x + e.b.x) / 2 + (e.a.y - e.b.y) * 0.14;
          const my = (e.a.y + e.b.y) / 2 + (e.b.x - e.a.x) * 0.14;
          const d = `M ${e.a.x} ${e.a.y} Q ${mx} ${my} ${e.b.x} ${e.b.y}`;
          return (
            <motion.path
              key={i}
              d={d}
              fill="none"
              stroke={e.mine ? strokeMine : stroke}
              strokeWidth={e.mine ? 1.4 : e.w * 0.8}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.1, delay: 0.2 + i * 0.03, ease: "easeInOut" }}
            />
          );
        })}
      </g>

      {/* nodes */}
      <g>
        {nodes.map((n, i) => (
          <motion.g
            key={n.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 + i * 0.05, type: "spring", stiffness: 260, damping: 18 }}
          >
            {n.me && (
              <motion.circle
                cx={n.x} cy={n.y} r={7} fill="none" stroke={strokeMine} strokeWidth="1.5"
                animate={{ r: [7, 16], opacity: [0.9, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
              />
            )}
            <circle
              cx={n.x}
              cy={n.y}
              r={n.me ? 6 : 4}
              fill={n.me ? "var(--red)" : (dark ? "#f7f5f3" : n.color || "#0a0a0a")}
            />
            <text
              x={n.x + 8}
              y={n.y + 3}
              fontFamily="var(--mono)"
              fontSize={n.me ? 10 : 8}
              fontWeight={n.me ? 700 : 400}
              fill={n.me ? strokeMine : label}
              opacity={n.me ? 1 : 0.75}
            >
              {n.name}
            </text>
          </motion.g>
        ))}
      </g>
    </svg>
  );
}

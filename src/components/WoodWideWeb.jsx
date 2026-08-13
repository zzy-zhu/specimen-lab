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
/* instinct thread: most of the tensions they both answered agree.
   Relative, so it works for a 3-question night and a 4-question one. */
function sameInstincts(a, b) {
  const n = Math.min(a.answers?.length || 0, b.answers?.length || 0);
  if (n < 2) return false;
  // 2 of 3 on a short night, 3 of 4 on a long one
  return tensionShared(a.answers, b.answers) >= Math.max(2, Math.ceil(n * 0.66));
}
const isTwin = (a, b) => a.twin?.id === b.id || b.twin?.id === a.id;

/* what threads a specimen to the rest of the room, strongest first.
   Shared by the map's list and the graph so they never disagree. */
export function connectionsFor(people, meId) {
  const me = people.find((p) => p.id === meId);
  if (!me) return [];
  return people
    .filter((p) => p.id !== meId)
    .map((p) => {
      if (isTwin(me, p)) return { person: p, kind: "twin", label: "creative twin", w: 3 };
      if (sameInstincts(me, p)) return { person: p, kind: "instinct", label: "same instincts", w: 2 };
      if (me.shake != null && p.shake != null && Math.abs(me.shake - p.shake) < 1.4)
        return { person: p, kind: "rhythm", label: "same rhythm", w: 1.5 };
      const mine = themeFor(`${me.idea} ${me.tech} ${me.dream}`).key;
      if (themeFor(`${p.idea} ${p.tech} ${p.dream}`).key === mine && (p.dream || p.idea))
        return { person: p, kind: "theme", label: "making something adjacent", w: 1 };
      return null;
    })
    .filter(Boolean)
    .sort((a, b) => b.w - a.w);
}

export function WoodWideWeb({ people, meId, dark = false, onNodeTap }) {
  const W = 460;
  const H = 460;
  const cx = W / 2;
  const cy = H / 2;

  const nodes = useMemo(() => {
    const list = people.filter((p) => p && p.id && p.name);
    // cluster by theme into angular sectors, spiral outwards within
    const perTheme = {};
    return list.map((p) => {
      const key = themeFor(`${p.idea} ${p.tech} ${p.dream}`).key;
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
        if (a.key === b.key && (a.dream || a.idea) && (b.dream || b.idea)) { w = 0.6; kind = "theme"; }
        if (a.shake != null && b.shake != null && Math.abs(a.shake - b.shake) < 1.4) { w = 1; kind = "rhythm"; }
        if (sameInstincts(a, b)) { w = 1.2; kind = "instinct"; }
        if (isTwin(a, b)) { w = 2; kind = "twin"; } // the host's pairing — the strongest thread
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
        return e.kind === "twin" || e.mine || (perNode[e.a.id] <= 3 && perNode[e.b.id] <= 3);
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
              stroke={e.mine || e.kind === "twin" ? strokeMine : stroke}
              strokeWidth={e.kind === "twin" ? 1.6 : e.mine ? 1.4 : e.w * 0.8}
              strokeDasharray={e.kind === "twin" ? "4 3" : undefined}
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
            onClick={onNodeTap ? () => onNodeTap(n) : undefined}
            style={onNodeTap ? { cursor: "pointer" } : undefined}
          >
            {onNodeTap && <circle cx={n.x} cy={n.y} r={16} fill="transparent" />}
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

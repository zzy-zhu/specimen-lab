import { useMemo } from "react";
import { PARTICIPANTS, THEME_SEEDS, themeFor } from "../data/lab";

function rng(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

/**
 * IdeaMap — an AI-clustered "living idea map". Every participant's idea
 * is placed near its theme cluster; the current user's idea glows red.
 * (Clustering here is keyword-based; a live version would embed the text.)
 */
export function IdeaMap({ myIdea, myTech, myName }) {
  const W = 440;
  const H = 440;

  // cluster anchor positions (four quadrants)
  const anchors = {
    matter: { x: W * 0.28, y: H * 0.3 },
    signal: { x: W * 0.72, y: H * 0.28 },
    motion: { x: W * 0.3, y: H * 0.72 },
    image: { x: W * 0.72, y: H * 0.72 },
  };

  const items = useMemo(() => {
    const rand = rng(42);
    const all = PARTICIPANTS.map((p) => {
      const theme = themeFor(`${p.idea} ${p.tech}`);
      const a = anchors[theme.key];
      return {
        name: p.name,
        theme,
        x: a.x + (rand() - 0.5) * 130,
        y: a.y + (rand() - 0.5) * 130,
        mine: false,
      };
    });
    if (myIdea || myTech) {
      const theme = themeFor(`${myIdea} ${myTech}`);
      const a = anchors[theme.key];
      all.push({
        name: myName || "You",
        theme,
        x: a.x + (rand() - 0.5) * 60,
        y: a.y + (rand() - 0.5) * 60,
        mine: true,
      });
    }
    return all;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myIdea, myTech, myName]);

  const myTheme = myIdea || myTech ? themeFor(`${myIdea} ${myTech}`) : null;

  return (
    <div className="ideamap">
      <svg viewBox={`0 0 ${W} ${H}`} className="ideamap__svg">
        {/* faint links within clusters */}
        <g stroke="var(--ink)" strokeWidth="0.5" opacity="0.25">
          {items.map((a, i) =>
            items
              .filter((b, j) => j > i && b.theme.key === a.theme.key)
              .map((b, j) => (
                <line key={`${i}-${j}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
              ))
          )}
        </g>

        {/* cluster labels */}
        {THEME_SEEDS.map((t) => {
          const a = anchors[t.key];
          return (
            <text
              key={t.key}
              x={a.x}
              y={a.y - 74}
              textAnchor="middle"
              fontFamily="var(--mono)"
              fontSize="10"
              letterSpacing="1"
              fill="var(--ink)"
              opacity="0.6"
            >
              {t.label.toUpperCase()}
            </text>
          );
        })}

        {/* nodes */}
        {items.map((it, i) => (
          <g key={i}>
            <circle
              cx={it.x}
              cy={it.y}
              r={it.mine ? 6 : 4}
              fill={it.mine ? "var(--red)" : "var(--ink)"}
              opacity={it.mine ? 1 : 0.75}
            />
            {it.mine && (
              <circle
                cx={it.x}
                cy={it.y}
                r="12"
                fill="none"
                stroke="var(--red)"
                strokeWidth="1"
                className="ideamap__pulse"
              />
            )}
            <text
              x={it.x + (it.mine ? 10 : 7)}
              y={it.y + 3}
              fontFamily="var(--mono)"
              fontSize={it.mine ? 10 : 8}
              fontWeight={it.mine ? 700 : 400}
              fill={it.mine ? "var(--red)" : "var(--ink)"}
              opacity={it.mine ? 1 : 0.7}
            >
              {it.name}
            </text>
          </g>
        ))}
      </svg>

      {myTheme && (
        <p className="ideamap__note">
          <span className="mono" style={{ color: "var(--red)" }}>
            ✦ your idea clustered into “{myTheme.label}”
          </span>
          <br />
          neighbors are exploring adjacent materials — go find them.
        </p>
      )}
    </div>
  );
}

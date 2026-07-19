import { useMemo } from "react";

/* ============================================================
   LiveSwarm — the room as a petri dish of moving headshots.
   Each specimen's position streams from their phone accelerometer
   (specimen.live). Specimens without a live position get a stable
   pseudo-random spot so the field is never empty.
   ============================================================ */
function hashPos(id) {
  const s = String(id || "");
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  const x = ((h >>> 3) % 1000) / 1000;
  const y = ((h >>> 13) % 1000) / 1000;
  return { x: 0.08 + x * 0.84, y: 0.1 + y * 0.8 };
}

export function LiveSwarm({ people, meId }) {
  const dots = useMemo(
    () =>
      people.filter((p) => p && p.id && p.name).map((p) => {
        const live = p.live;
        const base = hashPos(p.id);
        return {
          id: p.id,
          name: p.name,
          image: p.image,
          color: p.color || "#e5241c",
          me: p.id === meId,
          x: live?.x ?? base.x,
          y: live?.y ?? base.y,
          hot: (live?.m ?? 0) > 0.2,
          moving: !!live,
        };
      }),
    [people, meId]
  );

  return (
    <div className="swarm">
      {dots.map((d) => (
        <div
          key={d.id}
          className={`swarm__dot ${d.hot ? "hot" : ""} ${d.moving ? "moving" : "idle"}`}
          style={{ left: `${d.x * 100}%`, top: `${d.y * 100}%`, "--c": d.color }}
          title={d.name}
        >
          <div className="swarm__head">
            {d.image ? <img src={d.image} alt="" /> : <span>{d.name?.[0] || "?"}</span>}
          </div>
          <span className="swarm__name mono">{d.name}</span>
        </div>
      ))}
      <span className="swarm__hint mono">tilt your phone — your specimen drifts</span>
    </div>
  );
}

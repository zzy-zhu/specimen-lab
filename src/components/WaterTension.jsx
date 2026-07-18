/* ============================================================
   WaterTension — hold your phone like a glass of water.
   Tilt and the water pools to that side; the side it pools to is
   your answer. Big, minimal, physical.
   `tilt` is normalized [-1,1]. `q` = { glyph, prompt, left, right }.
   ============================================================ */
export function WaterTension({ q, tilt, locked }) {
  const live = tilt < -0.12 ? "left" : tilt > 0.12 ? "right" : "none";
  const side = locked != null ? (locked === 0 ? "left" : "right") : live;
  const k = 36; // surface tilt amplitude
  const leftY = 50 + k * tilt;
  const rightY = 50 - k * tilt;

  return (
    <div className="water">
      <div className="water__q">
        <span className="water__glyph">{q.glyph}</span>
        <h1 className="water__prompt">{q.prompt}</h1>
      </div>

      <div className="water__options">
        <span className={`water__opt ${side === "left" ? "on" : ""}`}>{q.left}</span>
        <span className={`water__opt water__opt--r ${side === "right" ? "on" : ""}`}>{q.right}</span>
      </div>

      <div className="water__tank" data-side={side}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="water__svg">
          <defs>
            <linearGradient id="wt" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff3b32" />
              <stop offset="100%" stopColor="#b81812" />
            </linearGradient>
          </defs>
          <polygon
            points={`0,${leftY} 100,${rightY} 100,100 0,100`}
            fill="url(#wt)"
            style={{ transition: "all 0.12s linear" }}
          />
          {/* surface shimmer line */}
          <line x1="0" y1={leftY} x2="100" y2={rightY} stroke="rgba(255,255,255,0.6)" strokeWidth="0.8" style={{ transition: "all 0.12s linear" }} />
        </svg>
        <span className="water__lean mono">
          {locked != null
            ? "✓ locked"
            : side === "none" ? "tilt to lean" : side === "left" ? "◀ leaning " + q.left : "leaning " + q.right + " ▶"}
        </span>
      </div>
    </div>
  );
}

/**
 * TiltMeter — the "water level" for a tension question. A liquid fill
 * slides left/right with the phone tilt; the leaning side lights up.
 * `tilt` is normalized [-1,1].
 */
export function TiltMeter({ tilt, left, right }) {
  const pct = ((tilt + 1) / 2) * 100; // 0..100, 50 = neutral
  const leaning = tilt < -0.12 ? "left" : tilt > 0.12 ? "right" : "none";

  return (
    <div className="tiltmeter">
      <div className="tiltmeter__labels">
        <span className={leaning === "left" ? "on" : ""}>◀ {left}</span>
        <span className={leaning === "right" ? "on" : ""}>{right} ▶</span>
      </div>

      <div className="tiltmeter__vial" data-leaning={leaning}>
        {/* the liquid: a gradient that shifts toward the leaning side */}
        <div
          className="tiltmeter__liquid"
          style={{
            background: `linear-gradient(90deg,
              var(--red) 0%,
              var(--red) ${pct}%,
              var(--paper-dim) ${pct}%,
              var(--paper-dim) 100%)`,
          }}
        />
        <div className="tiltmeter__center" />
        <div
          className="tiltmeter__bubble"
          style={{ left: `calc(${pct}% )` }}
        >
          <span className="mono">{Math.round(pct)}</span>
        </div>
      </div>

      <p className="tiltmeter__hint mono">
        {leaning === "none"
          ? "tilt your phone to lean"
          : `leaning ${leaning} — hold to lock`}
      </p>
    </div>
  );
}

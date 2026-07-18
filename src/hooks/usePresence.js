import { useEffect, useRef } from "react";
import { publishPosition } from "../lib/store";

/**
 * usePresence — publishes the current specimen's live position to RTDB so
 * the monitor can show their headshot moving. Driven by device orientation
 * (tilt) on phones, pointer on desktop. Position is a normalized [0,1] point;
 * tilt nudges a velocity so the headshot drifts as you move the phone.
 */
export function usePresence(meId, active = true) {
  const pos = useRef({ x: 0.5, y: 0.5 });
  const vel = useRef({ x: 0, y: 0 });
  const motion = useRef(0);

  useEffect(() => {
    if (!meId || !active) return;

    const onOrient = (e) => {
      if (e.gamma == null) return;
      const gx = Math.max(-1, Math.min(1, e.gamma / 35)); // left/right
      const gy = Math.max(-1, Math.min(1, ((e.beta || 0) - 45) / 35)); // tilt fwd/back
      vel.current.x += gx * 0.0016;
      vel.current.y += gy * 0.0016;
      motion.current = Math.min(1, motion.current + (Math.abs(gx) + Math.abs(gy)) * 0.08);
    };
    let last = null;
    const onPointer = (e) => {
      const t = e.touches ? e.touches[0] : e;
      if (last) motion.current = Math.min(1, motion.current + Math.hypot(t.clientX - last.x, t.clientY - last.y) / 400);
      last = { x: t.clientX, y: t.clientY };
      pos.current.x = t.clientX / window.innerWidth;
      pos.current.y = t.clientY / window.innerHeight;
    };
    window.addEventListener("deviceorientation", onOrient, true);
    window.addEventListener("pointermove", onPointer);

    let raf = 0;
    const tick = () => {
      // integrate velocity with damping + soft walls
      vel.current.x *= 0.94; vel.current.y *= 0.94;
      pos.current.x = Math.max(0.04, Math.min(0.96, pos.current.x + vel.current.x));
      pos.current.y = Math.max(0.06, Math.min(0.94, pos.current.y + vel.current.y));
      motion.current *= 0.9;
      publishPosition(meId, +pos.current.x.toFixed(3), +pos.current.y.toFixed(3), +motion.current.toFixed(2));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("deviceorientation", onOrient, true);
      window.removeEventListener("pointermove", onPointer);
    };
  }, [meId, active]);
}

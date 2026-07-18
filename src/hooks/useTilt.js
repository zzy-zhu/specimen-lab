import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useTilt — reads left/right phone tilt from DeviceOrientation (gamma).
 * Returns a normalized tilt in [-1, 1]  (-1 = full left, +1 = full right)
 * plus permission state and a request() for iOS 13+ gated sensors.
 *
 * Desktop / no-sensor fallback: arrow keys nudge the tilt so the whole
 * flow is testable without a phone.
 */
const MAX_GAMMA = 22; // degrees mapped to full deflection — sensitive lean
const SMOOTH = 0.35; // low-pass smoothing toward the raw reading

export function useTilt(active) {
  const [tilt, setTilt] = useState(0);
  const [supported, setSupported] = useState(true);
  const [permission, setPermission] = useState("unknown"); // unknown | granted | denied
  const raw = useRef(0);

  const needsPermission =
    typeof DeviceOrientationEvent !== "undefined" &&
    typeof DeviceOrientationEvent.requestPermission === "function";

  const request = useCallback(async () => {
    if (!needsPermission) {
      setPermission("granted");
      return true;
    }
    try {
      const res = await DeviceOrientationEvent.requestPermission();
      setPermission(res === "granted" ? "granted" : "denied");
      return res === "granted";
    } catch {
      setPermission("denied");
      return false;
    }
  }, [needsPermission]);

  useEffect(() => {
    if (!active) return;
    if (needsPermission && permission !== "granted") return;

    let got = false;
    const onOrient = (e) => {
      if (e.gamma == null) return;
      got = true;
      raw.current = e.gamma;
      const n = Math.max(-1, Math.min(1, e.gamma / MAX_GAMMA));
      // low-pass smoothing for a steady, accurate lean
      setTilt((prev) => prev + (n - prev) * SMOOTH);
    };
    window.addEventListener("deviceorientation", onOrient, true);

    // if no orientation event arrives shortly, expose desktop fallback
    const probe = setTimeout(() => {
      if (!got) setSupported(false);
    }, 700);

    return () => {
      window.removeEventListener("deviceorientation", onOrient, true);
      clearTimeout(probe);
    };
  }, [active, needsPermission, permission]);

  // keyboard fallback for desktop testing
  useEffect(() => {
    if (!active || supported) return;
    const onKey = (e) => {
      if (e.key === "ArrowLeft") setTilt((t) => Math.max(-1, t - 0.34));
      if (e.key === "ArrowRight") setTilt((t) => Math.min(1, t + 0.34));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, supported]);

  const reset = useCallback(() => setTilt(0), []);

  return { tilt, supported, needsPermission, permission, request, reset, setTilt };
}

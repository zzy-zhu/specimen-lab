import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useShake — samples DeviceMotion acceleration and derives a "shake
 * signature": the average motion energy over a fixed capture window.
 * Returns live energy while recording plus a final score.
 *
 * Desktop / no-sensor fallback: rapidly tapping the SHAKE button (or the
 * spacebar) injects synthetic motion so the flow is testable without a phone.
 */
const WINDOW_MS = 10000; // 10-second capture

export function useShake() {
  const [energy, setEnergy] = useState(0); // live magnitude
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [score, setScore] = useState(null); // final signature 0..~12
  const [supported, setSupported] = useState(true);
  const [permission, setPermission] = useState("unknown");

  const samples = useRef([]);
  const startedAt = useRef(0);
  const rafRef = useRef(0);
  const gotMotion = useRef(false);

  const needsPermission =
    typeof DeviceMotionEvent !== "undefined" &&
    typeof DeviceMotionEvent.requestPermission === "function";

  const request = useCallback(async () => {
    if (!needsPermission) {
      setPermission("granted");
      return true;
    }
    try {
      const res = await DeviceMotionEvent.requestPermission();
      setPermission(res === "granted" ? "granted" : "denied");
      return res === "granted";
    } catch {
      setPermission("denied");
      return false;
    }
  }, [needsPermission]);

  useEffect(() => {
    const onMotion = (e) => {
      if (!recording) return;
      const a = e.accelerationIncludingGravity || e.acceleration;
      if (!a) return;
      gotMotion.current = true;
      const mag = Math.sqrt((a.x || 0) ** 2 + (a.y || 0) ** 2 + (a.z || 0) ** 2);
      // subtract ~gravity baseline, keep the motion component
      const m = Math.abs(mag - 9.8);
      samples.current.push(m);
      setEnergy(m);
    };
    window.addEventListener("devicemotion", onMotion, true);
    return () => window.removeEventListener("devicemotion", onMotion, true);
  }, [recording]);

  const start = useCallback(() => {
    samples.current = [];
    gotMotion.current = false;
    startedAt.current = performance.now();
    setScore(null);
    setElapsed(0);
    setRecording(true);
  }, []);

  // progress + finalize loop
  useEffect(() => {
    if (!recording) return;
    const tick = () => {
      const t = performance.now() - startedAt.current;
      setElapsed(Math.min(WINDOW_MS, t));
      if (t >= WINDOW_MS) {
        const arr = samples.current;
        const avg = arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;
        setScore(Math.round(avg * 100) / 100);
        setSupported(gotMotion.current || arr.length > 0);
        setRecording(false);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [recording]);

  // synthetic shake for desktop: call bump() on tap/space
  const bump = useCallback(() => {
    if (!recording) return;
    const m = 6 + Math.random() * 6;
    samples.current.push(m);
    setEnergy(m);
  }, [recording]);

  useEffect(() => {
    if (!recording) return;
    const onKey = (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        bump();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [recording, bump]);

  const progress = Math.min(1, elapsed / WINDOW_MS);
  const secondsLeft = Math.ceil((WINDOW_MS - elapsed) / 1000);

  return {
    energy,
    recording,
    progress,
    secondsLeft,
    score,
    supported,
    needsPermission,
    permission,
    request,
    start,
    bump,
  };
}

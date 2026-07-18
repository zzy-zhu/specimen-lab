import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useMic — listens to the room. Opens the microphone, runs an analyser,
 * and exposes a smoothed ambient loudness level in [0,1] plus a coarse
 * low/mid/high split. The mineral background reacts to this — squares
 * move and blink with the noise around the phone.
 *
 * Permission-gated; until granted (or if denied) it returns a gentle
 * autonomous "breathing" level so the scene is never dead.
 */
export function useMic() {
  const [listening, setListening] = useState(false);
  const [permission, setPermission] = useState("unknown"); // unknown|granted|denied
  const levelRef = useRef(0); // read this in rAF loops (no re-render churn)
  const bandsRef = useRef({ low: 0, mid: 0, high: 0 });
  const ctxRef = useRef(null);
  const rafRef = useRef(0);
  const streamRef = useRef(null);

  const request = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const Ctx = window.AudioContext || window.webkitAudioContext;
      const ctx = new Ctx();
      ctxRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.8;
      src.connect(analyser);
      const freq = new Uint8Array(analyser.frequencyBinCount);

      const loop = () => {
        analyser.getByteFrequencyData(freq);
        const n = freq.length;
        let sum = 0, low = 0, mid = 0, high = 0;
        for (let i = 0; i < n; i++) {
          const v = freq[i] / 255;
          sum += v;
          if (i < n * 0.15) low += v;
          else if (i < n * 0.5) mid += v;
          else high += v;
        }
        const raw = sum / n; // 0..1 average energy
        // ease toward raw, boosted a touch so speech registers
        levelRef.current += (Math.min(1, raw * 2.2) - levelRef.current) * 0.25;
        bandsRef.current = {
          low: low / (n * 0.15),
          mid: mid / (n * 0.35),
          high: high / (n * 0.5),
        };
        rafRef.current = requestAnimationFrame(loop);
      };
      loop();
      setPermission("granted");
      setListening(true);
      return true;
    } catch {
      setPermission("denied");
      return false;
    }
  }, []);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      ctxRef.current?.close?.();
    };
  }, []);

  return { listening, permission, request, levelRef, bandsRef };
}

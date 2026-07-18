import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Wordmark, FuturePixelMark } from "../components/Wordmark";
import { NoiseField } from "../components/NoiseField";
import { CoverField } from "../components/CoverField";
import { Typewriter } from "../components/Typewriter";
import { ScanToPhone } from "../components/ScanToPhone";
import { useAtmosphere } from "../lib/atmosphere";
import { useIsDesktop } from "../hooks/useIsDesktop";

const Q1 =
  "Biology has specimens.\nMuseums have specimens.\nLaboratories have specimens.\n\nToday,\nyour curiosity becomes one.";
const Q2 = "what's your specimen?";
const DURATION = 10000;

export function Cover() {
  const nav = useNavigate();
  const { levelRef, listening, request, setScene } = useAtmosphere();
  const desktop = useIsDesktop();
  const enterRef = useRef(0);
  const [phase, setPhase] = useState("idle"); // idle | q1 | q2 | out
  const rafRef = useRef(0);

  // laptop → show the noise backdrop + a scan QR; phone → the cover renders its own field
  useEffect(() => { setScene({ visible: desktop, tone: "cover" }); }, [setScene, desktop]);
  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const begin = useCallback(() => {
    if (phase !== "idle") return;
    setPhase("q1");
    const start = performance.now();
    const tick = () => {
      const p = Math.min(1, (performance.now() - start) / DURATION);
      enterRef.current = p;
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    setTimeout(() => setPhase("q2"), 6200);
    setTimeout(() => setPhase("out"), 8600);
    setTimeout(() => nav("/enter"), 9900);
  }, [phase, nav]);

  const onKey = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); begin(); } };
  const stop = (e) => e.stopPropagation();

  if (desktop) {
    return (
      <div className="screen screen--space" style={{ justifyContent: "center" }}>
        <ScanToPhone label="Specimen.lab is a phone experience" />
      </div>
    );
  }

  return (
    <div
      className="cover"
      onClick={begin}
      onKeyDown={onKey}
      role="button"
      tabIndex={0}
      aria-label="Enter Specimen.lab — tap anywhere"
    >
      <NoiseField levelRef={levelRef} enterRef={enterRef} intensity={1} />
      <CoverField levelRef={levelRef} enterRef={enterRef} />

      {/* idle overlay */}
      <AnimatePresence>
        {phase === "idle" && (
          <motion.div className="cover__overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }}>
            <div className="cover__top">
              <FuturePixelMark color="var(--white)" size={13} />
            </div>
            <div className="cover__center">
              <Wordmark size={54} stacked color="var(--white)" />
              <p className="cover__tag">A living archive of contamination, and creative mischief.</p>
            </div>
            <div className="cover__bottom">
              <span className="cover__hint mono">tap anywhere to enter →</span>
              <div className="cover__links" onClick={stop}>
                <button className="linklike mono" onClick={() => nav("/about")}>about</button>
                <button className={`listen mono ${listening ? "listen--on" : ""}`} onClick={() => request()}>
                  {listening ? "◉ listening" : "◌ let it listen"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* transition typewriter */}
      <AnimatePresence>
        {phase !== "idle" && phase !== "out" && (
          <motion.div className="cover__type" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
            {phase === "q1" && <Typewriter text={Q1} speed={52} startDelay={500} className="cover__q1" />}
            {phase === "q2" && <Typewriter text={Q2} speed={70} startDelay={100} className="cover__q2" />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

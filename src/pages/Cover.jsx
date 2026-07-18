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
import { hasSeenIntro, markIntroSeen } from "../lib/prefs";

const Q1 =
  "Biology has specimens.\nMuseums have specimens.\nLaboratories have specimens.\n\nToday,\nyour curiosity becomes one.";
const Q2 = "what's your specimen?";

/* pacing — deliberately slow; make them wait. bump RAMP_MS to stretch it. */
const RAMP_MS = 15000; // slow accumulation/zoom before the black push

export function Cover() {
  const nav = useNavigate();
  const { levelRef, listening, request, setScene } = useAtmosphere();
  const desktop = useIsDesktop();
  const enterRef = useRef(0);
  const [phase, setPhase] = useState("idle"); // idle|q1|q2|toblack|count|go
  const [count, setCount] = useState(3);
  const phaseRef = useRef("idle");
  const beginAt = useRef(0);
  const blackAt = useRef(0);
  const rafRef = useRef(0);
  const timers = useRef([]);

  const setP = (p) => { phaseRef.current = p; setPhase(p); };
  const later = (fn, ms) => { timers.current.push(setTimeout(fn, ms)); };

  useEffect(() => { setScene({ visible: desktop, tone: "cover" }); }, [setScene, desktop]);
  useEffect(() => () => { cancelAnimationFrame(rafRef.current); timers.current.forEach(clearTimeout); }, []);

  const begin = useCallback(() => {
    if (phaseRef.current !== "idle") return;
    // returning visitors skip the whole cinematic
    if (hasSeenIntro()) { nav("/enter"); return; }
    markIntroSeen();
    setP("q1");
    beginAt.current = performance.now();
    const tick = () => {
      const now = performance.now();
      if (phaseRef.current === "toblack" || phaseRef.current === "count" || phaseRef.current === "go") {
        if (!blackAt.current) blackAt.current = now;
        enterRef.current = Math.min(1, 0.82 + 0.18 * ((now - blackAt.current) / 1300));
      } else {
        enterRef.current = Math.min(0.82, (now - beginAt.current) / RAMP_MS);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [nav]);

  // sequence transitions driven by typewriter completion
  const q1Done = useCallback(() => later(() => setP("q2"), 1800), []);
  const q2Done = useCallback(() => later(() => {
    setP("toblack");
    later(() => {
      setP("count"); setCount(3);
      later(() => setCount(2), 1000);
      later(() => setCount(1), 2000);
      later(() => setP("go"), 3000);
      later(() => nav("/enter"), 4400);
    }, 2000); // silence in the black before counting
  }, 1600), [nav]);

  const onKey = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); begin(); } };
  const stop = (e) => e.stopPropagation();

  if (desktop) {
    return (
      <div className="screen screen--space" style={{ justifyContent: "center" }}>
        <ScanToPhone label="Specimen.lab is a phone experience" />
      </div>
    );
  }

  const inType = phase === "q1" || phase === "q2";
  const inCount = phase === "count" || phase === "go";

  return (
    <div className="cover" onClick={begin} onKeyDown={onKey} role="button" tabIndex={0} aria-label="Enter Specimen.lab — tap anywhere">
      <NoiseField levelRef={levelRef} enterRef={enterRef} intensity={1} />
      <CoverField levelRef={levelRef} enterRef={enterRef} />

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

      {/* slow typewriter */}
      <AnimatePresence>
        {inType && (
          <motion.div className="cover__type" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }}>
            {phase === "q1" && <Typewriter text={Q1} speed={82} startDelay={700} className="cover__q1" onDone={q1Done} />}
            {phase === "q2" && <Typewriter text={Q2} speed={105} startDelay={200} className="cover__q2" onDone={q2Done} />}
          </motion.div>
        )}
      </AnimatePresence>

      {/* black silence + countdown */}
      <AnimatePresence>
        {inCount && (
          <motion.div className="cover__count" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            {phase === "count" ? (
              <motion.span key={count} className="cover__num" initial={{ opacity: 0, scale: 1.3 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
                {count}
              </motion.span>
            ) : (
              <motion.span className="cover__go" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                entering experience now
              </motion.span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

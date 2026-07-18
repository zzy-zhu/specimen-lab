import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wordmark } from "./components/Wordmark";
import { GridBackground } from "./components/GridBackground";
import { NameCard } from "./components/NameCard";
import { FlipCard } from "./components/FlipCard";
import { TiltMeter } from "./components/TiltMeter";
import { useTilt } from "./hooks/useTilt";
import { useShake } from "./hooks/useShake";
import { QUESTIONS } from "./data/lab";
import { downscaleImage } from "./lib/image";

/* shared page-transition wrapper */
export const fade = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
};

/* ---------- chrome ---------- */
export function Chrome({ part, progress = [], children, bgSeed = 7, onBack }) {
  return (
    <motion.div className="screen" {...fade}>
      <GridBackground seed={bgSeed} nodes={10} />
      <div className="topbar">
        <button className="wordmark-btn" onClick={onBack} aria-label="home">
          <Wordmark size={17} stacked />
        </button>
        {part && <span className="eyebrow">{part}</span>}
      </div>
      {progress.length > 0 && (
        <div className="progress" style={{ marginBottom: 22 }}>
          {progress.map((on, i) => (
            <i key={i} className={on ? "on" : ""} />
          ))}
        </div>
      )}
      {children}
    </motion.div>
  );
}

/* ========================================================= */
/* CREATE SPECIMEN — name + handle + passcode + image        */
/* ========================================================= */
export function CreateSpecimen({ onCreate, onBack, existing, cta = "Enter →" }) {
  const [name, setName] = useState(existing?.name || "");
  const [image, setImage] = useState(existing?.image || null);
  const camRef = useRef(null);
  const upRef = useRef(null);

  const readFile = (file) => {
    if (!file) return;
    const r = new FileReader();
    r.onload = async () => setImage(await downscaleImage(r.result));
    r.readAsDataURL(file);
  };

  const ready = name.trim().length > 0;

  return (
    <Chrome part="SPECIMEN.lab" progress={[]} bgSeed={5} onBack={onBack}>
      <span className="step-tag">BECOME A SPECIMEN</span>
      <h1 className="display" style={{ marginTop: 12, fontSize: "clamp(40px,13vw,60px)" }}>
        You,<br />on file
      </h1>

      <div className="center-col" style={{ marginTop: 26, gap: 18 }}>
        <div className="specimen-avatar specimen-avatar--big" onClick={() => camRef.current?.click()}>
          {image ? <img src={image} alt="your specimen" /> : <span className="mono">tap to<br />take selfie</span>}
          <div className="specimen-avatar__frame" />
        </div>
        <button className="linklike mono" onClick={() => upRef.current?.click()}>or upload a photo</button>
      </div>

      <input ref={camRef} className="hidden-input" type="file" accept="image/*" capture="user" onChange={(e) => readFile(e.target.files?.[0])} />
      <input ref={upRef} className="hidden-input" type="file" accept="image/*" onChange={(e) => readFile(e.target.files?.[0])} />

      <label className="stack gap-8" style={{ marginTop: 24 }}>
        <span className="eyebrow">YOUR NAME</span>
        <input className="field field--big" placeholder="what should we call you?" value={name} maxLength={24} onChange={(e) => setName(e.target.value)} />
      </label>

      <div className="footer-actions">
        <button className="btn btn-primary" disabled={!ready} onClick={() => onCreate({ name: name.trim(), image })}>
          {cta}
        </button>
      </div>
    </Chrome>
  );
}

/* ========================================================= */
/* TENSION — 4 tilt questions with live results              */
/* ========================================================= */
export function Tension({ pool, onDone, onBack }) {
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState("answering");
  const [answers, setAnswers] = useState([]);
  const tilt = useTilt(phase === "answering");
  const q = QUESTIONS[idx];
  const gate = tilt.needsPermission && tilt.permission !== "granted" ? "permission" : "ok";

  const lock = () => {
    setAnswers((a) => [...a, tilt.tilt < 0 ? 0 : 1]);
    setPhase("result");
  };
  const next = () => {
    tilt.reset();
    if (idx + 1 >= QUESTIONS.length) onDone([...answers]);
    else { setIdx((i) => i + 1); setPhase("answering"); }
  };

  const myChoice = answers[idx];
  const votesRight = pool.filter((p) => p.answers?.[idx] === 1).length + (myChoice === 1 ? 1 : 0);
  const total = pool.length + 1;
  const rightPct = Math.round((votesRight / total) * 100);
  const leftPct = 100 - rightPct;

  return (
    <Chrome part="PART 01 · CREATIVE TENSION" progress={[true, true, true, false]} bgSeed={11 + idx} onBack={onBack}>
      <div className="tension-head">
        <span className="step-tag">QUESTION {String(idx + 1).padStart(2, "0")} / {String(QUESTIONS.length).padStart(2, "0")}</span>
        <span className="q-glyph">{q.glyph}</span>
      </div>
      <h1 className="display" style={{ fontSize: "clamp(28px,8vw,40px)", marginTop: 8 }}>{q.prompt}</h1>

      {gate === "permission" ? (
        <div className="grow center-col" style={{ justifyContent: "center", gap: 16 }}>
          <p className="lede" style={{ textAlign: "center" }}>This uses your phone's tilt. Grant motion access to lean.</p>
          <button className="btn btn-dark" onClick={tilt.request} style={{ width: "auto" }}>Enable motion sensor</button>
        </div>
      ) : phase === "answering" ? (
        <>
          <div className="grow" style={{ display: "flex", alignItems: "center" }}>
            <TiltMeter tilt={tilt.tilt} left={q.left} right={q.right} />
          </div>
          <div className="footer-actions">
            <button className="btn btn-primary" disabled={Math.abs(tilt.tilt) < 0.12} onClick={lock}>Lock in my lean →</button>
            {!tilt.supported && <span className="mono" style={{ opacity: 0.5, textAlign: "center" }}>no sensor? use ← / → arrow keys</span>}
          </div>
        </>
      ) : (
        <div className="grow" style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 20 }}>
          <span className="eyebrow">LIVE — THE ROOM RIGHT NOW</span>
          <ResultBar left={q.left} right={q.right} leftPct={leftPct} rightPct={rightPct} myChoice={myChoice} />
          <div className="footer-actions" style={{ marginTop: 8 }}>
            <button className="btn btn-primary" onClick={next}>{idx + 1 >= QUESTIONS.length ? "Find my creative twin →" : "Next tension →"}</button>
          </div>
        </div>
      )}
    </Chrome>
  );
}

function ResultBar({ left, right, leftPct, rightPct, myChoice }) {
  return (
    <div className="resultbar">
      <div className="resultbar__row">
        <span className={myChoice === 0 ? "on" : ""}>{left} {myChoice === 0 && "· you"}</span>
        <span className={myChoice === 1 ? "on" : ""}>{myChoice === 1 && "you · "}{right}</span>
      </div>
      <div className="resultbar__track">
        <motion.div className="resultbar__fill" initial={{ width: "50%" }} animate={{ width: `${leftPct}%` }} transition={{ duration: 0.6 }}>
          <span>{leftPct}%</span>
        </motion.div>
        <motion.div className="resultbar__fill resultbar__fill--r" initial={{ width: "50%" }} animate={{ width: `${rightPct}%` }} transition={{ duration: 0.6 }}>
          <span>{rightPct}%</span>
        </motion.div>
      </div>
    </div>
  );
}

/* ========================================================= */
/* TWIN                                                      */
/* ========================================================= */
export function Twin({ twin, shared, total, reason, onHome, onBack }) {
  return (
    <Chrome part="PART 01 · CREATIVE TENSION" progress={[true, true, true, true]} bgSeed={21} onBack={onBack}>
      <span className="step-tag">STEP 04 — REVEAL YOUR CREATIVE TWIN</span>
      <h1 className="display" style={{ marginTop: 10 }}>Same<br />instincts</h1>
      <p className="lede" style={{ marginTop: 10 }}>
        AI scanned the room and matched your instincts — {shared}/{total} tensions aligned.
      </p>
      <div style={{ marginTop: 22 }}>
        <FlipCard
          person={twin}
          image={twin?.image}
          variant="twin"
          reason={reason || `“${twin?.idea || "still forming an idea"}” — go say hello.`}
        />
      </div>
      <div className="footer-actions">
        <button className="btn btn-primary" onClick={onHome}>Done — back to the menu →</button>
        <span className="mono" style={{ opacity: 0.5, textAlign: "center" }}>tap the card to flip it</span>
      </div>
    </Chrome>
  );
}

/* ========================================================= */
/* CAPTURE IDEA                                              */
/* ========================================================= */
const TECH_CHIPS = ["Spatial audio", "Robotics", "Mycelium", "Wearables", "Ceramic printing", "Generative video", "Biofabrication"];

export function CaptureIdea({ existing, onDone, onBack }) {
  const [idea, setIdea] = useState(existing?.idea || "");
  const [tech, setTech] = useState(existing?.tech || "");
  const ready = idea.trim().length > 2 && tech.trim().length > 1;
  return (
    <Chrome part="PART 02 · OPEN LAB" progress={[true, false, false]} bgSeed={41} onBack={onBack}>
      <span className="step-tag">STEP 01 — CAPTURE A LIVING IDEA</span>
      <h1 className="display" style={{ fontSize: "clamp(30px,9vw,44px)", marginTop: 10 }}>What are<br />you<br />exploring?</h1>
      <label className="stack gap-8" style={{ marginTop: 20 }}>
        <span className="eyebrow">ONE IDEA YOU'RE CHASING</span>
        <textarea className="field" rows={3} style={{ resize: "none" }} placeholder="something you're exploring — or would love to." value={idea} maxLength={140} onChange={(e) => setIdea(e.target.value)} />
      </label>
      <label className="stack gap-8" style={{ marginTop: 16 }}>
        <span className="eyebrow">ONE NEW TECH / MATERIAL / MEDIUM</span>
        <input className="field" placeholder="doesn't have to be AI" value={tech} maxLength={40} onChange={(e) => setTech(e.target.value)} />
        <div className="chips">
          {TECH_CHIPS.map((c) => (
            <button key={c} className={`chip ${tech === c ? "chip--on" : ""}`} onClick={() => setTech(c)}>{c}</button>
          ))}
        </div>
      </label>
      <div className="footer-actions">
        <button className="btn btn-primary" disabled={!ready} onClick={() => onDone({ idea: idea.trim(), tech: tech.trim() })}>Shake to connect →</button>
      </div>
    </Chrome>
  );
}

/* ========================================================= */
/* SHAKE                                                     */
/* ========================================================= */
export function Shake({ onDone, onBack }) {
  const s = useShake();
  const gate = s.needsPermission && s.permission !== "granted" ? "permission" : "ok";
  useEffect(() => {
    if (s.score != null) {
      const t = setTimeout(() => onDone(s.score), 900);
      return () => clearTimeout(t);
    }
  }, [s.score, onDone]);

  return (
    <Chrome part="PART 02 · OPEN LAB" progress={[true, true, false]} bgSeed={47} onBack={onBack}>
      <span className="step-tag">STEP 02 — SHAKE TO CONNECT</span>
      <h1 className="display" style={{ marginTop: 10 }}>Shake for<br />10 seconds</h1>
      <p className="lede" style={{ marginTop: 10 }}>Your motion becomes a signature. We'll pair you with a kindred rhythm — and an opposite one.</p>
      <div className="grow center-col" style={{ justifyContent: "center" }}>
        {gate === "permission" ? (
          <button className="btn btn-dark" style={{ width: "auto" }} onClick={s.request}>Enable motion sensor</button>
        ) : (
          <ShakeOrb shake={s} />
        )}
      </div>
      <div className="footer-actions">
        {gate === "ok" && !s.recording && s.score == null && <button className="btn btn-primary" onClick={s.start}>Start shaking →</button>}
        {s.recording && (
          <>
            <button className="btn btn-dark" onClick={s.bump} onTouchStart={s.bump}>{s.secondsLeft}s — keep shaking!</button>
            {!s.supported && <span className="mono" style={{ opacity: 0.5, textAlign: "center" }}>no sensor? tap fast or hold space</span>}
          </>
        )}
        {s.score != null && <span className="mono" style={{ textAlign: "center", color: "var(--red)" }}>signature captured · {s.score} · matching…</span>}
      </div>
    </Chrome>
  );
}

function ShakeOrb({ shake }) {
  const scale = 1 + Math.min(0.6, shake.energy / 18);
  const ring = shake.recording ? shake.progress : shake.score != null ? 1 : 0;
  const C = 2 * Math.PI * 70;
  return (
    <div className="shakeorb">
      <svg viewBox="0 0 180 180" className="shakeorb__svg">
        <circle cx="90" cy="90" r="70" fill="none" stroke="var(--paper-dim)" strokeWidth="6" />
        <circle cx="90" cy="90" r="70" fill="none" stroke="var(--red)" strokeWidth="6" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - ring)} transform="rotate(-90 90 90)" style={{ transition: "stroke-dashoffset 0.1s linear" }} />
      </svg>
      <motion.div className="shakeorb__core" animate={{ scale: shake.recording ? scale : 1 }} style={{ background: shake.score != null ? "var(--red)" : "var(--ink)" }}>
        <span className="mono">{shake.score != null ? "DONE" : shake.recording ? shake.energy.toFixed(1) : "READY"}</span>
      </motion.div>
    </div>
  );
}

/* ========================================================= */
/* CONNECTIONS                                               */
/* ========================================================= */
export function Connections({ shakeScore, similar, different, onNext, onBack }) {
  return (
    <Chrome part="PART 02 · OPEN LAB" progress={[true, true, true]} bgSeed={53} onBack={onBack}>
      <span className="step-tag">TWO PEOPLE TO FIND</span>
      <h1 className="display" style={{ fontSize: "clamp(28px,8vw,40px)", marginTop: 10 }}>Your<br />frequencies</h1>
      <p className="lede" style={{ marginTop: 8 }}>Signature <strong>{shakeScore}</strong>. Visit both during Open Lab.</p>
      <div className="stack gap-14" style={{ marginTop: 20 }}>
        <motion.div initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <NameCard person={similar} image={similar?.image} variant="similar" caption={`✨ closest rhythm · “${similar?.idea || "—"}”`} />
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.22 }}>
          <NameCard person={different} image={different?.image} variant="different" caption={`⚡ opposite rhythm · “${different?.idea || "—"}”`} />
        </motion.div>
      </div>
      <div className="footer-actions">
        <button className="btn btn-primary" onClick={onNext}>Enter the Wood Wide Web →</button>
      </div>
    </Chrome>
  );
}

export { AnimatePresence };

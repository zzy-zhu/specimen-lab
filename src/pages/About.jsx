import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Wordmark, FuturePixelMark } from "../components/Wordmark";
import { useScene } from "../lib/atmosphere";
import { useEvent } from "../lib/hooks";
import { INSTAGRAM, INSTAGRAM_HANDLE, ANIMA_IG, ANIMA_HANDLE } from "../data/artists";

function IgIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="2.5" y="2.5" width="19" height="19" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function About() {
  const nav = useNavigate();
  const ev = useEvent();
  useScene({ tone: "space", accent: "red" });

  return (
    <motion.div className="screen screen--space about" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      {/* faded repeated wordmark watermark column */}
      <div className="about-wm" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <Wordmark key={i} size={30} stacked color="rgba(247,245,243,0.06)" />
        ))}
      </div>

      <div className="topbar">
        <button className="wordmark-btn" onClick={() => nav("/")}><Wordmark size={17} stacked color="var(--white)" /></button>
        <FuturePixelMark color="var(--white)" size={11} />
      </div>

      <div className="about2">
        <span className="step-tag">ABOUT</span>
        <h1 className="display" style={{ color: "var(--white)", marginTop: 8 }}>A room of<br />specimens</h1>
        <p className="lede" style={{ color: "rgba(247,245,243,0.86)", marginTop: 14 }}>
          Specimen.lab is a living archive of contamination and creative mischief. No name
          tags, no titles — just you, your instincts, and the ideas you're still chasing.
        </p>
        <p className="lede" style={{ color: "rgba(247,245,243,0.7)", marginTop: 12 }}>
          {ev.parts.lab
            ? "Two quick phone rituals turn a room of strangers into a network."
            : "A few quick phone rituals turn a room of strangers into a network."}
        </p>

        <div className="ig-row">
          <a className="ig-follow" href={INSTAGRAM} target="_blank" rel="noreferrer">
            <IgIcon /> FuturePIXEL · {INSTAGRAM_HANDLE}
          </a>
          {ev.ig ? (
            <a className="ig-follow ig-follow--alt" href={ev.ig.url} target="_blank" rel="noreferrer">
              <IgIcon /> {ev.ig.label} · {ev.ig.handle}
            </a>
          ) : (
            <a className="ig-follow ig-follow--alt" href={ANIMA_IG} target="_blank" rel="noreferrer">
              <IgIcon /> collaborator · {ANIMA_HANDLE}
            </a>
          )}
        </div>
      </div>

      <div className="footer-actions">
        <button className="btn btn-primary" onClick={() => nav("/enter")}>Enter the session →</button>
        <button className="linklike mono" onClick={() => nav("/")}>← back to cover</button>
      </div>
    </motion.div>
  );
}

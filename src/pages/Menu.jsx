import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Wordmark, CornerBrand } from "../components/Wordmark";
import { useScene } from "../lib/atmosphere";
import { useMe } from "../lib/hooks";
import { usePresence } from "../hooks/usePresence";
import { isSessionUnlocked } from "../lib/store";

const LUMA_URL = "https://lu.ma/specimenlab";

const stagger = { animate: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } } };
const rise = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

/* The menu — the living space you enter after the code (or ID login).
   Both experiences here; the mineral-space backdrop listens to the room. */
export function Menu() {
  useScene({ tone: "space", accent: "aqua" });
  const nav = useNavigate();
  const { me } = useMe();
  usePresence(me?.id, !!me); // headshot drifts on the monitor as you move

  // guard: must have entered the day code, or be logged into an ID
  useEffect(() => {
    if (!isSessionUnlocked() && !me) nav("/enter", { replace: true });
  }, [me, nav]);

  return (
    <motion.div className="screen screen--space" variants={stagger} initial="initial" animate="animate">
      <div className="topbar">
        <button className="wordmark-btn" onClick={() => nav("/")}><Wordmark size={17} stacked color="var(--white)" /></button>
        <CornerBrand color="var(--white)" />
      </div>

      <motion.div variants={rise} style={{ marginTop: 6 }}>
        <span className="step-tag">THE MENU</span>
        <h1 className="display" style={{ color: "var(--white)", marginTop: 8 }}>Two ways<br />to begin</h1>
        <p className="lede" style={{ color: "rgba(247,245,243,0.8)", marginTop: 8 }}>
          A specimen suspended in space — it listens to the room and reacts.
        </p>
      </motion.div>

      <div className="exp-cards">
        <motion.button variants={rise} className="exp-card" onClick={() => nav("/tension")}>
          <span className="exp-card__no mono">01</span>
          <div className="exp-card__body">
            <h2>Creative Tension</h2>
            <p>Who you are. Build a specimen, then answer four playful questions by tilting your phone. Meet your creative twin.</p>
            <span className="exp-card__meta mono">{me?.part1Done ? "✓ completed · revisit" : "~2 min"}</span>
          </div>
          <span className="exp-card__go">→</span>
        </motion.button>

        <motion.button variants={rise} className="exp-card" onClick={() => nav("/lab")}>
          <span className="exp-card__no mono">02</span>
          <div className="exp-card__body">
            <h2>Open Lab</h2>
            <p>What you explore. Capture a living idea, shake to connect by rhythm, then watch the Wood Wide Web grow.</p>
            <span className="exp-card__meta mono">{me?.part2Done ? "✓ completed · revisit" : "~3 min"}</span>
          </div>
          <span className="exp-card__go">→</span>
        </motion.button>
      </div>

      <motion.div variants={rise} className="menu-extra">
        <button className="btn btn-ghost" onClick={() => nav("/artists")}>Today's artists →</button>
        <a className="btn btn-ghost" href={LUMA_URL} target="_blank" rel="noreferrer">RSVP on Luma ↗</a>
      </motion.div>

      <motion.div variants={rise} className="home-foot">
        <button className="linklike mono" onClick={() => nav("/me")}>
          {me ? `◇ signed in as ${me.name} — view your ID` : "access your saved ID →"}
        </button>
        <button className="linklike mono dim" onClick={() => nav("/monitor")}>organizer monitor</button>
      </motion.div>
    </motion.div>
  );
}

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Wordmark } from "../components/Wordmark";
import { useScene } from "../lib/atmosphere";
import { useEvent, useMe, useSession } from "../lib/hooks";
import { usePresence } from "../hooks/usePresence";
import { isSessionUnlocked } from "../lib/store";

const stagger = { animate: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } } };
const rise = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

const COUNT_WORD = ["zero", "one", "two", "three", "four", "five", "six"];

/* The menu — the living space you enter after the code (or ID login).
   What's on it comes from the active event: LA gets both experiences +
   the artists; OpenTab gets Creative Tension only, until the host
   reveals the Specimen.lab archive from the monitor. */
export function Menu() {
  useScene({ tone: "space", accent: "aqua" });
  const nav = useNavigate();
  const { me } = useMe();
  const ev = useEvent();
  const session = useSession();
  usePresence(me?.id, !!me); // headshot drifts on the monitor as you move

  const revealed = ev.artists || !!session.reveal; // host-unlocked archive
  const nQ = COUNT_WORD[ev.questions.length] || ev.questions.length;

  // guard: must have entered the day code, or be logged into an ID
  useEffect(() => {
    if (!isSessionUnlocked() && !me) nav("/enter", { replace: true });
  }, [me, nav]);

  return (
    <motion.div className="screen screen--space" variants={stagger} initial="initial" animate="animate">
      <div className="topbar">
        <button className="wordmark-btn" onClick={() => nav("/")}><Wordmark size={17} stacked color="var(--white)" /></button>
        <button className="id-chip mono" onClick={() => nav("/me")}>
          {me?.image ? <img src={me.image} alt="" /> : <span>◇</span>}
          {me ? me.name : "your ID"}
        </button>
      </div>

      <motion.div variants={rise} style={{ marginTop: 6 }}>
        <span className="step-tag">{ev.menuTag}</span>
        <h1 className="display" style={{ color: "var(--white)", marginTop: 8, whiteSpace: "pre-line" }}>{ev.menuTitle}</h1>
        <p className="lede" style={{ color: "rgba(247,245,243,0.8)", marginTop: 8 }}>{ev.menuLede}</p>
      </motion.div>

      <div className="exp-cards">
        <motion.button variants={rise} className="exp-card" onClick={() => nav("/session")}>
          <span className="exp-card__no mono">01</span>
          <div className="exp-card__body">
            <h2>Creative Tension</h2>
            <p>Who you are. A guided, room-wide ritual — the host leads everyone through {nQ} tilt questions, together. Meet your creative twin.</p>
            <span className="exp-card__meta mono">{me?.part1Done ? "✓ completed · rejoin" : "host-guided · live"}</span>
          </div>
          <span className="exp-card__go">→</span>
        </motion.button>

        {ev.parts.lab && (
          <motion.button variants={rise} className="exp-card" onClick={() => nav("/lab")}>
            <span className="exp-card__no mono">02</span>
            <div className="exp-card__body">
              <h2>Open Lab</h2>
              <p>What you explore. Capture a living idea, shake to connect by rhythm, then watch the Wood Wide Web grow.</p>
              <span className="exp-card__meta mono">{me?.part2Done ? "✓ completed · revisit" : "~3 min"}</span>
            </div>
            <span className="exp-card__go">→</span>
          </motion.button>
        )}
      </div>

      {(me?.answers?.length || me?.shake != null) && (
        <motion.button variants={rise} className="exp-card" style={{ marginTop: 12 }} onClick={() => nav("/results")}>
          <span className="exp-card__no mono">◆</span>
          <div className="exp-card__body">
            <h2>Your results</h2>
            <p>Revisit your creative twin{ev.parts.lab ? " and shake matches" : ""} any time.</p>
            <span className="exp-card__meta mono">
              {[me?.answers?.length ? "twin" : null, me?.shake != null ? "frequency" : null].filter(Boolean).join(" · ")}
            </span>
          </div>
          <span className="exp-card__go">→</span>
        </motion.button>
      )}

      <motion.div variants={rise} className="menu-extra">
        {revealed && <button className="btn btn-ghost" onClick={() => nav("/artists")}>Today's artists →</button>}
        {ev.luma && <a className="btn btn-ghost" href={ev.luma} target="_blank" rel="noreferrer">RSVP on Luma ↗</a>}
        {ev.ig && (
          <a className="btn btn-ghost" href={ev.ig.url} target="_blank" rel="noreferrer">
            {ev.ig.label} on Instagram · {ev.ig.handle} ↗
          </a>
        )}
      </motion.div>

      <motion.div variants={rise} className="home-foot">
        <button className="linklike mono" onClick={() => nav("/me")}>
          {me ? `◇ signed in as ${me.name} — view your ID` : "access your saved ID →"}
        </button>
        <div className="menu-foot-row">
          <button className="linklike mono dim" onClick={() => nav("/enter?new=1")}>different event? enter a code</button>
          <button className="linklike mono dim" onClick={() => nav("/monitor")}>organizer monitor</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

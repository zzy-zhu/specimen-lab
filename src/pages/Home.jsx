import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Wordmark, CornerBrand, AnimaMark } from "../components/Wordmark";
import { useScene, ListenButton } from "../lib/atmosphere";
import { useMe } from "../lib/hooks";

const stagger = {
  animate: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};
const rise = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

export function Home() {
  useScene({ tone: "space", accent: "aqua" });
  const nav = useNavigate();
  const { me } = useMe();

  return (
    <motion.div className="screen screen--space" variants={stagger} initial="initial" animate="animate">
      <div className="topbar">
        <AnimaMark color="var(--white)" />
        <CornerBrand color="var(--white)" />
      </div>

      <motion.div variants={rise} className="center-col" style={{ gap: 14, marginTop: 8 }}>
        <Wordmark size={40} stacked color="var(--white)" />
        <p className="lede" style={{ textAlign: "center", color: "rgba(247,245,243,0.82)" }}>
          A living archive of contamination, and creative mischief. A specimen
          suspended in space — it listens to the room and reacts.
        </p>
        <ListenButton />
      </motion.div>

      <div className="exp-cards">
        <motion.button variants={rise} className="exp-card" onClick={() => nav("/tension")}>
          <span className="exp-card__no mono">01</span>
          <div className="exp-card__body">
            <h2>Creative Tension</h2>
            <p>Who you are. Build a specimen, then answer four playful questions by tilting your phone. Meet your creative twin.</p>
            <span className="exp-card__meta mono">
              {me?.part1Done ? "✓ completed · revisit" : "before the event · ~2 min"}
            </span>
          </div>
          <span className="exp-card__go">→</span>
        </motion.button>

        <motion.button variants={rise} className="exp-card" onClick={() => nav("/lab")}>
          <span className="exp-card__no mono">02</span>
          <div className="exp-card__body">
            <h2>Open Lab</h2>
            <p>What you explore. Capture a living idea, shake to connect by rhythm, then watch the Wood Wide Web grow.</p>
            <span className="exp-card__meta mono">
              {me?.part2Done ? "✓ completed · revisit" : "after the talks · ~3 min"}
            </span>
          </div>
          <span className="exp-card__go">→</span>
        </motion.button>
      </div>

      <motion.div variants={rise} className="home-foot">
        {me ? (
          <button className="linklike mono" onClick={() => nav("/me")}>
            ◇ signed in as {me.name} — view your ID
          </button>
        ) : (
          <button className="linklike mono" onClick={() => nav("/me")}>
            already a specimen? access your ID →
          </button>
        )}
        <button className="linklike mono dim" onClick={() => nav("/monitor")}>
          organizer monitor
        </button>
      </motion.div>
    </motion.div>
  );
}

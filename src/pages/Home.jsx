import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Wordmark, CornerBrand, AnimaMark } from "../components/Wordmark";
import { GridBackground } from "../components/GridBackground";
import { useAtmosphere } from "../lib/atmosphere";
import { useMe } from "../lib/hooks";
import { useEffect } from "react";

const stagger = { animate: { transition: { staggerChildren: 0.07, delayChildren: 0.08 } } };
const rise = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

/* The cover keeps the original red poster identity:
   red node-graph constellation on paper + the centered red wordmark. */
export function Home() {
  const nav = useNavigate();
  const { me } = useMe();
  const { setScene } = useAtmosphere();

  // cover is the red poster — no mineral-space backdrop here
  useEffect(() => {
    setScene({ visible: false });
  }, [setScene]);

  return (
    <motion.div className="screen screen--cover" variants={stagger} initial="initial" animate="animate">
      <GridBackground seed={3} nodes={15} color="var(--red)" />

      <div className="topbar">
        <AnimaMark />
        <CornerBrand color="var(--red)" />
      </div>

      <motion.div variants={rise} className="center-col" style={{ gap: 16, marginTop: 18 }}>
        <Wordmark size={46} stacked color="var(--red)" />
        <p className="lede" style={{ textAlign: "center", color: "var(--ink)" }}>
          A living archive of contamination, and creative mischief.
        </p>
        <span className="mono" style={{ opacity: 0.6 }}>
          2026.7.18 · 7–9PM · LOS ANGELES · VENIA STUDIO
        </span>
      </motion.div>

      <div className="exp-cards exp-cards--cover">
        <motion.button variants={rise} className="exp-card exp-card--paper" onClick={() => nav("/tension")}>
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

        <motion.button variants={rise} className="exp-card exp-card--paper" onClick={() => nav("/lab")}>
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

      <motion.div variants={rise} className="home-foot home-foot--cover">
        <button className="linklike mono" onClick={() => nav("/me")}>
          {me ? `◇ signed in as ${me.name} — view your ID` : "already a specimen? access your ID →"}
        </button>
        <button className="linklike mono dim" onClick={() => nav("/monitor")}>
          organizer monitor
        </button>
      </motion.div>
    </motion.div>
  );
}

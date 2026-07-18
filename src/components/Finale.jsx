import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { WoodWideWeb } from "./WoodWideWeb";
import { IdeaMap } from "./IdeaMap";
import { summarizeIdeas } from "../lib/ai";

/* The Part 02 finale: AI clusters the room's ideas, then the whole
   community appears as a living mycelial network. */
export function Finale({ people, me, onHome, onBack }) {
  const [ai, setAi] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    summarizeIdeas(people).then((r) => {
      if (alive) { setAi(r); setLoading(false); }
    });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div className="screen screen--space" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="topbar">
        <button className="wordmark-btn" onClick={onBack} aria-label="back">
          <span className="mono" style={{ color: "var(--white)" }}>← back</span>
        </button>
        <span className="eyebrow" style={{ color: "var(--white)" }}>PART 02 · FINALE</span>
      </div>

      <span className="step-tag">THE WOOD WIDE WEB</span>
      <h1 className="display" style={{ color: "var(--white)", fontSize: "clamp(26px,7.5vw,38px)", marginTop: 8 }}>
        One living<br />network
      </h1>
      <p className="lede" style={{ color: "rgba(247,245,243,0.8)", marginTop: 8 }}>
        Roots grow between specimens who share instincts, rhythm, or material.
        You are the pulsing red node.
      </p>

      <motion.div className="woodweb-wrap" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
        <WoodWideWeb people={people} meId={me?.id} dark />
      </motion.div>

      <div className="ai-panel">
        <span className="ai-panel__tag mono">
          {loading ? "◌ AI reading the room…" : `✦ AI synthesis · ${ai?.source === "claude" ? "Claude" : "local"}`}
        </span>
        {loading ? (
          <div className="ai-skeleton" />
        ) : (
          <>
            <p className="ai-panel__overview">{ai?.overview}</p>
            <div className="ai-clusters">
              {ai?.clusters?.map((c) => (
                <div key={c.label} className="ai-cluster">
                  <div className="ai-cluster__head">
                    <span className="ai-cluster__label">{c.label}</span>
                    <span className="mono">×{c.count}</span>
                  </div>
                  <p className="ai-cluster__sum">{c.summary}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <details className="map-details">
        <summary className="mono">▸ open the flat idea map</summary>
        <IdeaMap myIdea={me?.idea} myTech={me?.tech} myName={me?.name} />
      </details>

      <div className="footer-actions">
        <button className="btn btn-primary" onClick={onHome}>Done — back to the hub →</button>
        <span className="mono" style={{ opacity: 0.5, textAlign: "center", color: "var(--white)" }}>
          the ecosystem keeps growing on the room monitor
        </span>
      </div>
    </motion.div>
  );
}

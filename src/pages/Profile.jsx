import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FlipCard } from "../components/FlipCard";
import { Wordmark, FuturePixelMark } from "../components/Wordmark";
import { useScene } from "../lib/atmosphere";
import { useRoom } from "../lib/hooks";
import { normHandle } from "../lib/store";

/* Public, shareable specimen profile — the permanent lab-member link. */
export function Profile() {
  useScene({ tone: "space", accent: "aqua" });
  const { handle } = useParams();
  const nav = useNavigate();
  const room = useRoom();
  const person = useMemo(
    () => room.find((p) => p.handle === normHandle(handle)),
    [room, handle]
  );

  return (
    <motion.div className="screen screen--space" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="topbar">
        <button className="wordmark-btn" onClick={() => nav("/")}><Wordmark size={17} stacked color="var(--white)" /></button>
        <FuturePixelMark color="var(--white)" size={11} />
      </div>

      <span className="step-tag">SPECIMEN · PERMANENT MEMBER</span>
      <h1 className="display" style={{ color: "var(--white)", marginTop: 8 }}>
        {person ? person.name : "Unknown"}
      </h1>

      <div style={{ marginTop: 20 }}>
        {person ? (
          <FlipCard
            person={{ ...person, role: `@${person.handle}` }}
            image={person.image}
            variant="self"
            reason={person.idea ? `“${person.idea}” · exploring ${person.tech || "—"}` : "a specimen of the lab"}
            label="LOADING SPECIMEN"
            autoFlipMs={900}
          />
        ) : (
          <p className="lede" style={{ color: "rgba(247,245,243,0.8)" }}>
            No specimen found for @{normHandle(handle)}. They may not have joined yet.
          </p>
        )}
      </div>

      <div className="footer-actions">
        <button className="btn btn-primary" onClick={() => nav("/")}>Join Specimen.lab →</button>
        <span className="mono" style={{ opacity: 0.5, textAlign: "center", color: "var(--white)" }}>
          a living archive of contamination
        </span>
      </div>
    </motion.div>
  );
}

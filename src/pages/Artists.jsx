import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Wordmark, CornerBrand } from "../components/Wordmark";
import { ScanToPhone } from "../components/ScanToPhone";
import { useScene } from "../lib/atmosphere";
import { useIsDesktop } from "../hooks/useIsDesktop";
import { ARTISTS, LUMA } from "../data/artists";

/* Today's artists — one column of poster cards on phone; a scan-to-phone
   QR on laptop. */
export function Artists() {
  useScene({ tone: "space", accent: "red" });
  const nav = useNavigate();
  const desktop = useIsDesktop();

  if (desktop) {
    return (
      <div className="screen screen--space" style={{ justifyContent: "center" }}>
        <ScanToPhone label="Meet today's artists" />
      </div>
    );
  }

  return (
    <motion.div className="screen screen--space" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="topbar">
        <button className="wordmark-btn" onClick={() => nav("/menu")}><Wordmark size={17} stacked color="var(--white)" /></button>
        <CornerBrand color="var(--white)" />
      </div>

      <span className="step-tag">TODAY'S SESSION</span>
      <h1 className="display" style={{ color: "var(--white)", marginTop: 8 }}>The<br />artists</h1>
      <p className="lede" style={{ color: "rgba(247,245,243,0.8)", marginTop: 8 }}>
        {ARTISTS.length} specimens sharing tonight.
      </p>

      <div className="artist-list">
        {ARTISTS.map((a, i) => (
          <motion.article
            key={a.id}
            className="artist-card"
            style={{ "--accent": a.accent }}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 * i }}
          >
            <div className="artist-card__img">
              <img src={`/artists/${a.id}.jpg`} alt="" onError={(e) => { e.currentTarget.style.display = "none"; }} />
              <span className="artist-card__ph">{a.name.split(" ").map((w) => w[0]).join("")}</span>
              <span className="artist-card__wm mono">(SPECI ^MEN.lab)</span>
            </div>
            <div className="artist-card__body">
              <h2>{a.name}</h2>
              <span className="artist-card__role mono">({a.role})</span>
              <p>{a.blurb}</p>
            </div>
          </motion.article>
        ))}
      </div>

      <div className="footer-actions">
        <a className="btn btn-primary" href={LUMA} target="_blank" rel="noreferrer">RSVP on Luma ↗</a>
        <button className="linklike mono" onClick={() => nav("/menu")}>← back to menu</button>
      </div>
    </motion.div>
  );
}

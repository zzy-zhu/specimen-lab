import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Wordmark, CornerBrand } from "../components/Wordmark";
import { ScanToPhone } from "../components/ScanToPhone";
import { useScene } from "../lib/atmosphere";
import { useIsDesktop } from "../hooks/useIsDesktop";
import { useEvent, useSession } from "../lib/hooks";
import { ARTISTS, LUMA } from "../data/artists";

/* Today's artists — one column of the actual poster images on phone
   (drop them at public/artists/<id>.jpg); a scan-to-phone QR on laptop.
   If a poster file is missing, a text fallback shows so nothing breaks. */
export function Artists() {
  useScene({ tone: "space", accent: "red" });
  const nav = useNavigate();
  const desktop = useIsDesktop();
  const ev = useEvent();
  const session = useSession();

  // events that aren't the LA night only see this once the host reveals it
  const allowed = ev.artists || !!session.reveal;
  useEffect(() => { if (!allowed) nav("/menu", { replace: true }); }, [allowed, nav]);
  if (!allowed) return null;

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

      <div className="poster-list">
        {ARTISTS.map((a, i) => (
          <motion.figure
            key={a.id}
            className="poster"
            style={{ "--accent": a.accent }}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 * i }}
          >
            <img
              className="poster__img"
              src={`/artists/${a.id}.jpg`}
              alt={`${a.name} — ${a.role}`}
              loading="lazy"
              onError={(e) => { e.currentTarget.closest(".poster").classList.add("poster--noimg"); }}
            />
            <figcaption className="poster__fallback">
              <h2>{a.name}</h2>
              <span className="mono">({a.role})</span>
              <p>{a.blurb}</p>
              <span className="poster__hint mono">poster: /artists/{a.id}.jpg</span>
            </figcaption>
          </motion.figure>
        ))}
      </div>

      <div className="footer-actions">
        <a className="btn btn-primary" href={LUMA} target="_blank" rel="noreferrer">RSVP on Luma ↗</a>
        <button className="linklike mono" onClick={() => nav("/menu")}>← back to menu</button>
      </div>
    </motion.div>
  );
}

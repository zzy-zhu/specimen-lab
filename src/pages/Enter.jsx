import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Wordmark } from "../components/Wordmark";
import { useScene } from "../lib/atmosphere";
import { DAY_CODE } from "../data/lab";
import { unlockSession, getMe } from "../lib/store";

/* Code-of-the-day gate. Arrives out of the black cover transition.
   Returning attendees can log in their saved ID instead. */
export function Enter() {
  useScene({ tone: "space", accent: "aqua" });
  const nav = useNavigate();
  const [code, setCode] = useState("");
  const [err, setErr] = useState(false);

  const submit = () => {
    if (code.trim().toLowerCase() === DAY_CODE) {
      unlockSession();
      nav(getMe() ? "/menu" : "/create"); // create profile first, then menu
    } else {
      setErr(true);
    }
  };

  return (
    <motion.div
      className="screen screen--space"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="topbar">
        <button className="wordmark-btn" onClick={() => nav("/")}><Wordmark size={17} stacked color="var(--white)" /></button>
        <span className="eyebrow" style={{ color: "var(--white)" }}>ACCESS</span>
      </div>

      <div className="grow center-col" style={{ justifyContent: "center", gap: 18 }}>
        <span className="step-tag">CODE OF THE DAY</span>
        <h1 className="display" style={{ color: "var(--white)", textAlign: "center" }}>Enter<br />the session</h1>
        <p className="lede" style={{ color: "rgba(247,245,243,0.78)", textAlign: "center" }}>
          Type today's code — you'll find it in the room.
        </p>
        <input
          className="field field--dark"
          style={{ maxWidth: 300, textAlign: "center", letterSpacing: "0.2em" }}
          placeholder="· · · · · · · ·"
          value={code}
          onChange={(e) => { setCode(e.target.value); setErr(false); }}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          autoFocus
        />
        {err && <span className="mono" style={{ color: "var(--red)" }}>⌀ that code isn't live today</span>}
        <button className="btn btn-primary" style={{ maxWidth: 300 }} onClick={submit}>Unlock the menu →</button>
      </div>

      <div className="footer-actions">
        <button className="linklike mono" onClick={() => nav("/me")}>
          attended a FuturePIXEL event before? log in your ID →
        </button>
        <span className="mono" style={{ opacity: 0.45, textAlign: "center", color: "var(--white)" }}>
          everything you make is saved to your ID
        </span>
      </div>
    </motion.div>
  );
}

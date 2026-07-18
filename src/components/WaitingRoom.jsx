import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { NameCard } from "./NameCard";
import { Wordmark } from "./Wordmark";

/* Shared waiting room — shown until the host starts an event.
   Logo returns home; a return chip goes back to the menu (you can
   always rejoin the same live session). */
export function WaitingRoom({ me, count, tag = "WAITING ROOM", title = "You're in.\nHold tight.", sub }) {
  const nav = useNavigate();
  return (
    <motion.div className="screen screen--space" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="topbar">
        <button className="wordmark-btn" onClick={() => nav("/")}><Wordmark size={17} stacked color="var(--white)" /></button>
        <div className="topbar__right">
          <button className="backchip mono" onClick={() => nav("/menu")}>↩ menu</button>
          <span className="eyebrow" style={{ color: "var(--white)" }}>{tag}</span>
        </div>
      </div>
      <div className="grow center-col" style={{ justifyContent: "center", gap: 22 }}>
        <span className="lobby-pulse" />
        <h1 className="display" style={{ color: "var(--white)", textAlign: "center", whiteSpace: "pre-line" }}>{title}</h1>
        <p className="lede" style={{ color: "rgba(247,245,243,0.8)", textAlign: "center" }}>
          {sub || "The host will start this for everyone at once. Keep your phone in hand."}
        </p>
        {count != null && <span className="mono" style={{ color: "var(--aqua)" }}>◉ {count} in the room</span>}
      </div>
      {me && (
        <div style={{ marginTop: "auto" }}>
          <NameCard person={{ ...me, role: "you" }} image={me.image} variant="self" caption="ready" />
        </div>
      )}
    </motion.div>
  );
}

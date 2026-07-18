import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { WoodWideWeb } from "../components/WoodWideWeb";
import { NameCard } from "../components/NameCard";
import { Wordmark } from "../components/Wordmark";
import { useScene } from "../lib/atmosphere";
import { useMe, useRoom } from "../lib/hooks";

/* Connection map — the room's Wood Wide Web. Pinch/scroll or use +/- to
   zoom; tap a node to see that specimen's card. */
export function Map() {
  useScene({ tone: "space", accent: "aqua" });
  const nav = useNavigate();
  const { me } = useMe();
  const room = useRoom();
  const [scale, setScale] = useState(1);
  const [sel, setSel] = useState(null);

  const zoom = (d) => setScale((s) => Math.max(0.6, Math.min(3, +(s + d).toFixed(2))));

  return (
    <motion.div className="screen screen--space map-screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="topbar">
        <button className="wordmark-btn" onClick={() => nav("/")}><Wordmark size={17} stacked color="var(--white)" /></button>
        <div className="topbar__right">
          <button className="backchip mono" onClick={() => nav("/me")}>↩ profile</button>
          <span className="eyebrow" style={{ color: "var(--white)" }}>CONNECTION MAP</span>
        </div>
      </div>

      <span className="step-tag">THE WOOD WIDE WEB · {room.length}</span>

      {room.length === 0 ? (
        <div className="grow center-col" style={{ justifyContent: "center" }}>
          <p className="lede" style={{ color: "rgba(247,245,243,0.8)", textAlign: "center" }}>
            The map is empty — no specimens have joined yet.
          </p>
        </div>
      ) : (
        <div
          className="map-viewport"
          onWheel={(e) => zoom(e.deltaY < 0 ? 0.15 : -0.15)}
        >
          <div className="map-stage" style={{ transform: `scale(${scale})` }}>
            <WoodWideWeb people={room} meId={me?.id} dark onNodeTap={(n) => setSel(n)} />
          </div>
          <div className="map-zoom">
            <button onClick={() => zoom(0.25)}>+</button>
            <button onClick={() => zoom(-0.25)}>−</button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {sel && (
          <motion.div className="map-card" initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}>
            <NameCard
              person={sel}
              image={sel.image}
              variant={sel.id === me?.id ? "self" : "twin"}
              caption={sel.idea ? `“${sel.idea}”${sel.tech ? ` · ${sel.tech}` : ""}` : "a specimen of the lab"}
            />
            <button className="linklike mono" style={{ marginTop: 10 }} onClick={() => setSel(null)}>close</button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

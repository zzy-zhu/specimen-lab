import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { WoodWideWeb, connectionsFor } from "../components/WoodWideWeb";
import { NameCard } from "../components/NameCard";
import { Wordmark } from "../components/Wordmark";
import { useScene } from "../lib/atmosphere";
import { useMe, useRoom } from "../lib/hooks";

/* The attendee map — the room's Wood Wide Web. Pinch/scroll or use +/- to
   zoom; tap a node to see that specimen's card. Below it: everyone who's
   here, what they want to make, and who you're threaded to. */
export function Map() {
  useScene({ tone: "space", accent: "aqua" });
  const nav = useNavigate();
  const { me } = useMe();
  const room = useRoom();
  const [scale, setScale] = useState(1);
  const [sel, setSel] = useState(null);

  const zoom = (d) => setScale((s) => Math.max(0.6, Math.min(3, +(s + d).toFixed(2))));

  // who you're threaded to, and why
  const mine = useMemo(() => connectionsFor(room, me?.id), [room, me]);
  const others = useMemo(() => room.filter((p) => p.id !== me?.id), [room, me]);

  return (
    <motion.div className="screen screen--space map-screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="topbar">
        <button className="wordmark-btn" onClick={() => nav("/")}><Wordmark size={17} stacked color="var(--white)" /></button>
        <div className="topbar__right">
          <button className="backchip mono" onClick={() => nav("/menu")}>↩ menu</button>
          <span className="eyebrow" style={{ color: "var(--white)" }}>ATTENDEE MAP</span>
        </div>
      </div>

      <span className="step-tag">THE ROOM · {room.length} CONNECTED</span>

      {room.length === 0 ? (
        <div className="grow center-col" style={{ justifyContent: "center" }}>
          <p className="lede" style={{ color: "rgba(247,245,243,0.8)", textAlign: "center" }}>
            The map is empty — no specimens have joined yet.
          </p>
        </div>
      ) : (
        <>
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

          <div className="map-legend mono">
            <span><i className="thread thread--twin" /> your twin</span>
            <span><i className="thread thread--instinct" /> same instincts</span>
            <span><i className="thread thread--theme" /> making something adjacent</span>
          </div>

          {me && (
            <section className="map-section">
              <span className="eyebrow" style={{ color: "var(--white)" }}>
                YOU'RE CONNECTED TO {mine.length}
              </span>
              {mine.length === 0 ? (
                <p className="lede" style={{ color: "rgba(247,245,243,0.65)", marginTop: 8 }}>
                  No threads yet — they grow as people answer the tensions.
                </p>
              ) : (
                <ul className="thread-list">
                  {mine.map((c) => (
                    <li key={c.person.id}>
                      <button className="thread-row" onClick={() => setSel(c.person)}>
                        <span className={`thread thread--${c.kind}`} />
                        <span className="thread-row__name">{c.person.name}</span>
                        <span className="mono thread-row__kind">{c.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          <section className="map-section">
            <span className="eyebrow" style={{ color: "var(--white)" }}>WHAT THE ROOM WANTS TO MAKE</span>
            <ul className="dream-list">
              {others.filter((p) => p.dream).length === 0 && (
                <li className="dream-list__empty mono">nobody has written one yet</li>
              )}
              {others.filter((p) => p.dream).map((p) => (
                <li key={p.id}>
                  <button className="dream-row" onClick={() => setSel(p)}>
                    <span className="dream-row__who">
                      <span className="dream-row__img">
                        {p.image ? <img src={p.image} alt="" /> : <span>{p.name?.[0] || "?"}</span>}
                      </span>
                      <span className="dream-row__name mono">{p.name}</span>
                    </span>
                    <span className="dream-row__text">“{p.dream}”</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      <AnimatePresence>
        {sel && (
          <motion.div className="map-card" initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}>
            <NameCard
              person={sel}
              image={sel.image}
              variant={sel.id === me?.id ? "self" : "twin"}
              caption={
                sel.dream ? `wants to make: “${sel.dream}”`
                : sel.idea ? `“${sel.idea}”${sel.tech ? ` · ${sel.tech}` : ""}`
                : "a specimen of the lab"
              }
            />
            <button className="linklike mono" style={{ marginTop: 10 }} onClick={() => setSel(null)}>close</button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

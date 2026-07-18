import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Twin } from "../screens";
import { WaterTension } from "../components/WaterTension";
import { WaitingRoom } from "../components/WaitingRoom";
import { useScene } from "../lib/atmosphere";
import { useMe, useRoom, useSession } from "../lib/hooks";
import { useTilt } from "../hooks/useTilt";
import { usePresence } from "../hooks/usePresence";
import { QUESTIONS, findTwin } from "../data/lab";
import { matchmake } from "../lib/ai";
import { isSessionUnlocked } from "../lib/store";

/* The phone's live screen — everything here is driven by the host's
   monitor: a waiting room until the host starts, then the room walks
   through Creative Tension one question at a time, in sync. */
export function Session() {
  useScene({ tone: "space", accent: "aqua" });
  const nav = useNavigate();
  const { me, patch } = useMe();
  const room = useRoom();
  const session = useSession();

  const active = session.state === "tension";
  const tilt = useTilt(active && !!me);
  usePresence(me?.id, active && !!me);

  // guard: need day code, then a profile
  useEffect(() => {
    if (!isSessionUnlocked()) nav("/enter", { replace: true });
    else if (!me) nav("/create", { replace: true });
  }, [me, nav]);

  // lock the answer when the specimen taps the screen (after leaning)
  const q = session.q ?? 0;
  const lockedSide = me?.answers?.[q];
  const lockAnswer = () => {
    if (!active || !me) return;
    const side = tilt.tilt < -0.12 ? 0 : tilt.tilt > 0.12 ? 1 : null;
    if (side == null) return;
    const answers = [...(me.answers || [])];
    answers[q] = side;
    patch({ answers, part1Done: q >= QUESTIONS.length - 1 });
  };

  // twin (revealed when host moves to 'twin')
  const [match, setMatch] = useState(null);
  useEffect(() => {
    if (session.state !== "twin" || !me) return;
    const pool = room.filter((p) => p.id !== me.id && p.answers?.length);
    const local = findTwin(me.answers || [], pool);
    setMatch({ match: local.twin, reason: "", shared: local.shared, total: local.total });
    let alive = true;
    matchmake(me, pool).then((r) => { if (alive && r.match) setMatch(r); });
    return () => { alive = false; };
  }, [session.state, me, room]);

  if (!me) return null; // redirecting to /create

  // ---- waiting room (Event 01 not yet started, or host is elsewhere) ----
  if (session.state !== "tension" && session.state !== "twin") {
    return (
      <WaitingRoom
        me={me}
        count={room.length}
        tag="EVENT 01 · WAITING ROOM"
        title={"Creative\nTension"}
        sub="The host will start the Creative Tension for everyone at once. Keep your phone in hand."
      />
    );
  }

  // ---- host-driven tension ----
  if (session.state === "tension") {
    const question = QUESTIONS[q];
    const gate = tilt.needsPermission && tilt.permission !== "granted";
    return (
      <motion.div className="screen screen--space session-tension" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="topbar">
          <button className="wordmark-btn" onClick={() => nav("/")}><span className="mono" style={{ color: "var(--aqua)" }}>● LIVE · GUIDED</span></button>
          <div className="topbar__right">
            <button className="backchip mono" onClick={() => nav("/menu")}>↩ menu</button>
            <span className="eyebrow" style={{ color: "var(--white)" }}>
              {String(q + 1).padStart(2, "0")} / {String(QUESTIONS.length).padStart(2, "0")}
            </span>
          </div>
        </div>
        {gate ? (
          <div className="grow center-col" style={{ justifyContent: "center", gap: 16 }}>
            <p className="lede" style={{ color: "var(--white)", textAlign: "center" }}>Grant motion access to lean.</p>
            <button className="btn btn-dark" style={{ width: "auto" }} onClick={tilt.request}>Enable motion</button>
          </div>
        ) : (
          <div className="tension-tap" onClick={lockAnswer}>
            <WaterTension q={question} tilt={tilt.tilt} locked={lockedSide} />
            {!tilt.supported && (
              <div className="lean-btns" onClick={(e) => e.stopPropagation()}>
                <button className="lean-btn" onClick={() => { tilt.setTilt(-0.85); }}>◀ {question.left}</button>
                <button className="lean-btn" onClick={() => { tilt.setTilt(0.85); }}>{question.right} ▶</button>
              </div>
            )}
            <span className="mono tension-tap__hint">
              {lockedSide == null ? "tap the screen to lock your lean" : `✓ locked · ${lockedSide === 0 ? question.left : question.right}`}
            </span>
          </div>
        )}
      </motion.div>
    );
  }

  // ---- twin reveal ----
  if (session.state === "twin") {
    return (
      <Twin
        twin={match?.match}
        shared={match?.shared ?? 0}
        total={match?.total ?? QUESTIONS.length}
        reason={match?.reason}
        onBack={() => nav("/menu")}
        onHome={() => nav("/menu")}
      />
    );
  }

  return null;
}

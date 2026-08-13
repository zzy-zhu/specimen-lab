import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Twin } from "../screens";
import { WaterTension } from "../components/WaterTension";
import { WaitingRoom } from "../components/WaitingRoom";
import { useScene } from "../lib/atmosphere";
import { useEvent, useMe, useRoom, useSession } from "../lib/hooks";
import { useTilt } from "../hooks/useTilt";
import { usePresence } from "../hooks/usePresence";
import { findTwin } from "../data/lab";
import { matchmake, describeTwin } from "../lib/ai";
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
  const ev = useEvent();
  const QUESTIONS = ev.questions;

  const active = session.state === "tension";
  const tphase = session.tphase || "ask";
  const q = session.q ?? 0;
  const lockedSide = me?.answers?.[q];
  const locked = lockedSide != null;
  const canAnswer = active && tphase === "ask" && !locked;
  const tilt = useTilt(canAnswer && !!me);
  // stop publishing position once locked / ended → the monitor headshot freezes
  usePresence(me?.id, canAnswer && !!me);

  // guard: need day code, then a profile
  useEffect(() => {
    if (!isSessionUnlocked()) nav("/enter", { replace: true });
    else if (!me) nav("/create", { replace: true });
  }, [me, nav]);

  // phone-side 3-2-1 countdown mirror
  const [pcount, setPcount] = useState(3);
  useEffect(() => {
    if (!(active && tphase === "count")) return;
    setPcount(3);
    const t1 = setTimeout(() => setPcount(2), 1000);
    const t2 = setTimeout(() => setPcount(1), 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [active, tphase, q]);

  // lock the answer when the specimen taps the screen (after leaning)
  const lockAnswer = () => {
    if (!canAnswer || !me) return; // only during the ask phase, before locking
    const side = tilt.tilt < -0.12 ? 0 : tilt.tilt > 0.12 ? 1 : null;
    if (side == null) return;
    const answers = [...(me.answers || [])];
    answers[q] = side;
    patch({ answers, part1Done: q >= QUESTIONS.length - 1 });
  };
  // once locked, freeze the water at the chosen side (no more movement)
  const shownTilt = locked ? (lockedSide === 0 ? -0.9 : 0.9) : tilt.tilt;

  // twin (revealed when the host finishes + matches the room).
  // The host's pairing wins; we only fall back to a local match if the
  // host hasn't run the matcher for this specimen.
  const [match, setMatch] = useState(null);
  useEffect(() => {
    if (session.state !== "twin" || !me) return;
    let alive = true;
    if (me.twin?.id) {
      const live = room.find((p) => p.id === me.twin.id);
      const twin = { ...me.twin, ...live };
      setMatch({ match: twin, reason: me.twin.reason || "", shared: me.twin.shared, total: me.twin.total });
      describeTwin(me, twin, me.twin.shared, me.twin.total).then((r) => {
        if (alive && r.reason) setMatch((m) => ({ ...m, reason: r.reason }));
      });
      return () => { alive = false; };
    }
    const pool = room.filter((p) => p.id !== me.id && p.answers?.length);
    const local = findTwin(me.answers || [], pool);
    setMatch({ match: local.twin, reason: "", shared: local.shared, total: local.total });
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
        tag={ev.waitingTag}
        title={"Creative\nTension"}
        sub="The host will start the Creative Tension for everyone at once. Keep your phone in hand."
      />
    );
  }

  // ---- host-driven tension ----
  if (session.state === "tension") {
    const question = QUESTIONS[Math.min(q, QUESTIONS.length - 1)];
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
        {tphase === "count" ? (
          <div className="grow center-col" style={{ justifyContent: "center" }}>
            <span className="ex-count__num" style={{ color: "var(--white)" }}>{pcount}</span>
            <span className="mono" style={{ color: "var(--aqua)" }}>get ready…</span>
          </div>
        ) : gate ? (
          <div className="grow center-col" style={{ justifyContent: "center", gap: 16 }}>
            <p className="lede" style={{ color: "var(--white)", textAlign: "center" }}>Grant motion access to lean.</p>
            <button className="btn btn-dark" style={{ width: "auto" }} onClick={tilt.request}>Enable motion</button>
          </div>
        ) : tphase === "result" ? (
          <div className="grow center-col" style={{ justifyContent: "center", gap: 14 }}>
            <span className="step-tag">TIME'S UP</span>
            <h1 className="display" style={{ color: "var(--white)", textAlign: "center" }}>
              {locked ? (lockedSide === 0 ? question.left : question.right) : "no answer"}
            </h1>
            <p className="lede" style={{ color: "rgba(247,245,243,0.75)", textAlign: "center" }}>results are on the big screen — waiting for the host…</p>
          </div>
        ) : (
          <div className={`tension-tap ${locked ? "locked" : ""}`} onClick={lockAnswer}>
            <WaterTension q={question} tilt={shownTilt} locked={lockedSide} />
            {!tilt.supported && !locked && (
              <div className="lean-btns" onClick={(e) => e.stopPropagation()}>
                <button className="lean-btn" onClick={() => { tilt.setTilt(-0.85); }}>◀ {question.left}</button>
                <button className="lean-btn" onClick={() => { tilt.setTilt(0.85); }}>{question.right} ▶</button>
              </div>
            )}
            <span className="mono tension-tap__hint">
              {locked ? `✓ locked · ${lockedSide === 0 ? question.left : question.right} — waiting for the host` : "tap the screen to lock your lean"}
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

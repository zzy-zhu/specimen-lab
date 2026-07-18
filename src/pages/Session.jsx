import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CreateSpecimen, Twin } from "../screens";
import { WaterTension } from "../components/WaterTension";
import { NameCard } from "../components/NameCard";
import { Wordmark } from "../components/Wordmark";
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
  const { me, create, patch } = useMe();
  const room = useRoom();
  const session = useSession();

  const active = session.state === "tension";
  const tilt = useTilt(active && !!me);
  usePresence(me?.id, active && !!me);

  // guard: need day code (or existing id)
  useEffect(() => {
    if (!isSessionUnlocked() && !me) nav("/enter", { replace: true });
  }, [me, nav]);

  // record the current question's lean live as the host holds on it
  const lastWrite = useRef(-1);
  useEffect(() => {
    if (!active || !me) return;
    const side = tilt.tilt < -0.12 ? 0 : tilt.tilt > 0.12 ? 1 : null;
    if (side == null) return;
    const q = session.q ?? 0;
    const cur = me.answers?.[q];
    if (cur === side && lastWrite.current === q) return;
    const answers = [...(me.answers || [])];
    answers[q] = side;
    lastWrite.current = q;
    patch({ answers, part1Done: q >= QUESTIONS.length - 1 });
  }, [tilt.tilt, active, session.q, me, patch]);

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

  if (!me) {
    return <CreateSpecimen cta="Enter the waiting room →" onBack={() => nav("/enter")} onCreate={(d) => create(d)} />;
  }

  // ---- waiting room ----
  if (session.state === "lobby") {
    const count = room.length;
    return (
      <motion.div className="screen screen--space" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="topbar">
          <Wordmark size={17} stacked color="var(--white)" />
          <span className="eyebrow" style={{ color: "var(--white)" }}>WAITING ROOM</span>
        </div>
        <div className="grow center-col" style={{ justifyContent: "center", gap: 22 }}>
          <span className="lobby-pulse" />
          <h1 className="display" style={{ color: "var(--white)", textAlign: "center" }}>You're in.<br />Hold tight.</h1>
          <p className="lede" style={{ color: "rgba(247,245,243,0.8)", textAlign: "center" }}>
            The host will start the Creative Tension for everyone at once. Keep your phone in hand.
          </p>
          <span className="mono" style={{ color: "var(--aqua)" }}>◉ {count} specimens in the room</span>
        </div>
        <div style={{ marginTop: "auto" }}>
          <NameCard person={{ ...me, role: "you" }} image={me.image} variant="self" caption="ready" />
        </div>
      </motion.div>
    );
  }

  // ---- host-driven tension ----
  if (session.state === "tension") {
    const q = QUESTIONS[session.q ?? 0];
    const gate = tilt.needsPermission && tilt.permission !== "granted";
    return (
      <motion.div className="screen screen--space session-tension" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="topbar">
          <span className="mono" style={{ color: "var(--aqua)" }}>● LIVE · GUIDED</span>
          <span className="eyebrow" style={{ color: "var(--white)" }}>
            {String((session.q ?? 0) + 1).padStart(2, "0")} / {String(QUESTIONS.length).padStart(2, "0")}
          </span>
        </div>
        {gate ? (
          <div className="grow center-col" style={{ justifyContent: "center", gap: 16 }}>
            <p className="lede" style={{ color: "var(--white)", textAlign: "center" }}>Grant motion access to lean.</p>
            <button className="btn btn-dark" style={{ width: "auto" }} onClick={tilt.request}>Enable motion</button>
          </div>
        ) : (
          <WaterTension q={q} tilt={tilt.tilt} />
        )}
        <span className="mono session-wait">waiting for the host to advance…</span>
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

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FlipCard } from "../components/FlipCard";
import { NameCard } from "../components/NameCard";
import { WaveChart } from "../components/WaveChart";
import { Wordmark } from "../components/Wordmark";
import { useScene } from "../lib/atmosphere";
import { useEvent, useMe, useRoom } from "../lib/hooks";
import { findTwin, findShakeMatches } from "../data/lab";
import { matchmake, summarizeMatch, describeTwin } from "../lib/ai";

/* Your results — revisit your creative twin (Ex 01) and shake matches
   (Ex 02) any time. */
export function Results() {
  useScene({ tone: "space", accent: "aqua" });
  const nav = useNavigate();
  const { me } = useMe();
  const room = useRoom();
  const ev = useEvent();
  const QUESTIONS = ev.questions;

  const hasTension = !!me?.answers?.length;
  const hasShake = me?.shake != null;

  const twinPool = useMemo(() => room.filter((p) => p.id !== me?.id && p.answers?.length), [room, me]);
  const shakePool = useMemo(() => room.filter((p) => p.id !== me?.id && p.shake != null), [room, me]);

  const twinLocal = useMemo(() => (hasTension ? findTwin(me.answers, twinPool) : null), [hasTension, me, twinPool]);
  const freq = useMemo(() => (hasShake ? findShakeMatches(me.shake, shakePool) : null), [hasShake, me, shakePool]);

  const [twinReason, setTwinReason] = useState("");
  const [freqReason, setFreqReason] = useState("");

  // the host's pairing (me.twin) wins — we only ask for a line about it
  const storedTwin = useMemo(() => {
    if (!me?.twin?.id) return null;
    const live = room.find((p) => p.id === me.twin.id);
    return { ...me.twin, ...live };
  }, [me, room]);

  useEffect(() => {
    if (!hasTension || !me) return;
    let alive = true;
    const done = (r) => { if (alive && r.reason) setTwinReason(r.reason); };
    if (storedTwin) describeTwin(me, storedTwin, me.twin.shared, me.twin.total).then(done);
    else matchmake(me, twinPool).then(done);
    return () => { alive = false; };
  }, [hasTension, me, twinPool, storedTwin]);

  useEffect(() => {
    if (!hasShake || !freq?.similar) return;
    let alive = true;
    summarizeMatch(me, freq.similar).then((r) => { if (alive) setFreqReason(r.reason); });
    return () => { alive = false; };
  }, [hasShake, me, freq]);

  if (!me) { nav("/enter", { replace: true }); return null; }

  return (
    <motion.div className="screen screen--space" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="topbar">
        <button className="wordmark-btn" onClick={() => nav("/")}><Wordmark size={17} stacked color="var(--white)" /></button>
        <div className="topbar__right">
          <button className="backchip mono" onClick={() => nav("/menu")}>↩ menu</button>
          <span className="eyebrow" style={{ color: "var(--white)" }}>YOUR RESULTS</span>
        </div>
      </div>

      {!hasTension && !hasShake && (
        <div className="grow center-col" style={{ justifyContent: "center", gap: 12 }}>
          <span className="step-tag">NOTHING YET</span>
          <h1 className="display" style={{ color: "var(--white)", textAlign: "center" }}>Play to<br />see results</h1>
          <p className="lede" style={{ color: "rgba(247,245,243,0.75)", textAlign: "center" }}>
            Your creative twin and shake matches show up here after each exercise.
          </p>
        </div>
      )}

      {hasTension && (
        <section style={{ marginTop: 8 }}>
          <span className="step-tag">CREATIVE TWIN</span>
          <p className="lede" style={{ color: "rgba(247,245,243,0.75)", margin: "8px 0 14px" }}>
            You agreed on {me.twin?.shared ?? twinLocal?.shared}/{me.twin?.total ?? twinLocal?.total ?? QUESTIONS.length} tensions.
          </p>
          {storedTwin?.name ? (
            <FlipCard person={storedTwin} image={storedTwin.image} variant="twin"
              reason={twinReason || `“${storedTwin.idea || "still forming an idea"}”`} autoFlipMs={700} />
          ) : twinLocal?.twin ? (
            <FlipCard person={twinLocal.twin} image={twinLocal.twin.image} variant="twin"
              reason={twinReason || `“${twinLocal.twin.idea || "still forming an idea"}”`} autoFlipMs={700} />
          ) : (
            <p className="lede" style={{ color: "rgba(247,245,243,0.6)" }}>No twin yet — you may be the only one who has answered.</p>
          )}
        </section>
      )}

      {hasShake && (
        <section style={{ marginTop: 26 }}>
          <span className="step-tag">YOUR FREQUENCY</span>
          <WaveChart wave={me.wave || []} height={90} />
          <p className="mono" style={{ opacity: 0.6, margin: "4px 0 14px" }}>intensity {me.shake}</p>
          <div className="stack gap-14">
            {freq?.similar && <NameCard person={freq.similar} image={freq.similar.image} variant="similar" caption={freqReason || "closest rhythm"} />}
            {freq?.different && <NameCard person={freq.different} image={freq.different.image} variant="different" caption="furthest rhythm" />}
            {!freq?.similar && <p className="lede" style={{ color: "rgba(247,245,243,0.6)" }}>No one else has shaken yet.</p>}
          </div>
        </section>
      )}

      <div className="footer-actions">
        {ev.parts.lab
          ? <button className="btn btn-primary" onClick={() => nav("/map")}>Open the connection map →</button>
          : <button className="btn btn-primary" onClick={() => nav("/menu")}>Back to the menu →</button>}
        {ev.ig && (
          <a className="linklike mono" href={ev.ig.url} target="_blank" rel="noreferrer">
            {ev.ig.label} on Instagram · {ev.ig.handle} ↗
          </a>
        )}
        {ev.parts.lab && <button className="linklike mono" onClick={() => nav("/menu")}>← back to the menu</button>}
      </div>
    </motion.div>
  );
}

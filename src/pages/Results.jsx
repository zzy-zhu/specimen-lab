import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FlipCard } from "../components/FlipCard";
import { NameCard } from "../components/NameCard";
import { WaveChart } from "../components/WaveChart";
import { Wordmark } from "../components/Wordmark";
import { useScene } from "../lib/atmosphere";
import { useMe, useRoom } from "../lib/hooks";
import { findTwin, findShakeMatches, QUESTIONS } from "../data/lab";
import { matchmake, summarizeMatch } from "../lib/ai";

/* Your results — revisit your creative twin (Ex 01) and shake matches
   (Ex 02) any time. */
export function Results() {
  useScene({ tone: "space", accent: "aqua" });
  const nav = useNavigate();
  const { me } = useMe();
  const room = useRoom();

  const hasTension = !!me?.answers?.length;
  const hasShake = me?.shake != null;

  const twinPool = useMemo(() => room.filter((p) => p.id !== me?.id && p.answers?.length), [room, me]);
  const shakePool = useMemo(() => room.filter((p) => p.id !== me?.id && p.shake != null), [room, me]);

  const twinLocal = useMemo(() => (hasTension ? findTwin(me.answers, twinPool) : null), [hasTension, me, twinPool]);
  const freq = useMemo(() => (hasShake ? findShakeMatches(me.shake, shakePool) : null), [hasShake, me, shakePool]);

  const [twinReason, setTwinReason] = useState("");
  const [freqReason, setFreqReason] = useState("");

  useEffect(() => {
    if (!hasTension || !me) return;
    let alive = true;
    matchmake(me, twinPool).then((r) => { if (alive && r.reason) setTwinReason(r.reason); });
    return () => { alive = false; };
  }, [hasTension, me, twinPool]);

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
          <span className="step-tag">EVENT 01 · CREATIVE TWIN</span>
          <p className="lede" style={{ color: "rgba(247,245,243,0.75)", margin: "8px 0 14px" }}>
            You agreed on {me.twin?.shared ?? twinLocal?.shared}/{me.twin?.total ?? twinLocal?.total ?? QUESTIONS.length} tensions.
          </p>
          {me.twin?.name ? (
            <FlipCard person={me.twin} image={me.twin.image} variant="twin"
              reason={twinReason || me.twin.reason || `“${me.twin.idea || "still forming an idea"}”`} autoFlipMs={700} />
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
          <span className="step-tag">EVENT 02 · YOUR FREQUENCY</span>
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
        <button className="btn btn-primary" onClick={() => nav("/map")}>Open the connection map →</button>
        <button className="linklike mono" onClick={() => nav("/menu")}>← back to the menu</button>
      </div>
    </motion.div>
  );
}

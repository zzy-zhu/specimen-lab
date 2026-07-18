import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { WaveChart } from "./WaveChart";
import { FlipCard } from "./FlipCard";
import { Wordmark } from "./Wordmark";
import { findShakeMatches } from "../data/lab";
import { summarizeMatch } from "../lib/ai";

/* After the shake: your wave signature + the closest rhythm in the room,
   with an AI note on why you match (ideas + shake). */
export function ShakeResult({ me, people }) {
  const nav = useNavigate();
  const pool = useMemo(() => people.filter((p) => p.id !== me.id && p.shake != null), [people, me]);
  const match = useMemo(() => (me.shake != null ? findShakeMatches(me.shake, pool) : {}), [me, pool]);
  const closest = match.similar;
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!closest) return;
    let alive = true;
    summarizeMatch(me, closest).then((r) => { if (alive) setReason(r.reason); });
    return () => { alive = false; };
  }, [closest, me]);

  return (
    <motion.div className="screen screen--space" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="topbar">
        <button className="wordmark-btn" onClick={() => nav("/")}><Wordmark size={17} stacked color="var(--white)" /></button>
        <div className="topbar__right">
          <button className="backchip mono" onClick={() => nav("/menu")}>↩ menu</button>
          <span className="eyebrow" style={{ color: "var(--white)" }}>OPEN LAB · MATCH</span>
        </div>
      </div>

      <span className="step-tag">YOUR SHAKE SIGNATURE</span>
      <WaveChart wave={me.wave || []} height={100} />
      <p className="mono" style={{ opacity: 0.6, marginTop: 4 }}>intensity {me.shake}</p>

      <h1 className="display" style={{ color: "var(--white)", fontSize: "clamp(26px,7.5vw,38px)", marginTop: 14 }}>
        Closest<br />rhythm
      </h1>

      <div style={{ marginTop: 16 }}>
        {closest ? (
          <FlipCard person={closest} image={closest.image} variant="similar" reason={reason || "finding the words…"} label="MATCHING RHYTHMS" autoFlipMs={1100} />
        ) : (
          <p className="lede" style={{ color: "rgba(247,245,243,0.8)" }}>
            No one else has shaken yet — you're the first frequency in the room.
          </p>
        )}
      </div>

      <span className="mono session-wait">waiting for the host to grow the Wood Wide Web…</span>
    </motion.div>
  );
}

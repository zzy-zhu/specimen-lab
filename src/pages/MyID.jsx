import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { NameCard } from "../components/NameCard";
import { Wordmark } from "../components/Wordmark";
import { useScene } from "../lib/atmosphere";
import { useMe, useRoom } from "../lib/hooks";
import { findTwin, findShakeMatches } from "../data/lab";
import { unlockSession } from "../lib/store";

export function MyID() {
  useScene({ tone: "space", accent: "aqua" });
  const nav = useNavigate();
  const { me, login, logout } = useMe();
  const room = useRoom();
  const [handle, setHandle] = useState("");
  const [passcode, setPasscode] = useState("");
  const [err, setErr] = useState("");

  const pool = useMemo(() => room.filter((p) => p.id !== me?.id), [room, me]);
  const twin = useMemo(
    () => (me?.answers?.length ? findTwin(me.answers, pool.filter((p) => p.answers?.length)) : null),
    [me, pool]
  );
  const freq = useMemo(
    () => (me?.shake != null ? findShakeMatches(me.shake, pool.filter((p) => p.shake != null)) : null),
    [me, pool]
  );

  const submit = async () => {
    const r = await login(handle, passcode);
    if (!r.ok) setErr(r.reason === "not-found" ? "no specimen with that handle" : "wrong passcode");
    else { setErr(""); unlockSession(); }
  };

  if (!me) {
    return (
      <motion.div className="screen screen--space" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="topbar">
          <button className="wordmark-btn" onClick={() => nav("/")}><Wordmark size={17} stacked color="var(--white)" /></button>
          <span className="eyebrow" style={{ color: "var(--white)" }}>ACCESS · ID</span>
        </div>
        <span className="step-tag">RETURNING SPECIMEN</span>
        <h1 className="display" style={{ color: "var(--white)", marginTop: 10 }}>Access<br />your ID</h1>
        <p className="lede" style={{ color: "rgba(247,245,243,0.8)", marginTop: 10 }}>
          Attended a Specimen.lab before? Re-open your specimen with your handle and passcode.
        </p>

        <div className="stack gap-14" style={{ marginTop: 24 }}>
          <label className="stack gap-8">
            <span className="eyebrow" style={{ color: "var(--white)" }}>HANDLE</span>
            <input className="field field--dark" placeholder="@yourhandle" value={handle} onChange={(e) => setHandle(e.target.value)} />
          </label>
          <label className="stack gap-8">
            <span className="eyebrow" style={{ color: "var(--white)" }}>PASSCODE</span>
            <input className="field field--dark" value={passcode} onChange={(e) => setPasscode(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} />
          </label>
          {err && <span className="mono" style={{ color: "var(--red)" }}>⌀ {err}</span>}
        </div>

        <div className="footer-actions">
          <button className="btn btn-primary" disabled={!handle || !passcode} onClick={submit}>Open my specimen →</button>
          <button className="linklike mono" onClick={() => nav("/tension")}>new here? create a specimen →</button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div className="screen screen--space" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="topbar">
        <button className="wordmark-btn" onClick={() => nav("/")}><Wordmark size={17} stacked color="var(--white)" /></button>
        <span className="eyebrow" style={{ color: "var(--white)" }}>SPECIMEN · ID</span>
      </div>

      <span className="step-tag">YOUR SPECIMEN</span>
      <motion.div style={{ marginTop: 14 }} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
        <NameCard person={{ ...me, role: `@${me.handle}` }} image={me.image} variant="self" caption={me.idea ? `“${me.idea}”` : "idea not captured yet"} />
      </motion.div>

      <div className="id-progress">
        <span className={`id-pill mono ${me.part1Done ? "done" : ""}`}>{me.part1Done ? "✓" : "○"} Part 01 · Tension</span>
        <span className={`id-pill mono ${me.part2Done ? "done" : ""}`}>{me.part2Done ? "✓" : "○"} Part 02 · Open Lab</span>
      </div>

      <div className="stack gap-14" style={{ marginTop: 18 }}>
        {twin?.twin && <NameCard person={twin.twin} image={twin.twin.image} variant="twin" caption={`creative twin · agreed on ${twin.shared}/${twin.total}`} />}
        {freq?.similar && <NameCard person={freq.similar} image={freq.similar.image} variant="similar" caption="closest frequency" />}
        {freq?.different && <NameCard person={freq.different} image={freq.different.image} variant="different" caption="furthest frequency" />}
      </div>

      <div className="footer-actions">
        <button className="btn btn-primary" onClick={() => nav("/menu")}>Enter the menu →</button>
        {!me.part1Done && <button className="btn btn-ghost" onClick={() => nav("/tension")}>Do Part 01 →</button>}
        {me.part1Done && !me.part2Done && <button className="btn btn-ghost" onClick={() => nav("/lab")}>Do Part 02 →</button>}
        {me.part1Done && me.part2Done && <button className="btn btn-ghost" onClick={() => nav("/lab")}>Revisit the Wood Wide Web →</button>}
        <button className="linklike mono" onClick={() => { logout(); }}>sign out</button>
      </div>
    </motion.div>
  );
}

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { NameCard } from "../components/NameCard";
import { Wordmark } from "../components/Wordmark";
import { useScene } from "../lib/atmosphere";
import { useEvent, useMe, useRoom } from "../lib/hooks";
import { unlockSession, deleteSpecimen } from "../lib/store";
import { resetIntro } from "../lib/prefs";

export function MyID() {
  useScene({ tone: "space", accent: "aqua" });
  const nav = useNavigate();
  const { me, login, logout } = useMe();
  const room = useRoom();
  const ev = useEvent();
  const [handle, setHandle] = useState("");
  const [passcode, setPasscode] = useState("");
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    if (!me) return;
    const url = `${window.location.origin}/p/${me.handle}`;
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch { /* noop */ }
  };
  const clearData = () => {
    if (!me) return;
    if (!window.confirm("Clear your specimen data and replay the intro next time?")) return;
    deleteSpecimen(me.id);
    resetIntro();
    nav("/");
  };

  const others = useMemo(() => room.filter((p) => p.id !== me?.id), [room, me]);

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
        {ev.parts.lab && (
          <span className={`id-pill mono ${me.part2Done ? "done" : ""}`}>{me.part2Done ? "✓" : "○"} Part 02 · Open Lab</span>
        )}
      </div>

      <div className="id-btns">
        <button className="btn btn-ghost" onClick={() => nav("/create")}>✎ Edit profile</button>
        {ev.parts.lab && <button className="btn btn-ghost" onClick={() => nav("/map")}>◍ Connection map</button>}
      </div>
      <button className="id-link mono" onClick={copyLink}>
        {copied ? "✓ link copied" : `◇ share your profile — /p/${me.handle}`}
      </button>

      {/* who's registered in the room right now */}
      <div style={{ marginTop: 24 }}>
        <span className="eyebrow" style={{ color: "var(--white)" }}>IN THE ROOM · {others.length}</span>
        {others.length === 0 ? (
          <p className="lede" style={{ color: "rgba(247,245,243,0.7)", marginTop: 8 }}>
            No one else has registered yet. Their cards appear here as they join.
          </p>
        ) : (
          <div className="people-grid">
            {others.map((p) => (
              <button key={p.id} className="people-tile" onClick={() => nav(`/p/${p.handle}`)}>
                <div className="people-tile__img">
                  {p.image ? <img src={p.image} alt="" /> : <span>{p.name?.[0] || "?"}</span>}
                </div>
                <span className="people-tile__name mono">{p.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="footer-actions">
        <button className="btn btn-primary" onClick={() => nav("/menu")}>Back to the menu →</button>
        <div className="id-actions">
          <button className="linklike mono" onClick={() => { logout(); }}>sign out</button>
          <button className="linklike mono" style={{ color: "var(--red)" }} onClick={clearData}>clear my data & replay</button>
        </div>
      </div>
    </motion.div>
  );
}

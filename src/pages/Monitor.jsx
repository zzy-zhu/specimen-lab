import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { WoodWideWeb } from "../components/WoodWideWeb";
import { LiveSwarm } from "../components/LiveSwarm";
import { Wordmark, FuturePixelMark } from "../components/Wordmark";
import { useScene, ListenButton } from "../lib/atmosphere";
import { useRoom, useSession } from "../lib/hooks";
import { QUESTIONS } from "../data/lab";
import { summarizeIdeas } from "../lib/ai";
import { resetRoom, setSession } from "../lib/store";

const PASSCODE = "specimen.lab2026";
const KEY = "specimen.lab.monitor.ok";

export function Monitor() {
  const [ok, setOk] = useState(() => sessionStorage.getItem(KEY) === "1");
  return ok ? <Dashboard /> : <Gate onOk={() => { sessionStorage.setItem(KEY, "1"); setOk(true); }} />;
}

function Gate({ onOk }) {
  const nav = useNavigate();
  useScene({ tone: "space", accent: "aqua" });
  const [pc, setPc] = useState("");
  const [err, setErr] = useState(false);
  const submit = () => (pc.trim() === PASSCODE ? onOk() : setErr(true));
  return (
    <motion.div className="screen screen--space" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="topbar">
        <button className="wordmark-btn" onClick={() => nav("/")}><Wordmark size={17} stacked color="var(--white)" /></button>
        <span className="eyebrow" style={{ color: "var(--white)" }}>ORGANIZER</span>
      </div>
      <div className="grow center-col" style={{ justifyContent: "center", gap: 18 }}>
        <span className="step-tag">RESTRICTED · MONITOR</span>
        <h1 className="display" style={{ color: "var(--white)", textAlign: "center" }}>Room<br />monitor</h1>
        <input
          className="field field--dark"
          style={{ maxWidth: 300, textAlign: "center" }}
          type="password"
          placeholder="passcode"
          value={pc}
          onChange={(e) => { setPc(e.target.value); setErr(false); }}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          autoFocus
        />
        {err && <span className="mono" style={{ color: "var(--red)" }}>⌀ incorrect passcode</span>}
        <button className="btn btn-primary" style={{ maxWidth: 300 }} onClick={submit}>Unlock →</button>
      </div>
    </motion.div>
  );
}

function Dashboard() {
  const nav = useNavigate();
  useScene({ tone: "space", accent: "aqua" });
  const room = useRoom();
  const session = useSession();
  const [ai, setAi] = useState(null);

  const q = session.q ?? 0;
  const st = session.state;
  const answeredQ = room.filter((p) => p.answers?.[q] != null).length;
  const ideaCount = room.filter((p) => (p.idea || "").trim()).length;
  const shakeCount = room.filter((p) => p.shake != null).length;

  const LABELS = {
    lobby: "EVENT 01 · WAITING ROOM",
    tension: `TENSION · Q${q + 1}/${QUESTIONS.length}`,
    twin: "TWIN REVEAL",
    "lab-lobby": "EVENT 02 · WAITING ROOM",
    idea: "OPEN LAB · CAPTURE IDEA",
    shake: "OPEN LAB · SHAKE TO CONNECT",
    web: "WOOD WIDE WEB",
  };
  const NEXT_LABEL = {
    lobby: "▶ Start Event 01 · Tension",
    tension: q + 1 >= QUESTIONS.length ? "Reveal twins ▶" : "Next question ▶",
    twin: "▶ Start Event 02 · Open Lab",
    "lab-lobby": "Capture ideas ▶",
    idea: "Shake to connect ▶",
    shake: "Grow the web ▶",
    web: "↺ Finish → Lobby",
  };
  const next = () => {
    if (st === "lobby") return setSession({ state: "tension", q: 0 });
    if (st === "tension") return q + 1 >= QUESTIONS.length ? setSession({ state: "twin" }) : setSession({ q: q + 1 });
    if (st === "twin") return setSession({ state: "lab-lobby" });
    if (st === "lab-lobby") return setSession({ state: "idea" });
    if (st === "idea") return setSession({ state: "shake" });
    if (st === "shake") return setSession({ state: "web" });
    return setSession({ state: "lobby", q: 0 });
  };
  const prevQ = () => setSession({ q: Math.max(0, q - 1) });
  const toLobby = () => setSession({ state: "lobby", q: 0 });

  const withIdeas = useMemo(() => room.filter((p) => (p.idea || "").trim()), [room]);
  const p1 = room.filter((p) => p.part1Done || p.answers?.length).length;
  const p2 = room.filter((p) => p.part2Done || p.shake != null).length;

  // re-run AI synthesis whenever the set of ideas changes
  useEffect(() => {
    let alive = true;
    summarizeIdeas(room).then((r) => alive && setAi(r));
    return () => { alive = false; };
  }, [withIdeas.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const tension = QUESTIONS.map((q, i) => {
    const voters = room.filter((p) => p.answers?.length > i);
    const right = voters.filter((p) => p.answers[i] === 1).length;
    const total = voters.length || 1;
    return { q, rightPct: Math.round((right / total) * 100), voters: voters.length };
  });

  return (
    <div className="monitor">
      <header className="monitor__head">
        <div>
          <Wordmark size={22} stacked color="var(--white)" />
          <span className="mono monitor__live">● LIVE · listening to the room</span>
        </div>
        <div className="monitor__head-right">
          <ListenButton />
          <span className="mono monitor__stat"><b>{room.length}</b> specimens</span>
          <span className="mono monitor__stat"><b>{p1}</b> tension</span>
          <span className="mono monitor__stat"><b>{p2}</b> lab</span>
        </div>
      </header>

      {/* host control bar — walks the whole room through both events */}
      <div className="host-bar">
        <span className="host-bar__state mono">
          NOW: <b>{LABELS[st] || st}</b>
          {st === "tension" && <span className="host-bar__ans"> · {answeredQ}/{room.length} answered</span>}
          {st === "idea" && <span className="host-bar__ans"> · {ideaCount}/{room.length} ideas</span>}
          {st === "shake" && <span className="host-bar__ans"> · {shakeCount}/{room.length} shook</span>}
        </span>
        <div className="host-bar__btns">
          {st === "tension" && <button className="host-btn" onClick={prevQ} disabled={q === 0}>◀ Prev</button>}
          <button className="host-btn go" onClick={next}>{NEXT_LABEL[st]}</button>
          <button className="host-btn" onClick={toLobby}>↺ Reset game</button>
        </div>
      </div>

      {st === "tension" ? (
        /* Exercise 01 — only the moving part */
        <section className="monitor__swarm monitor__swarm--full">
          <span className="panel-tag mono">LIVE ROOM — {LABELS[st]} · headshots move as people lean</span>
          <LiveSwarm people={room} />
        </section>
      ) : (
        <div className="monitor__grid">
          <div className="monitor__left">
            <section className="monitor__swarm">
              <span className="panel-tag mono">LIVE ROOM — headshots move with each phone</span>
              <LiveSwarm people={room} />
            </section>
            <section className="monitor__web">
              <span className="panel-tag mono">THE WOOD WIDE WEB — every specimen, every root</span>
              <WoodWideWeb people={room} dark />
            </section>
          </div>
          <div className="monitor__side">
            <section className="panel">
              <span className="panel-tag mono">CREATIVE TENSION — RESULTS</span>
              <div className="stack gap-14" style={{ marginTop: 12 }}>
                {tension.map(({ q, rightPct, voters }) => (
                  <div key={q.id} className="mtension">
                    <div className="mtension__row mono"><span>{q.glyph} {q.left}</span><span>{q.right}</span></div>
                    <div className="mtension__track">
                      <motion.div className="mtension__fill" animate={{ width: `${100 - rightPct}%` }} transition={{ duration: 0.7 }} />
                      <span className="mtension__pct mono">{100 - rightPct} · {rightPct}</span>
                    </div>
                    <span className="mono mtension__n">{voters} votes</span>
                  </div>
                ))}
              </div>
            </section>
            <section className="panel">
              <span className="panel-tag mono">✦ AI SYNTHESIS {ai ? `· ${ai.source === "claude" ? "Claude" : "local"}` : "· reading…"}</span>
              <p className="monitor__overview">{ai?.overview || "Waiting for ideas to surface…"}</p>
              <div className="ai-clusters">
                {ai?.clusters?.map((c) => (
                  <div key={c.label} className="ai-cluster">
                    <div className="ai-cluster__head"><span className="ai-cluster__label">{c.label}</span><span className="mono">×{c.count}</span></div>
                    <p className="ai-cluster__sum">{c.summary}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}

      <footer className="monitor__foot">
        <FuturePixelMark color="var(--white)" />
        <div className="monitor__foot-actions">
          <button className="host-btn" onClick={() => { if (window.confirm("Clear ALL specimens + data from the room? This cannot be undone.")) resetRoom(); }}>⌫ Clear all users & data</button>
          <button className="linklike mono dim" onClick={() => nav("/")}>exit monitor</button>
        </div>
      </footer>
    </div>
  );
}

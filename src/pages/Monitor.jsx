import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { WoodWideWeb } from "../components/WoodWideWeb";
import { LiveSwarm } from "../components/LiveSwarm";
import { NameCard } from "../components/NameCard";
import { Wordmark, FuturePixelMark } from "../components/Wordmark";
import { useScene, ListenButton } from "../lib/atmosphere";
import { useRoom, useSession } from "../lib/hooks";
import { QUESTIONS } from "../data/lab";
import { summarizeIdeas } from "../lib/ai";
import { resetRoom, setSession } from "../lib/store";

const PASSCODE = "fph2026";
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
  const submit = () => (pc.trim().toLowerCase() === PASSCODE ? onOk() : setErr(true));
  return (
    <motion.div className="screen screen--space" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="topbar">
        <button className="wordmark-btn" onClick={() => nav("/")}><Wordmark size={17} stacked color="var(--white)" /></button>
        <span className="eyebrow" style={{ color: "var(--white)" }}>ORGANIZER</span>
      </div>
      <div className="grow center-col" style={{ justifyContent: "center", gap: 18 }}>
        <span className="step-tag">RESTRICTED · MONITOR</span>
        <h1 className="display" style={{ color: "var(--white)", textAlign: "center" }}>Room<br />monitor</h1>
        <input className="field field--dark" style={{ maxWidth: 260, textAlign: "center", letterSpacing: "0.3em" }}
          type="password" placeholder="passcode" value={pc}
          onChange={(e) => { setPc(e.target.value); setErr(false); }}
          onKeyDown={(e) => e.key === "Enter" && submit()} autoFocus />
        {err && <span className="mono" style={{ color: "var(--red)" }}>⌀ incorrect passcode</span>}
        <button className="btn btn-primary" style={{ maxWidth: 260 }} onClick={submit}>Unlock →</button>
      </div>
    </motion.div>
  );
}

function Dashboard() {
  const nav = useNavigate();
  useScene({ tone: "space", accent: "aqua" });
  const room = useRoom();
  const session = useSession();
  const [view, setView] = useState("menu"); // menu | users | tension | lab
  const [ai, setAi] = useState(null);

  const st = session.state;
  const q = session.q ?? 0;
  const answeredQ = room.filter((p) => p.answers?.[q] != null).length;
  const ideaCount = room.filter((p) => (p.idea || "").trim()).length;
  const shakeCount = room.filter((p) => p.shake != null).length;
  const withIdeas = useMemo(() => room.filter((p) => (p.idea || "").trim()), [room]);

  useEffect(() => {
    if (view !== "lab") return;
    let alive = true;
    summarizeIdeas(room).then((r) => alive && setAi(r));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, withIdeas.length]);

  const clearAll = () => { if (window.confirm("Clear ALL specimens + data from the room? This cannot be undone.")) resetRoom(); };

  // ---- header (shared) ----
  const Header = () => (
    <header className="monitor__head">
      <div>
        <button className="wordmark-btn" onClick={() => setView("menu")}><Wordmark size={22} stacked color="var(--white)" /></button>
        <span className="mono monitor__live">● LIVE{view !== "menu" ? " · " + view.toUpperCase() : ""}</span>
      </div>
      <div className="monitor__head-right">
        <ListenButton />
        <span className="mono monitor__stat"><b>{room.length}</b> specimens</span>
        {view !== "menu" && <button className="backchip mono" onClick={() => setView("menu")}>↩ monitor menu</button>}
      </div>
    </header>
  );

  return (
    <div className="monitor">
      <Header />

      {view === "menu" && (
        <div className="mon-menu">
          <button className="mon-card" onClick={() => setView("users")}>
            <span className="mon-card__no mono">◍</span>
            <h2>View all users</h2>
            <p>Everyone registered — cards + the live connection map.</p>
            <span className="mon-card__meta mono">{room.length} in the room</span>
          </button>
          <button className="mon-card" onClick={() => setView("tension")}>
            <span className="mon-card__no mono">01</span>
            <h2>Creative Tension</h2>
            <p>Start & reset the guided tilt game. Headshots move as people lean.</p>
            <span className="mon-card__meta mono">{st === "tension" ? `live · Q${q + 1}/${QUESTIONS.length}` : "not started"}</span>
          </button>
          <button className="mon-card" onClick={() => setView("lab")}>
            <span className="mon-card__no mono">02</span>
            <h2>Open Lab</h2>
            <p>Ideas, shake-to-connect, and the Wood Wide Web. Manual start.</p>
            <span className="mon-card__meta mono">{["lab-lobby", "idea", "shake", "web"].includes(st) ? "live · " + st : "not started"}</span>
          </button>
        </div>
      )}

      {view === "users" && (
        <div className="monitor__grid">
          <section className="monitor__web">
            <span className="panel-tag mono">CONNECTION MAP — {room.length} specimens</span>
            {room.length ? <WoodWideWeb people={room} dark /> : <Empty text="No specimens registered yet." />}
          </section>
          <section className="monitor__side monitor__cards">
            <span className="panel-tag mono">ALL SPECIMENS</span>
            {room.length ? (
              <div className="mon-card-grid">
                {room.map((p) => (
                  <NameCard key={p.id} person={{ ...p, role: `@${p.handle}` }} image={p.image} variant="self"
                    caption={p.idea ? `“${p.idea}”` : undefined} />
                ))}
              </div>
            ) : <Empty text="Cards appear here as people join." />}
          </section>
        </div>
      )}

      {view === "tension" && (
        <>
          <ControlBar
            label={st === "tension" ? `CREATIVE TENSION · Q${q + 1}/${QUESTIONS.length} · ${answeredQ}/${room.length} answered` : "CREATIVE TENSION · READY"}
            buttons={
              st === "tension" ? (
                <>
                  <button className="host-btn" onClick={() => setSession({ q: Math.max(0, q - 1) })} disabled={q === 0}>◀ Prev</button>
                  <button className="host-btn go" onClick={() => (q + 1 >= QUESTIONS.length ? setSession({ state: "twin" }) : setSession({ q: q + 1 }))}>
                    {q + 1 >= QUESTIONS.length ? "Reveal twins ▶" : "Next question ▶"}
                  </button>
                  <button className="host-btn" onClick={() => setSession({ state: "lobby", q: 0 })}>↺ Reset</button>
                </>
              ) : (
                <button className="host-btn go" onClick={() => setSession({ state: "tension", q: 0 })}>▶ Start Creative Tension</button>
              )
            }
          />
          <section className="monitor__swarm monitor__swarm--full">
            <span className="panel-tag mono">LIVE ROOM — headshots move as people lean · locked = frozen & bigger</span>
            {room.length ? <LiveSwarm people={room} lockedQ={st === "tension" ? q : null} /> : <Empty text="Waiting for specimens to join…" />}
          </section>
        </>
      )}

      {view === "lab" && (
        <>
          <ControlBar
            label={`OPEN LAB · ${st === "idea" ? `${ideaCount}/${room.length} ideas` : st === "shake" ? `${shakeCount}/${room.length} shook` : st === "web" ? "wood wide web" : "ready"}`}
            buttons={<LabButtons st={st} />}
          />
          <div className="monitor__grid">
            <section className="monitor__web">
              <span className="panel-tag mono">LIVE ROOM</span>
              {room.length ? (st === "web" ? <WoodWideWeb people={room} dark /> : <LiveSwarm people={room} />) : <Empty text="Waiting for specimens…" />}
            </section>
            <section className="monitor__side">
              <div className="panel">
                <span className="panel-tag mono">✦ AI SYNTHESIS {ai ? `· ${ai.source === "claude" ? "Claude" : "local"}` : "· reading…"}</span>
                <p className="monitor__overview">{ai?.overview || "Ideas will be synthesized here as they come in."}</p>
                <div className="ai-clusters">
                  {ai?.clusters?.map((c) => (
                    <div key={c.label} className="ai-cluster">
                      <div className="ai-cluster__head"><span className="ai-cluster__label">{c.label}</span><span className="mono">×{c.count}</span></div>
                      <p className="ai-cluster__sum">{c.summary}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </>
      )}

      <footer className="monitor__foot">
        <FuturePixelMark color="var(--white)" />
        <div className="monitor__foot-actions">
          <button className="host-btn" onClick={clearAll}>⌫ Clear all users & data</button>
          <button className="linklike mono dim" onClick={() => nav("/")}>exit monitor</button>
        </div>
      </footer>
    </div>
  );
}

function LabButtons({ st }) {
  const inLab = ["lab-lobby", "idea", "shake", "web"].includes(st);
  const nextLabel = { "lab-lobby": "Capture ideas ▶", idea: "Shake to connect ▶", shake: "Grow the web ▶", web: "↺ Finish → Lobby" };
  const next = () => {
    if (st === "lab-lobby") return setSession({ state: "idea" });
    if (st === "idea") return setSession({ state: "shake" });
    if (st === "shake") return setSession({ state: "web" });
    return setSession({ state: "lobby", q: 0 });
  };
  if (!inLab) return <button className="host-btn go" onClick={() => setSession({ state: "lab-lobby" })}>▶ Start Open Lab</button>;
  return (
    <>
      <button className="host-btn go" onClick={next}>{nextLabel[st]}</button>
      <button className="host-btn" onClick={() => setSession({ state: "lobby", q: 0 })}>↺ Reset</button>
    </>
  );
}

function ControlBar({ label, buttons }) {
  return (
    <div className="host-bar">
      <span className="host-bar__state mono">NOW: <b>{label}</b></span>
      <div className="host-bar__btns">{buttons}</div>
    </div>
  );
}

function Empty({ text }) {
  return <div className="mon-empty mono">{text}</div>;
}

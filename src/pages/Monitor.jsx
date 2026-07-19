import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { WoodWideWeb } from "../components/WoodWideWeb";
import { LiveSwarm } from "../components/LiveSwarm";
import { NameCard } from "../components/NameCard";
import { Wordmark, FuturePixelMark } from "../components/Wordmark";
import { useScene, ListenButton } from "../lib/atmosphere";
import { useRoom, useSession } from "../lib/hooks";
import { QUESTIONS, findTwin } from "../data/lab";
import { ARTISTS } from "../data/artists";
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
  const [view, setView] = useState("menu"); // menu | users | tension | lab | labbie | matches
  const [ai, setAi] = useState(null);
  const [mq, setMq] = useState("");

  const st = session.state;
  const q = session.q ?? 0;
  const answeredQ = room.filter((p) => p.answers?.[q] != null).length;
  const ideaCount = room.filter((p) => (p.idea || "").trim()).length;
  const shakeCount = room.filter((p) => p.shake != null).length;
  const withIdeas = useMemo(() => room.filter((p) => (p.idea || "").trim()), [room]);
  const tphase = session.tphase || "ask";

  // 3-2-1 countdown at the start of the tension game
  const [count, setCount] = useState(3);
  useEffect(() => {
    if (!(st === "tension" && tphase === "count")) return;
    setCount(3);
    const t1 = setTimeout(() => setCount(2), 1000);
    const t2 = setTimeout(() => setCount(1), 2000);
    const t3 = setTimeout(() => setSession({ tphase: "ask" }), 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [st, tphase, session.q]);

  useEffect(() => {
    if (view !== "lab") return;
    let alive = true;
    summarizeIdeas(room).then((r) => alive && setAi(r));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, withIdeas.length]);

  const clearAll = () => { if (window.confirm("Clear ALL specimens + data from the room? This cannot be undone.")) resetRoom(); };

  // matches dashboard rows (prefer stored twin, else compute live)
  const answered = useMemo(() => room.filter((p) => p.answers?.length), [room]);
  const matchRows = useMemo(() => {
    return answered.map((p) => {
      const t = p.twin || (() => { const r = findTwin(p.answers, answered.filter((o) => o.id !== p.id)); return r.twin ? { name: r.twin.name, shared: r.shared, total: r.total, reason: "" } : null; })();
      return {
        id: p.id, name: p.name || "—", handle: p.handle,
        twinName: t?.name || "—", shared: t?.shared ?? 0, total: t?.total ?? QUESTIONS.length,
        idea: p.idea, shake: p.shake,
      };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [answered]);
  const filteredRows = matchRows.filter((r) => !mq || (r.name + r.twinName).toLowerCase().includes(mq.toLowerCase()));

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
          <button className="mon-card" onClick={() => setView("matches")}>
            <span className="mon-card__no mono">⇄</span>
            <h2>Matches</h2>
            <p>Everyone's creative twin — pull up a result when someone asks.</p>
            <span className="mon-card__meta mono">{answered.length} matched</span>
          </button>
          <button className="mon-card" onClick={() => setView("labbie")}>
            <span className="mon-card__no mono">✦</span>
            <h2>Today's Labbie</h2>
            <p>Tonight's featured artists & hosts — the lineup on the big screen.</p>
            <span className="mon-card__meta mono">{ARTISTS.length} artists</span>
          </button>
        </div>
      )}

      {view === "matches" && (
        <section className="monitor__cards" style={{ flex: 1, overflowY: "auto", paddingTop: 10 }}>
          <div className="matches-head">
            <span className="panel-tag mono">CREATIVE TWINS — {matchRows.length} MATCHED</span>
            <input className="field field--dark matches-search" placeholder="search a name…" value={mq} onChange={(e) => setMq(e.target.value)} />
          </div>
          {filteredRows.length === 0 ? (
            <Empty text="No matches yet — nobody has finished Creative Tension." />
          ) : (
            <table className="matches-table">
              <thead><tr><th>Specimen</th><th></th><th>Creative twin</th><th>Aligned</th></tr></thead>
              <tbody>
                {filteredRows.map((r) => (
                  <tr key={r.id}>
                    <td className="matches-name">{r.name}</td>
                    <td className="matches-arrow">⇄</td>
                    <td className="matches-twin">{r.twinName}</td>
                    <td className="matches-score mono">{r.shared}/{r.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}

      {view === "labbie" && (
        <section className="monitor__cards" style={{ flex: 1, overflowY: "auto", paddingTop: 10 }}>
          <span className="panel-tag mono">TODAY'S LABBIE — {ARTISTS.length} ARTISTS</span>
          <div className="labbie-grid">
            {ARTISTS.map((a) => (
              <article key={a.id} className="labbie-card" style={{ "--accent": a.accent }}>
                <div className="labbie-card__img">
                  <img src={`/artists/${a.id}.jpg`} alt="" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                  <span className="labbie-card__ph">{a.name.split(" ").map((w) => w[0]).join("")}</span>
                </div>
                <div className="labbie-card__body">
                  <h3>{a.name}</h3>
                  <span className="mono">({a.role})</span>
                </div>
              </article>
            ))}
          </div>
        </section>
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
        <div className="ex-stage">
          {/* big question on top */}
          {st === "tension" && tphase !== "count" && (
            <div className="ex-question">
              <span className="ex-question__glyph">{QUESTIONS[q].glyph}</span>
              <h1 className="ex-question__prompt">{QUESTIONS[q].prompt}</h1>
              <div className="ex-question__opts mono"><span>◀ {QUESTIONS[q].left}</span><span>{QUESTIONS[q].right} ▶</span></div>
            </div>
          )}

          {/* body */}
          <section className="monitor__swarm monitor__swarm--full">
            {st === "tension" && tphase === "count" ? (
              <div className="ex-count"><span className="ex-count__num">{count}</span><span className="mono">get ready…</span></div>
            ) : room.length ? (
              <LiveSwarm people={room} lockedQ={st === "tension" && tphase !== "count" ? q : null} />
            ) : (
              <Empty text="Waiting for specimens to join…" />
            )}
            {st === "tension" && tphase === "result" && (
              <div className="ex-result mono">{answeredQ}/{room.length} locked in · results frozen</div>
            )}
          </section>

          {/* centered controls */}
          <div className="mon-controls">
            <span className="mon-count mono">◉ {room.length} in the room</span>
            {st !== "tension" && (
              <button className="host-btn go big" onClick={() => setSession({ state: "tension", q: 0, tphase: "count" })}>▶ Start Creative Tension</button>
            )}
            {st === "tension" && tphase === "ask" && (
              <button className="host-btn go big" onClick={() => setSession({ tphase: "result" })}>■ End question</button>
            )}
            {st === "tension" && tphase === "result" && (
              <button className="host-btn go big" onClick={() => (q + 1 >= QUESTIONS.length ? setSession({ state: "twin" }) : setSession({ q: q + 1, tphase: "ask" }))}>
                {q + 1 >= QUESTIONS.length ? "Reveal twins ▶" : "Next question ▶"}
              </button>
            )}
            {st === "tension" && <button className="host-btn" onClick={() => setSession({ state: "lobby", q: 0, tphase: "ask" })}>↺ Reset</button>}
          </div>
        </div>
      )}

      {view === "lab" && (
        <div className="ex-stage">
          <div className="ex-question">
            <h1 className="ex-question__prompt">
              {st === "idea" ? "Capture an idea" : st === "shake" ? "Shake to connect" : st === "web" ? "The Wood Wide Web" : "Open Lab"}
            </h1>
            <div className="ex-question__opts mono">
              <span>{st === "idea" ? `${ideaCount}/${room.length} ideas in` : st === "shake" ? `${shakeCount}/${room.length} shaken` : st === "web" ? "the room, connected" : "ready when you are"}</span>
            </div>
          </div>

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

          {/* centered controls */}
          <div className="mon-controls">
            <span className="mon-count mono">◉ {room.length} in the room</span>
            <LabButtons st={st} />
          </div>
        </div>
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
  if (!inLab) return <button className="host-btn go big" onClick={() => setSession({ state: "lab-lobby" })}>▶ Start Open Lab</button>;
  return (
    <>
      <button className="host-btn go big" onClick={next}>{nextLabel[st]}</button>
      <button className="host-btn" onClick={() => setSession({ state: "lobby", q: 0, tphase: "ask" })}>↺ Reset</button>
    </>
  );
}

function Empty({ text }) {
  return <div className="mon-empty mono">{text}</div>;
}

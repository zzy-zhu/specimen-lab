/* ============================================================
   SPECIMEN.lab — realtime store (Firebase RTDB)
   ------------------------------------------------------------
   Specimens sync live across every phone + the monitor. A local
   in-memory cache (fed by one onValue listener) keeps a synchronous
   read API so the React hooks stay simple. Seeds are read-only and
   merged in so the room is never empty.
   ============================================================ */
import { ref, onValue, set, update, remove, get, child } from "firebase/database";
import { db, EVENT_ID } from "./firebase";

const SPECIMENS = `rooms/${EVENT_ID}/specimens`;
const SESSION = `rooms/${EVENT_ID}/session`;
const ME_KEY = "specimen.lab.me.v2";
const ME_REC = "specimen.lab.me.rec"; // full record, survives reload before RTDB loads
const SESSION_KEY = "specimen.lab.session.ok";

const PALETTE = ["#e5241c", "#12c9bc", "#0a0a0a"];

let cache = []; // live db specimens
let session = { state: "lobby", q: 0 }; // host-controlled session
const listeners = new Set();
const notify = () => listeners.forEach((cb) => cb());

/* one shared realtime listener for specimens */
onValue(
  ref(db, SPECIMENS),
  (snap) => { cache = Object.values(snap.val() || {}); notify(); },
  () => { /* permission/offline — keep seeds-only */ }
);

/* host-controlled session state */
onValue(
  ref(db, SESSION),
  (snap) => { session = snap.val() || { state: "lobby", q: 0 }; notify(); },
  () => {}
);

export function getSession() { return session; }
export function setSession(patch) {
  session = { ...session, ...patch };
  notify();
  update(ref(db, SESSION), patch).catch(() => {});
}

/* ---- identity helpers ---- */
export function normHandle(h) {
  return (h || "").trim().toLowerCase().replace(/^@/, "").replace(/\s+/g, "");
}
function keyFor(handle) {
  return "u_" + normHandle(handle).replace(/[.#$/[\]]/g, "_");
}

export function getMe() {
  const id = localStorage.getItem(ME_KEY);
  if (!id) return null;
  const live = getAll().find((p) => p.id === id);
  if (live) return live;
  // fallback to the locally-cached record (before RTDB loads / offline)
  try {
    const rec = JSON.parse(localStorage.getItem(ME_REC));
    if (rec && rec.id === id) return rec;
  } catch { /* noop */ }
  return null;
}
function saveMeRec(rec) {
  try { localStorage.setItem(ME_REC, JSON.stringify(rec)); } catch { /* noop */ }
}
export function setMe(id) {
  if (id) localStorage.setItem(ME_KEY, id);
  else { localStorage.removeItem(ME_KEY); localStorage.removeItem(ME_REC); }
  notify();
}

/* ---- public data ---- */
export function getStored() {
  return cache;
}
/* only real registered specimens — no seeds. The room can be empty. */
export function getAll() {
  return [...cache];
}
export function getById(id) {
  return getAll().find((p) => p.id === id) || null;
}

/* ---- writes ---- */
/* simplified: just a name + selfie. id is generated (device-persistent). */
export function createSpecimen({ name, image, passcode }) {
  const prevId = localStorage.getItem(ME_KEY);
  const existing = prevId && cache.find((p) => p.id === prevId);
  const slug = (name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "specimen";
  const rand = Math.abs(hashStr(name + navigator.userAgent + (prevId || ""))).toString(36).slice(0, 4);
  const id = existing ? existing.id : `u_${slug}_${rand}`;
  const rec = {
    id,
    handle: existing?.handle || `${slug}-${rand}`,
    passcode: passcode ?? existing?.passcode ?? "",
    name,
    image: image ?? existing?.image ?? null,
    role: "specimen",
    color: existing?.color || PALETTE[cache.length % PALETTE.length],
    answers: existing?.answers ?? [],
    shake: existing?.shake ?? null,
    idea: existing?.idea ?? "",
    tech: existing?.tech ?? "",
    part1Done: existing?.part1Done ?? false,
    part2Done: existing?.part2Done ?? false,
    createdAt: existing?.createdAt || Date.now(),
  };
  cache = [...cache.filter((p) => p.id !== id), rec];
  localStorage.setItem(ME_KEY, id);
  saveMeRec(rec);
  notify();
  set(ref(db, `${SPECIMENS}/${id}`), rec).catch(() => {});
  return rec;
}

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < (s || "").length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

export function patchSpecimen(id, patch) {
  let rec = cache.find((p) => p.id === id);
  if (rec) {
    Object.assign(rec, patch);
    cache = [...cache];
  }
  if (id === localStorage.getItem(ME_KEY)) {
    // keep the local fallback record in sync
    const base = rec || getMe() || { id };
    saveMeRec({ ...base, ...patch });
  }
  notify();
  update(ref(db, `${SPECIMENS}/${id}`), patch).catch(() => {});
  return rec;
}

/* throttled live position (accelerometer) — separate node, tiny payload */
let lastPos = 0;
export function publishPosition(id, x, y, motion = 0) {
  const now = Date.now();
  if (now - lastPos < 90) return; // ~11 fps
  lastPos = now;
  update(ref(db, `${SPECIMENS}/${id}/live`), { x, y, m: motion, t: now }).catch(() => {});
}

export async function login(handle, passcode) {
  const id = keyFor(handle);
  let rec = cache.find((p) => p.id === id);
  if (!rec) {
    try {
      const snap = await get(child(ref(db, SPECIMENS), id));
      rec = snap.val();
    } catch { /* offline */ }
  }
  if (!rec) return { ok: false, reason: "not-found" };
  if ((rec.passcode || "") !== (passcode || "")) return { ok: false, reason: "bad-passcode" };
  localStorage.setItem(ME_KEY, id);
  saveMeRec(rec);
  notify();
  return { ok: true, record: rec };
}

export function subscribe(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/* ---- session access (day code OR logged-in ID) ---- */
export function unlockSession() {
  sessionStorage.setItem(SESSION_KEY, "1");
}
export function isSessionUnlocked() {
  return sessionStorage.getItem(SESSION_KEY) === "1";
}

/* a specimen clears their own data (RTDB record + local identity) */
export function deleteSpecimen(id) {
  if (id) {
    cache = cache.filter((p) => p.id !== id);
    remove(ref(db, `${SPECIMENS}/${id}`)).catch(() => {});
  }
  localStorage.removeItem(ME_KEY);
  localStorage.removeItem(ME_REC);
  sessionStorage.removeItem(SESSION_KEY);
  notify();
}

/* organizer: clear real submissions */
export function resetRoom() {
  remove(ref(db, SPECIMENS)).catch(() => {});
  localStorage.removeItem(ME_KEY);
  cache = [];
  notify();
}

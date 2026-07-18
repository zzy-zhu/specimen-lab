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
import { SEED_PARTICIPANTS } from "../data/lab";

const SPECIMENS = `rooms/${EVENT_ID}/specimens`;
const ME_KEY = "specimen.lab.me.v2";
const SESSION_KEY = "specimen.lab.session.ok";

const PALETTE = ["#e5241c", "#12c9bc", "#0a0a0a"];

let cache = []; // live db specimens
const listeners = new Set();
const notify = () => listeners.forEach((cb) => cb());

/* one shared realtime listener */
onValue(
  ref(db, SPECIMENS),
  (snap) => {
    const val = snap.val() || {};
    cache = Object.values(val);
    notify();
  },
  () => { /* permission/offline — keep seeds-only */ }
);

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
  return getAll().find((p) => p.id === id) || null;
}
export function setMe(id) {
  if (id) localStorage.setItem(ME_KEY, id);
  else localStorage.removeItem(ME_KEY);
  notify();
}

/* ---- public data ---- */
export function getStored() {
  return cache;
}
export function getAll() {
  return [...SEED_PARTICIPANTS, ...cache];
}
export function getById(id) {
  return getAll().find((p) => p.id === id) || null;
}

/* ---- writes ---- */
export function createSpecimen({ handle, passcode, name, image }) {
  const id = keyFor(handle);
  const existing = cache.find((p) => p.id === id);
  const rec = {
    id,
    handle: normHandle(handle),
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
  // optimistic local update so the flow proceeds instantly
  cache = [...cache.filter((p) => p.id !== id), rec];
  localStorage.setItem(ME_KEY, id);
  notify();
  set(ref(db, `${SPECIMENS}/${id}`), rec).catch(() => {});
  return rec;
}

export function patchSpecimen(id, patch) {
  const rec = cache.find((p) => p.id === id);
  if (rec) {
    Object.assign(rec, patch);
    cache = [...cache];
    notify();
  }
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

/* organizer: clear real submissions */
export function resetRoom() {
  remove(ref(db, SPECIMENS)).catch(() => {});
  localStorage.removeItem(ME_KEY);
  cache = [];
  notify();
}

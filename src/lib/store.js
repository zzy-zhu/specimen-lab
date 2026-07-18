/* ============================================================
   SPECIMEN.lab — local "room" store
   ------------------------------------------------------------
   Persists specimens to localStorage so:
     · a participant can log back in with handle + passcode
     · the /monitor dashboard reacts live (cross-tab storage events)
   Seed participants stand in for a pre-populated room.
   Swap this module for a realtime backend to go cross-device.
   ============================================================ */
import { SEED_PARTICIPANTS } from "../data/lab";

const ROOM_KEY = "specimen.lab.room.v1";
const ME_KEY = "specimen.lab.me.v1";
const EVT = "specimen-room-change";

const PALETTE = ["#e5241c", "#12c9bc", "#0a0a0a"];

/* ---- low level ---- */
function readRoom() {
  try {
    const raw = localStorage.getItem(ROOM_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function writeRoom(list) {
  localStorage.setItem(ROOM_KEY, JSON.stringify(list));
  // notify same-tab listeners (storage event only fires cross-tab)
  window.dispatchEvent(new CustomEvent(EVT));
}

/* ---- identity ---- */
export function normHandle(h) {
  return (h || "").trim().toLowerCase().replace(/^@/, "").replace(/\s+/g, "");
}

export function getMe() {
  const id = localStorage.getItem(ME_KEY);
  if (!id) return null;
  return readRoom().find((p) => p.id === id) || null;
}
export function setMe(id) {
  if (id) localStorage.setItem(ME_KEY, id);
  else localStorage.removeItem(ME_KEY);
  window.dispatchEvent(new CustomEvent(EVT));
}

/* ---- public data ---- */
export function getStored() {
  return readRoom();
}

/** everyone visible in the room: seeds + real submissions */
export function getAll() {
  return [...SEED_PARTICIPANTS, ...readRoom()];
}

export function getById(id) {
  return getAll().find((p) => p.id === id) || null;
}

/** create or update the current specimen; returns the record */
export function createSpecimen({ handle, passcode, name, image }) {
  const list = readRoom();
  const h = normHandle(handle);
  let rec = list.find((p) => p.handle === h);
  if (rec) {
    rec.name = name;
    rec.image = image;
    if (passcode) rec.passcode = passcode;
  } else {
    rec = {
      id: `u-${h}-${list.length}`,
      handle: h,
      passcode: passcode || "",
      name,
      image,
      role: "specimen",
      color: PALETTE[(SEED_PARTICIPANTS.length + list.length) % PALETTE.length],
      answers: [],
      shake: null,
      idea: "",
      tech: "",
      part1Done: false,
      part2Done: false,
      createdAt: new Date().toISOString(),
    };
    list.push(rec);
  }
  // set the "me" pointer BEFORE writing the room, so the change event
  // that writeRoom fires already resolves to this record via getMe().
  localStorage.setItem(ME_KEY, rec.id);
  writeRoom(list);
  return rec;
}

/** patch fields on a specimen by id */
export function patchSpecimen(id, patch) {
  const list = readRoom();
  const rec = list.find((p) => p.id === id);
  if (!rec) return null;
  Object.assign(rec, patch);
  writeRoom(list);
  return rec;
}

/** log back in with handle + passcode */
export function login(handle, passcode) {
  const h = normHandle(handle);
  const rec = readRoom().find((p) => p.handle === h);
  if (!rec) return { ok: false, reason: "not-found" };
  if ((rec.passcode || "") !== (passcode || "")) return { ok: false, reason: "bad-passcode" };
  setMe(rec.id);
  return { ok: true, record: rec };
}

/** subscribe to any room change (same-tab + cross-tab) */
export function subscribe(cb) {
  const onStorage = (e) => {
    if (!e || e.key === ROOM_KEY) cb();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(EVT, cb);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(EVT, cb);
  };
}

/* handy for the monitor demo */
export function resetRoom() {
  localStorage.removeItem(ROOM_KEY);
  localStorage.removeItem(ME_KEY);
  window.dispatchEvent(new CustomEvent(EVT));
}

/* ============================================================
   SPECIMEN.lab — events
   ------------------------------------------------------------
   Every event is a sealed room: its own access code, its own RTDB
   node, its own local identity keys. An attendee of one event
   never sees the other's specimens, results or menu items — until
   the host reveals the archive from the monitor.

   Adding an event = one entry here.
   ============================================================ */
import { QUESTIONS, OPENTAB_QUESTIONS } from "./lab";
import { LUMA } from "./artists";

export const EVENTS = {
  /* ---- Specimen.lab LA — the original, two-part night ---- */
  la: {
    id: "la",
    code: "specimenla",
    room: import.meta.env.VITE_EVENT_ID || "live", // rooms/<room> in RTDB
    store: "", // legacy localStorage keys — do NOT change, live attendees depend on it
    name: "Specimen.lab LA",
    monitorTitle: "Creative Tension",
    monitorBlurb: "Start & reset the guided tilt game. Headshots move as people lean.",
    menuTag: "THE MENU",
    menuTitle: "Two ways\nto begin",
    menuLede: "A specimen suspended in space — it listens to the room and reacts.",
    waitingTag: "EVENT 01 · WAITING ROOM",
    questions: QUESTIONS,
    parts: { tension: true, lab: true },
    artists: true,
    luma: LUMA,
    ig: null,
    dream: null, // LA captures ideas in the Open Lab instead
  },

  /* ---- OpenTab — Creative Tension only ---- */
  opentab: {
    id: "opentab",
    code: "opentab",
    room: "opentab",
    store: ".opentab",
    name: "OpenTab",
    monitorTitle: "OpenTab Creative Tension",
    monitorBlurb: "Separate room, separate data. Three tensions, then match the room.",
    menuTag: "OPENTAB",
    menuTitle: "One live\nexperiment",
    menuLede: "Three tensions, answered with your whole body. Then we find the person who leans like you.",
    waitingTag: "OPENTAB · WAITING ROOM",
    questions: OPENTAB_QUESTIONS,
    parts: { tension: true, lab: false },
    artists: false,
    luma: null,
    ig: { url: "https://instagram.com/zhu.ziyuan", handle: "@zhu.ziyuan", label: "Zoey" },
    /* asked at sign-up, carried into the pairing: you meet your tension
       twin and you can see what they're itching to make. */
    dream: {
      eyebrow: "WHAT DO YOU WANT TO MAKE?",
      hint: "…that nobody asked you for.",
      placeholder: "the thing nobody asked for",
      required: true,
      max: 120,
    },
  },
};

export const DEFAULT_EVENT_ID = "la";
export const EVENT_IDS = Object.keys(EVENTS);

export function getEvent(id) {
  return EVENTS[id] || EVENTS[DEFAULT_EVENT_ID];
}

/** an access code → its event (case/space insensitive) */
export function eventByCode(code) {
  const c = (code || "").trim().toLowerCase().replace(/\s+/g, "");
  return EVENT_IDS.map((id) => EVENTS[id]).find((e) => e.code === c) || null;
}

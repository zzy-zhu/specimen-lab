/* ============================================================
   SPECIMEN.lab — data + matching logic
   ------------------------------------------------------------
   In a live event this lives on a backend and matching runs
   across every connected phone. Here it's a mock pool so the
   full flow is demonstrable on a single device. Swap
   `participants` + the match fns for API calls to go live.
   ============================================================ */

/* ---- Part 01: the four "creative tension" questions ---- */
export const QUESTIONS = [
  {
    id: "banana",
    glyph: "🍌",
    prompt: "Is banana bread…",
    left: "Bread",
    right: "Cake",
  },
  {
    id: "drive",
    glyph: "🎨",
    prompt: "Which excites you more?",
    left: "Making",
    right: "Thinking",
  },
  {
    id: "start",
    glyph: "🌱",
    prompt: "When you start something new, you…",
    left: "Jump in & experiment",
    right: "Observe & plan first",
  },
  {
    id: "inspire",
    glyph: "🪐",
    prompt: "Which feels more inspiring?",
    left: "Deep into one idea",
    right: "Connecting many ideas",
  },
];

/* answers are encoded 0 = left, 1 = right */

/* ---- seed participant pool (stands in for a pre-populated room) ---- */
export const SEED_PARTICIPANTS = [
  {
    id: "p-ada",
    name: "Ada",
    role: "sound artist",
    color: "#e5241c",
    answers: [0, 0, 0, 1],
    shake: 6.2,
    idea: "field recordings turned into wearable haptics",
    tech: "spatial audio",
  },
  {
    id: "p-kenji",
    name: "Kenji",
    role: "3D designer",
    color: "#12c9bc",
    answers: [1, 0, 0, 0],
    shake: 8.9,
    idea: "growing typography from mycelium",
    tech: "biofabrication",
  },
  {
    id: "p-mara",
    name: "Mara",
    role: "researcher",
    color: "#e5241c",
    answers: [0, 1, 1, 1],
    shake: 3.1,
    idea: "an archive that reorganizes itself as you read",
    tech: "generative video",
  },
  {
    id: "p-tomas",
    name: "Tomás",
    role: "roboticist",
    color: "#0a0a0a",
    answers: [1, 0, 1, 0],
    shake: 9.6,
    idea: "a drawing machine that hesitates",
    tech: "robotics",
  },
  {
    id: "p-ivy",
    name: "Ivy",
    role: "ceramicist",
    color: "#12c9bc",
    answers: [0, 0, 1, 1],
    shake: 4.4,
    idea: "printing glaze recipes from soil samples",
    tech: "ceramic printing",
  },
  {
    id: "p-noor",
    name: "Noor",
    role: "filmmaker",
    color: "#e5241c",
    answers: [1, 1, 0, 1],
    shake: 7.3,
    idea: "documentaries scored by their own footage",
    tech: "generative video",
  },
  {
    id: "p-leo",
    name: "Leo",
    role: "fashion tech",
    color: "#0a0a0a",
    answers: [0, 0, 0, 0],
    shake: 5.5,
    idea: "garments that log the rooms they've been in",
    tech: "wearables",
  },
  {
    id: "p-suki",
    name: "Suki",
    role: "game designer",
    color: "#12c9bc",
    answers: [1, 1, 1, 0],
    shake: 8.1,
    idea: "a city that plays back its own foot traffic",
    tech: "spatial audio",
  },
  {
    id: "p-rafa",
    name: "Rafa",
    role: "bio artist",
    color: "#e5241c",
    answers: [0, 1, 0, 1],
    shake: 2.6,
    idea: "pigments cultured from local bacteria",
    tech: "mycelium",
  },
  {
    id: "p-june",
    name: "June",
    role: "motion designer",
    color: "#0a0a0a",
    answers: [1, 0, 0, 1],
    shake: 6.8,
    idea: "loops that never quite repeat",
    tech: "generative video",
  },
];

/* back-compat alias */
export const PARTICIPANTS = SEED_PARTICIPANTS;

/* ---- Part 02: idea themes for the living map ---- */
export const THEME_SEEDS = [
  { key: "matter", label: "Living Matter", tags: ["mycelium", "biofabrication", "ceramic printing", "soil", "bacteria", "garden"] },
  { key: "signal", label: "Signal & Sound", tags: ["spatial audio", "sound", "haptics", "field recording", "score", "music"] },
  { key: "motion", label: "Motion & Machines", tags: ["robotics", "drawing machine", "wearables", "kinetic", "sensor"] },
  { key: "image", label: "Generative Image", tags: ["generative video", "loop", "footage", "film", "typography", "archive"] },
];

/* ---------------- matching helpers ---------------- */

/** count of shared answers with a participant */
function tensionSimilarity(a, b) {
  return a.reduce((n, v, i) => n + (v === b[i] ? 1 : 0), 0);
}

/** most-similar participant by tension answers (deterministic tie-break) */
export function findTwin(myAnswers, pool = PARTICIPANTS) {
  let best = null;
  let bestScore = -1;
  pool.forEach((p) => {
    const s = tensionSimilarity(myAnswers, p.answers);
    if (s > bestScore) {
      bestScore = s;
      best = p;
    }
  });
  return { twin: best, shared: bestScore, total: myAnswers.length };
}

/** nearest + farthest shake signatures */
export function findShakeMatches(myShake, pool = PARTICIPANTS) {
  const scored = pool
    .map((p) => ({ p, d: Math.abs(p.shake - myShake) }))
    .sort((a, b) => a.d - b.d);
  return {
    similar: scored[0]?.p ?? null,
    different: scored[scored.length - 1]?.p ?? null,
  };
}

/** bucket a free-text idea/tech into one of the map themes */
export function themeFor(text) {
  const t = (text || "").toLowerCase();
  let hit = null;
  let hitCount = 0;
  THEME_SEEDS.forEach((theme) => {
    const c = theme.tags.reduce((n, tag) => n + (t.includes(tag) ? 1 : 0), 0);
    if (c > hitCount) {
      hitCount = c;
      hit = theme;
    }
  });
  return hit || THEME_SEEDS[3]; // default: generative image
}

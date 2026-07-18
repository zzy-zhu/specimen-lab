# ( \*SPECI ^MEN.lab )

A phone-based, two-part interactive experience for **Specimen.lab** —
_"a living archive of contamination, and creative mischief."_
(Anima Initiative / FuturePIXEL · 2026.7.18 · Venia Studio, LA)

Built with **React 19 + Vite**, **three.js** (audio-reactive mineral-space
background), **framer-motion**, and **Space Grotesk / Space Mono** type.

## The experience

### Home `/`
Both experiences live on one hub — a specimen suspended in a mineral-space
field that **listens to the room** (microphone) and reacts. Returning
visitors can re-open their ID.

### Part 01 — Creative Tension `/tension` _(before the event, < 2 min)_
> _who you are — your instincts_
1. **Create your specimen** — selfie/upload, a name, a **handle + passcode**
   (so you can re-open your ID at any Specimen.lab event).
2. **Four tilt questions** — lean the phone left/right; live room results.
3. **Creative Twin** — AI matches the closest instincts; get their card.

### Part 02 — Open Lab `/lab` _(after the talks, < 3 min)_
> _what you're exploring — your ideas_
1. **Capture a living idea** + a new tech/material/medium.
2. **Shake to connect** — 10s motion signature → closest & opposite rhythm.
3. **The Wood Wide Web** — the finale: every specimen becomes a node in a
   living mycelial network; roots grow between shared instincts, rhythm, and
   material. AI clusters the room's ideas into themes.

### Your ID `/me`
Re-open your specimen with **handle + passcode**; see your card, progress,
twin and frequency matches.

### Monitor `/monitor` _(organizer only)_
Passcode-gated (`specimen.lab2026`) live dashboard to **project in the room**:
the Wood Wide Web, live tension results, and AI idea synthesis. The
mineral-space backdrop listens to the room's ambient sound and reacts.

## Run it

```bash
npm install
npm run dev          # http://localhost:5173
npm run build
npm run lint
```

Open on a **phone** for real tilt (DeviceOrientation), shake (DeviceMotion),
and mic (Web Audio) — iOS prompts for permission on a tap. Desktop
fallbacks: **← / →** for tilt, **tap/space** for shake, keyboard-free
otherwise. If WebGL is unavailable the background degrades to a static
mineral gradient.

### AI synthesis
`src/lib/ai.js` clusters ideas and writes the room narrative. Set
`VITE_ANTHROPIC_API_KEY` (e.g. in `.env.local`) to use **Claude**; otherwise
a deterministic local synthesis runs so it always works offline.

## Architecture

```
src/
  App.jsx                routes (/ /tension /lab /me /monitor)
  screens.jsx            step components (create, tension, shake, …)
  pages/                 Home, TensionFlow, LabFlow, MyID, Monitor
  components/            MineralSpace (three.js), WoodWideWeb, Finale,
                         NameCard, TiltMeter, IdeaMap, GridBackground, Wordmark
  hooks/                 useTilt, useShake, useMic
  lib/                   store (localStorage room), atmosphere (mic + 3D bg),
                         ai (Claude/local synthesis), hooks (useRoom/useMe)
  data/lab.js            questions, seed room, matching logic
```

## Going live (single-device → real room)

Matching + persistence currently use **localStorage** (with live cross-tab
updates, so the monitor reacts to submissions in the same browser). Seed
participants pre-populate the room. To go cross-device, replace
`src/lib/store.js` with a realtime backend that stores specimens and computes
matches across all connected phones — the app already passes exactly the data
those endpoints need.

---
🤖 Built with [Claude Code](https://claude.com/claude-code)

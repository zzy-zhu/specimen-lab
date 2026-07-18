import { Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import { Cover } from "./pages/Cover";
import { About } from "./pages/About";
import { Enter } from "./pages/Enter";
import { Menu } from "./pages/Menu";
import { Artists } from "./pages/Artists";
import { TensionFlow } from "./pages/TensionFlow";
import { LabFlow } from "./pages/LabFlow";
import { MyID } from "./pages/MyID";
import { Profile } from "./pages/Profile";
import { Monitor } from "./pages/Monitor";
import { CookieBanner } from "./components/CookieBanner";

/*  SPECIMEN.lab
    /          cover — living red/blue noise; tap = 10s cinematic (first visit)
    /about     what the session is
    /enter     code of the day (or log in an ID)
    /menu      the experiences (gated) + artists + luma
    /artists   today's artists (posters)
    /tension   Part 01 · Creative Tension
    /lab       Part 02 · Open Lab
    /me        your saved specimen ID / profile
    /p/:handle public specimen profile (shareable link)
    /monitor   organizer dashboard (passcode gated)          */

export default function App() {
  return (
    <main className="app">
      <Routes>
        <Route path="/" element={<Cover />} />
        <Route path="/about" element={<About />} />
        <Route path="/enter" element={<Enter />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/artists" element={<Artists />} />
        <Route path="/tension" element={<TensionFlow />} />
        <Route path="/lab" element={<LabFlow />} />
        <Route path="/me" element={<MyID />} />
        <Route path="/p/:handle" element={<Profile />} />
        <Route path="/monitor" element={<Monitor />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <CookieBanner />
    </main>
  );
}

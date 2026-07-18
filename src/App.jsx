import { Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import { Home } from "./pages/Home";
import { TensionFlow } from "./pages/TensionFlow";
import { LabFlow } from "./pages/LabFlow";
import { MyID } from "./pages/MyID";
import { Monitor } from "./pages/Monitor";

/*  SPECIMEN.lab
    /          hub — both experiences + returning login
    /tension   Part 01 · Creative Tension (tilt → creative twin)
    /lab       Part 02 · Open Lab (idea → shake → wood wide web)
    /me        access your specimen ID via handle + passcode
    /monitor   organizer dashboard (passcode gated)          */

export default function App() {
  return (
    <main className="app">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tension" element={<TensionFlow />} />
        <Route path="/lab" element={<LabFlow />} />
        <Route path="/me" element={<MyID />} />
        <Route path="/monitor" element={<Monitor />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </main>
  );
}

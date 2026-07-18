import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Wordmark, FuturePixelMark, CornerBrand } from "../components/Wordmark";
import { GridBackground } from "../components/GridBackground";
import { useEffect } from "react";
import { useAtmosphere } from "../lib/atmosphere";

export function About() {
  const nav = useNavigate();
  const { setScene } = useAtmosphere();
  useEffect(() => { setScene({ visible: false }); }, [setScene]);

  return (
    <motion.div className="screen screen--cover" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <GridBackground seed={9} nodes={12} color="var(--red)" />

      <div className="topbar">
        <button className="wordmark-btn" onClick={() => nav("/")}><Wordmark size={17} stacked color="var(--red)" /></button>
        <CornerBrand color="var(--red)" />
      </div>

      <span className="step-tag">ABOUT THE SESSION</span>
      <h1 className="display" style={{ marginTop: 10 }}>What is<br />Specimen.lab?</h1>

      <div className="about-body">
        <p>
          Specimen.lab is a living archive of contamination and creative mischief — a
          gathering where artists, technologists, and makers cross-pollinate in real time.
        </p>
        <p>
          Instead of name tags and job titles, everyone becomes a <b>specimen</b>: a face,
          a handle, and a set of instincts. Two lightweight interactions run on your phone.
        </p>

        <div className="about-parts">
          <div className="about-part">
            <span className="mono">01 · CREATIVE TENSION</span>
            <p><b>Who you are.</b> Four playful questions answered by tilting your phone. AI pairs you with your creative twin.</p>
          </div>
          <div className="about-part">
            <span className="mono">02 · OPEN LAB</span>
            <p><b>What you explore.</b> Share an unfinished idea, shake to connect by rhythm, and watch the Wood Wide Web of the whole room grow.</p>
          </div>
        </div>

        <p className="about-note">
          Part 01 breaks the ice around personality. Part 02 sparks conversation around
          unfinished ideas — exactly what Specimen.lab exists to cultivate. Your specimen ID
          is saved: return to any FuturePIXEL session and pick up where you left off.
        </p>
      </div>

      <div className="footer-actions">
        <div style={{ marginBottom: 6 }}><FuturePixelMark color="var(--red)" /></div>
        <button className="btn btn-primary" onClick={() => nav("/enter")}>Enter the session →</button>
        <button className="linklike mono" onClick={() => nav("/")}>← back to cover</button>
      </div>
    </motion.div>
  );
}

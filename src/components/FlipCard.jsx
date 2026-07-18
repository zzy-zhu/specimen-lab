import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { NameCard } from "./NameCard";

/* ============================================================
   FlipCard — a tech-magic reveal. Starts face-down "scanning",
   then flips in 3D to reveal the matched specimen's card.
   ============================================================ */
export function FlipCard({ person, image, variant = "twin", caption, reason, autoFlipMs = 1400, label = "SCANNING THE ROOM" }) {
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setFlipped(true), autoFlipMs);
    return () => clearTimeout(t);
  }, [autoFlipMs]);

  return (
    <div className="flip" onClick={() => setFlipped((f) => !f)}>
      <motion.div
        className="flip__inner"
        animate={{ rotateY: flipped ? 0 : 180 }}
        transition={{ duration: 0.9, ease: [0.7, 0, 0.2, 1] }}
      >
        {/* back (face-down, scanning) */}
        <div className="flip__face flip__back">
          <div className="flip__scan" />
          <span className="mono flip__label">{label}</span>
          <span className="flip__q">?</span>
          <span className="mono flip__hint">decoding your creative twin…</span>
        </div>
        {/* front (revealed) */}
        <div className="flip__face flip__front">
          <NameCard person={person} image={image} variant={variant} caption={reason || caption} />
        </div>
      </motion.div>
    </div>
  );
}

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { hasConsent, giveConsent } from "../lib/prefs";

/* Minimal cookie-consent banner shown until accepted. */
export function CookieBanner() {
  const [ok, setOk] = useState(hasConsent());
  if (ok) return null;
  return (
    <AnimatePresence>
      <motion.div
        className="cookie"
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="cookie__text">
          Specimen.lab keeps a small cookie so returning specimens skip the intro and
          re-open their ID. No tracking.
        </p>
        <button className="cookie__btn mono" onClick={() => { giveConsent(); setOk(true); }}>
          accept
        </button>
      </motion.div>
    </AnimatePresence>
  );
}

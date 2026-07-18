import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Wordmark, FuturePixelMark, CornerBrand } from "../components/Wordmark";
import { CoverField } from "../components/CoverField";
import { useAtmosphere } from "../lib/atmosphere";

/* The cover: one living red screen. Tap anywhere to enter — the
   network multiplies, collapses to black, then the code screen arrives. */
export function Cover() {
  const nav = useNavigate();
  const { levelRef, listening, request, setScene } = useAtmosphere();
  const [entering, setEntering] = useState(false);

  useEffect(() => { setScene({ visible: false }); }, [setScene]);

  const onBlack = useCallback(() => nav("/enter"), [nav]);
  const enter = () => { if (!entering) setEntering(true); };

  const stop = (e) => e.stopPropagation();

  return (
    <div className="cover" onClick={enter} role="button" aria-label="Enter Specimen.lab">
      <CoverField levelRef={levelRef} entering={entering} onBlack={onBlack} />

      <AnimatePresence>
        {!entering && (
          <motion.div
            className="cover__overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="cover__top">
              <FuturePixelMark color="var(--red)" />
              <CornerBrand color="var(--red)" />
            </div>

            <div className="cover__center">
              <Wordmark size={52} stacked color="var(--red)" />
              <p className="cover__tag">A living archive of contamination, and creative mischief.</p>
            </div>

            <div className="cover__bottom">
              <span className="cover__hint mono">tap anywhere to enter →</span>
              <div className="cover__links" onClick={stop}>
                <button className="linklike mono" onClick={() => nav("/about")}>about</button>
                <button
                  className={`listen mono ${listening ? "listen--on" : ""}`}
                  onClick={() => request()}
                >
                  {listening ? "◉ listening" : "◌ let it listen"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

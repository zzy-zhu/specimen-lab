import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { NoiseField } from "../components/NoiseField";
import { useMic } from "../hooks/useMic";

/* ============================================================
   Atmosphere — one shared microphone + the blue/red noise backdrop.
   Pages call setScene({ visible, tone, accent }) to summon it.
   A single mic stream feeds every reactive element.
   ============================================================ */
const Ctx = createContext(null);

export function AtmosphereProvider({ children }) {
  const mic = useMic();
  const [scene, setSceneState] = useState({ visible: false, tone: "space", accent: "aqua" });
  const zeroRef = useRef(0); // atmosphere backdrop never runs the enter transition

  // stable setter so effects that depend on it don't loop
  const setScene = useCallback((patch) => setSceneState((s) => ({ ...s, ...patch })), []);

  const value = useMemo(
    () => ({ ...mic, scene, setScene }),
    [mic, scene, setScene]
  );

  // backdrop is subtler than the cover
  const intensity = scene.tone === "cover" ? 1 : 0.62;

  return (
    <Ctx.Provider value={value}>
      {scene.visible && (
        <div className="atmosphere">
          <NoiseField levelRef={mic.levelRef} bandsRef={mic.bandsRef} enterRef={zeroRef} intensity={intensity} accent={scene.accent} />
        </div>
      )}
      {children}
    </Ctx.Provider>
  );
}

export function useAtmosphere() {
  return useContext(Ctx);
}

/** call from a page to set (and reset) the backdrop for its lifetime */
export function useScene(config) {
  const atmos = useAtmosphere();
  const { setScene } = atmos;
  const key = JSON.stringify(config);
  useEffect(() => {
    setScene({ visible: true, ...config });
    return () => setScene({ visible: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, setScene]);
  return atmos;
}

/* ---- listening control the pages can drop in ---- */
export function ListenButton({ className = "" }) {
  const { listening, permission, request } = useAtmosphere();
  const [busy, setBusy] = useState(false);
  const onClick = useCallback(async () => {
    setBusy(true);
    await request();
    setBusy(false);
  }, [request]);

  if (listening) {
    return (
      <span className={`listen listen--on mono ${className}`}>
        ◉ listening to the room
      </span>
    );
  }
  return (
    <button className={`listen mono ${className}`} onClick={onClick} disabled={busy}>
      {permission === "denied" ? "⌀ mic blocked — tap to retry" : "◌ let it listen"}
    </button>
  );
}

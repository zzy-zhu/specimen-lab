import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { MineralSpace } from "../components/MineralSpace";
import { useMic } from "../hooks/useMic";

/* ============================================================
   Atmosphere — one shared microphone + the mineral-space backdrop.
   Pages call setScene({ visible, tone, accent }) to summon it.
   A single mic stream feeds every reactive element.
   ============================================================ */
const Ctx = createContext(null);

export function AtmosphereProvider({ children }) {
  const mic = useMic();
  const [scene, setSceneState] = useState({ visible: false, tone: "space", accent: "aqua" });

  // stable setter so effects that depend on it don't loop
  const setScene = useCallback((patch) => setSceneState((s) => ({ ...s, ...patch })), []);

  const value = useMemo(
    () => ({ ...mic, scene, setScene }),
    [mic, scene, setScene]
  );

  return (
    <Ctx.Provider value={value}>
      {scene.visible && (
        <div className="atmosphere">
          <MineralSpace
            levelRef={mic.levelRef}
            bandsRef={mic.bandsRef}
            accent={scene.accent}
            tone={scene.tone}
          />
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

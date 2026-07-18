import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { CreateSpecimen, CaptureIdea, Shake, Connections } from "../screens";
import { Finale } from "../components/Finale";
import { useScene } from "../lib/atmosphere";
import { useMe, useRoom } from "../lib/hooks";
import { findShakeMatches } from "../data/lab";

export function LabFlow() {
  const nav = useNavigate();
  const { me, create, patch } = useMe();
  const room = useRoom();
  const [step, setStep] = useState(me ? "capture" : "create");
  const [shakeScore, setShakeScore] = useState(me?.shake ?? null);

  // dark mineral space only on the finale
  useScene(step === "finale" ? { tone: "space", accent: "red" } : { visible: false });

  const pool = useMemo(() => room.filter((p) => p.id !== me?.id && p.shake != null), [room, me]);
  const matches = useMemo(
    () => (shakeScore != null ? findShakeMatches(shakeScore, pool) : { similar: null, different: null }),
    [shakeScore, pool]
  );
  const everyone = useMemo(() => room, [room]);

  const home = () => nav("/");

  return (
    <AnimatePresence mode="wait">
      {step === "create" && (
        <CreateSpecimen key="c" existing={me} onBack={home} onCreate={(d) => { create(d); setStep("capture"); }} />
      )}
      {step === "capture" && (
        <CaptureIdea key="cap" existing={me} onBack={home} onDone={(d) => { patch(d); setStep("shake"); }} />
      )}
      {step === "shake" && (
        <Shake key="sh" onBack={home} onDone={(score) => { setShakeScore(score); patch({ shake: score, part2Done: true }); setStep("connect"); }} />
      )}
      {step === "connect" && (
        <Connections key="con" shakeScore={shakeScore} similar={matches.similar} different={matches.different} onBack={home} onNext={() => setStep("finale")} />
      )}
      {step === "finale" && (
        <Finale key="fin" people={everyone} me={me} onBack={() => setStep("connect")} onHome={home} />
      )}
    </AnimatePresence>
  );
}

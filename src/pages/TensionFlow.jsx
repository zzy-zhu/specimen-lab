import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { CreateSpecimen, Tension, Twin } from "../screens";
import { useMe, useRoom } from "../lib/hooks";
import { usePresence } from "../hooks/usePresence";
import { findTwin } from "../data/lab";
import { matchmake } from "../lib/ai";

export function TensionFlow() {
  const nav = useNavigate();
  const { me, create, patch } = useMe();
  const room = useRoom();
  const [step, setStep] = useState(me ? "q" : "create");
  usePresence(me?.id, step === "q" && !!me);
  const [answers, setAnswers] = useState(me?.answers?.length ? me.answers : null);
  const [match, setMatch] = useState(null); // { match, reason, shared, total }

  const pool = useMemo(() => room.filter((p) => p.id !== me?.id && p.answers?.length), [room, me]);

  // when we reach the reveal, ask Claude (or local fallback) for the twin + reason
  useEffect(() => {
    if (step !== "twin" || !answers) return;
    let alive = true;
    const local = findTwin(answers, pool);
    setMatch({ match: local.twin, reason: "", shared: local.shared, total: local.total });
    matchmake({ ...me, answers }, pool).then((r) => { if (alive && r.match) setMatch(r); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, answers]);

  const home = () => nav("/menu");

  return (
    <AnimatePresence mode="wait">
      {step === "create" && (
        <CreateSpecimen key="create" existing={me} onBack={() => nav("/")}
          onCreate={(data) => { create(data); setStep("q"); }} />
      )}

      {step === "q" && (
        <Tension key="q" pool={pool} onBack={home}
          onDone={(a) => { setAnswers(a); patch({ answers: a, part1Done: true }); setStep("twin"); }} />
      )}

      {step === "twin" && (
        <Twin key="twin"
          twin={match?.match}
          shared={match?.shared ?? 0}
          total={match?.total ?? 4}
          reason={match?.reason}
          onBack={home}
          onHome={home}
        />
      )}
    </AnimatePresence>
  );
}

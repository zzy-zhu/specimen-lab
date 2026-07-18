import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { CreateSpecimen, Tension, Twin } from "../screens";
import { useMe, useRoom } from "../lib/hooks";
import { findTwin } from "../data/lab";

export function TensionFlow() {
  const nav = useNavigate();
  const { me, create, patch } = useMe();
  const room = useRoom();
  const [step, setStep] = useState(me ? "q" : "create");
  const [answers, setAnswers] = useState(me?.answers?.length ? me.answers : null);

  const pool = useMemo(() => room.filter((p) => p.id !== me?.id && p.answers?.length), [room, me]);
  const twin = useMemo(() => (answers ? findTwin(answers, pool) : null), [answers, pool]);

  const home = () => nav("/");

  return (
    <AnimatePresence mode="wait">
      {step === "create" && (
        <CreateSpecimen
          key="create"
          existing={me}
          onBack={home}
          onCreate={(data) => {
            create(data);
            setStep("q");
          }}
        />
      )}

      {step === "q" && (
        <Tension
          key="q"
          pool={pool}
          onBack={home}
          onDone={(a) => {
            setAnswers(a);
            patch({ answers: a, part1Done: true });
            setStep("twin");
          }}
        />
      )}

      {step === "twin" && (
        <Twin
          key="twin"
          twin={twin?.twin}
          shared={twin?.shared ?? 0}
          total={twin?.total ?? 4}
          onBack={home}
          onHome={home}
        />
      )}
    </AnimatePresence>
  );
}

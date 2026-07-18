import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CaptureIdea, Shake } from "../screens";
import { Finale } from "../components/Finale";
import { WaitingRoom } from "../components/WaitingRoom";
import { useScene } from "../lib/atmosphere";
import { useMe, useRoom, useSession } from "../lib/hooks";
import { usePresence } from "../hooks/usePresence";
import { isSessionUnlocked } from "../lib/store";

/* Event 02 · Open Lab — host-controlled. Phones wait until the host
   starts each step (capture idea → shake → wood wide web). */
export function LabFlow() {
  const nav = useNavigate();
  const { me, patch } = useMe();
  const room = useRoom();
  const session = useSession();
  const st = session.state;

  useScene(st === "web" ? { tone: "space", accent: "red" } : { tone: "space", accent: "aqua" });
  usePresence(me?.id, (st === "idea" || st === "shake") && !!me);

  const [ideaDone, setIdeaDone] = useState(false);
  const [shakeDone, setShakeDone] = useState(false);

  useEffect(() => {
    if (!isSessionUnlocked()) nav("/enter", { replace: true });
    else if (!me) nav("/create", { replace: true });
  }, [me, nav]);

  // reset local "submitted" flags when the host moves between steps
  useEffect(() => { if (st !== "idea") setIdeaDone(false); }, [st]);
  useEffect(() => { if (st !== "shake") setShakeDone(false); }, [st]);

  const everyone = useMemo(() => room, [room]);
  if (!me) return null;

  // capture idea (host-held)
  if (st === "idea") {
    if (ideaDone) return <WaitingRoom me={me} tag="OPEN LAB · IDEA SAVED" title={"Idea\nlogged"} sub="Nicely done. Waiting for the host to move everyone to the next step…" />;
    return <CaptureIdea existing={me} onBack={() => nav("/menu")} onDone={(d) => { patch(d); setIdeaDone(true); }} />;
  }

  // shake to connect (host-held)
  if (st === "shake") {
    if (shakeDone) return <WaitingRoom me={me} tag="OPEN LAB · SIGNATURE SAVED" title={"Signature\ncaptured"} sub="Waiting for the host to grow the Wood Wide Web…" />;
    return <Shake onBack={() => nav("/menu")} onDone={(score) => { patch({ shake: score, part2Done: true }); setShakeDone(true); }} />;
  }

  // the finale
  if (st === "web") {
    return <Finale people={everyone} me={me} onBack={() => nav("/menu")} onHome={() => nav("/menu")} />;
  }

  // not started (lobby / tension / twin / lab-lobby) → Event 02 waiting room
  return (
    <WaitingRoom
      me={me}
      count={room.length}
      tag="EVENT 02 · WAITING ROOM"
      title={"Open\nLab"}
      sub="The host will start the Open Lab exercise for everyone. Keep your phone in hand."
    />
  );
}

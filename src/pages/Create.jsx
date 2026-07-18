import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CreateSpecimen } from "../screens";
import { useMe } from "../lib/hooks";
import { isSessionUnlocked } from "../lib/store";

/* Profile creation — right after the day code. Upload a photo, name,
   passcode, then into the menu. */
export function Create() {
  const nav = useNavigate();
  const { me, create } = useMe();

  useEffect(() => {
    if (!isSessionUnlocked() && !me) nav("/enter", { replace: true });
  }, [me, nav]);

  return (
    <CreateSpecimen
      existing={me}
      cta="Enter the menu →"
      onBack={() => nav("/enter")}
      onCreate={(d) => { create(d); nav("/menu"); }}
    />
  );
}

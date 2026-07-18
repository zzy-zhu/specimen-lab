import { useEffect, useState } from "react";

/* Treat non-touch, wide, fine-pointer devices as "laptop/desktop".
   Used to show a scan-to-continue QR instead of the phone experience. */
export function useIsDesktop() {
  const check = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(pointer: fine)").matches &&
    !("ontouchstart" in window) &&
    window.innerWidth > 820;

  const [desktop, setDesktop] = useState(check);
  useEffect(() => {
    const on = () => setDesktop(check());
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return desktop;
}

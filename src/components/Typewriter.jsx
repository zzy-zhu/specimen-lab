import { useEffect, useRef, useState } from "react";

/* Types out text (\n supported) char-by-char, then calls onDone. */
export function Typewriter({ text, speed = 45, startDelay = 200, onDone, className = "", cursor = true }) {
  const [n, setN] = useState(0);
  const doneRef = useRef(false);

  useEffect(() => {
    setN(0);
    doneRef.current = false;
    let i = 0;
    let id;
    const start = setTimeout(function step() {
      i += 1;
      setN(i);
      if (i >= text.length) {
        if (!doneRef.current) { doneRef.current = true; onDone?.(); }
        return;
      }
      id = setTimeout(step, speed);
    }, startDelay);
    return () => { clearTimeout(start); clearTimeout(id); };
  }, [text, speed, startDelay, onDone]);

  return (
    <span className={className} style={{ whiteSpace: "pre-line" }}>
      {text.slice(0, n)}
      {cursor && n < text.length && <span className="tw-cursor">▊</span>}
    </span>
  );
}

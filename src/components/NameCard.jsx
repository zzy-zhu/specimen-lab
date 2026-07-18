import { Wordmark } from "./Wordmark";

/* ============================================================
   NameCard — poster-style specimen card (from the reference):
   a faded SPECI^MEN.lab watermark column on the left, the b/w
   headshot on the right with the name in red + (role).
   ============================================================ */
export function NameCard({ person, image, variant = "twin", caption }) {
  const label =
    variant === "twin" ? "CREATIVE TWIN"
    : variant === "similar" ? "CLOSEST FREQUENCY"
    : variant === "different" ? "FURTHEST FREQUENCY"
    : variant === "self" ? "YOUR SPECIMEN"
    : "SPECIMEN";

  const src = image || person?.image;
  const accent =
    variant === "different" ? "#f7f5f3"
    : variant === "self" ? "var(--aqua)"
    : variant === "similar" ? "var(--aqua)"
    : person?.color || "var(--red)";

  return (
    <article className="pcard" style={{ "--accent": accent }}>
      <div className="pcard__wm" aria-hidden="true">
        {Array.from({ length: 4 }).map((_, i) => (
          <Wordmark key={i} size={17} stacked color="rgba(10,10,10,0.16)" />
        ))}
      </div>

      <div className="pcard__img">
        {src ? <img src={src} alt="" /> : <span className="pcard__initial">{person?.name?.[0] ?? "?"}</span>}
        <span className="pcard__tag mono">{label}</span>
        <div className="pcard__overlay">
          <h3 className="pcard__name">{person?.name}</h3>
          {person?.role && <span className="pcard__role">({person.role})</span>}
          {caption && <p className="pcard__cap">{caption}</p>}
        </div>
      </div>
    </article>
  );
}

import { Wordmark } from "./Wordmark";

/**
 * NameCard — a "digital specimen card" handed out when two people match.
 * `variant` colors the relationship (twin / similar / different).
 */
export function NameCard({ person, image, variant = "twin", caption }) {
  const label =
    variant === "twin"
      ? "CREATIVE TWIN"
      : variant === "similar"
      ? "CLOSEST FREQUENCY"
      : variant === "different"
      ? "FURTHEST FREQUENCY"
      : variant === "self"
      ? "YOUR SPECIMEN"
      : "SPECIMEN";

  const src = image || person?.image;
  const accent =
    variant === "different"
      ? "var(--ink)"
      : variant === "self"
      ? "var(--aqua-deep)"
      : person?.color || "var(--red)";

  return (
    <article className="namecard" style={{ "--accent": accent }}>
      <header className="namecard__top">
        <span className="mono">{label}</span>
        <span className="mono">◇ {person?.id?.replace("p-", "").toUpperCase() || "YOU"}</span>
      </header>

      <div className="namecard__body">
        <div className="namecard__avatar" aria-hidden={!src}>
          {src ? (
            <img src={src} alt="" />
          ) : (
            <span className="namecard__initial">{person?.name?.[0] ?? "?"}</span>
          )}
        </div>
        <div className="namecard__ident">
          <h3 className="namecard__name">{person?.name}</h3>
          {person?.role && <p className="namecard__role">({person.role})</p>}
        </div>
      </div>

      {caption && <p className="namecard__caption">{caption}</p>}

      <footer className="namecard__foot">
        <Wordmark size={13} stacked={false} color="var(--ink)" />
        <span className="mono">2026.7.18</span>
      </footer>
    </article>
  );
}

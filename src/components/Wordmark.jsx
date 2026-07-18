/* ( *SPECI / ^MEN.lab ) — the lab wordmark, from the poster series */
export function Wordmark({ size = 28, color = "var(--ink)", stacked = true }) {
  if (stacked) {
    return (
      <span
        className="wordmark"
        style={{ fontSize: size, color }}
        aria-label="Specimen.lab"
      >
        <span style={{ display: "block" }}>
          <span className="paren">(&nbsp;</span>*SPECI
        </span>
        <span style={{ display: "block" }}>
          ^MEN.lab<span className="paren">&nbsp;)</span>
        </span>
      </span>
    );
  }
  return (
    <span className="wordmark" style={{ fontSize: size, color }} aria-label="Specimen.lab">
      <span className="paren">(&nbsp;</span>*SPECI^MEN.lab<span className="paren">&nbsp;)</span>
    </span>
  );
}

/* corner marks that appear on every poster */
export function CornerBrand({ color = "var(--ink)" }) {
  return (
    <span className="corner-brand" style={{ color }}>
      #FUT
      <br />
      (URE
      <br />
      *PIX
      <br />
      EL
    </span>
  );
}

export function AnimaMark({ color = "var(--ink)" }) {
  return (
    <span style={{ color, lineHeight: 1 }}>
      <strong style={{ fontSize: 18, letterSpacing: "-0.02em" }}>Anima</strong>
      <span className="mono" style={{ display: "block", fontSize: 8, opacity: 0.7 }}>
        Initiative
      </span>
    </span>
  );
}

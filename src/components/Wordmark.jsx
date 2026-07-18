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

/* the FuturePIXEL logo — stacked #FUT (URE *PIX ▪EL block */
export function FuturePixelMark({ color = "var(--ink)", size = 15 }) {
  return (
    <span className="fpx-logo" style={{ color, fontSize: size }} aria-label="FuturePIXEL">
      #FUT<br />
      (URE<br />
      *PIX<br />
      <span className="fpx-pixel">▝</span>EL
    </span>
  );
}

/* small alias used in corners */
export function CornerBrand({ color = "var(--ink)" }) {
  return <FuturePixelMark color={color} size={11} />;
}

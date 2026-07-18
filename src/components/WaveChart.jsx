/* WaveChart — draws a shake signature as a mirrored waveform. */
export function WaveChart({ wave = [], color = "var(--red)", height = 90 }) {
  const W = 300;
  const H = height;
  const max = Math.max(1, ...wave);
  const n = wave.length || 1;
  const step = W / n;
  const mid = H / 2;
  const top = wave.map((v, i) => `${i * step},${mid - (v / max) * (mid - 4)}`).join(" ");
  const bot = wave.map((v, i) => `${i * step},${mid + (v / max) * (mid - 4)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="wavechart" preserveAspectRatio="none" style={{ width: "100%", height }}>
      <line x1="0" y1={mid} x2={W} y2={mid} stroke="rgba(247,245,243,0.2)" strokeWidth="0.6" />
      <polyline points={top} fill="none" stroke={color} strokeWidth="1.4" />
      <polyline points={bot} fill="none" stroke={color} strokeWidth="1.4" opacity="0.5" />
    </svg>
  );
}

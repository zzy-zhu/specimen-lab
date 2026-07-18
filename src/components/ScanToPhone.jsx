import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Wordmark } from "./Wordmark";

/* Laptop fallback — the phone experience wants a phone. Show a QR of the
   current URL so people scan and continue on their device. */
export function ScanToPhone({ label = "This is a phone experience" }) {
  const [qr, setQr] = useState(null);
  const url = typeof window !== "undefined" ? window.location.href : "";

  useEffect(() => {
    QRCode.toDataURL(url, { width: 520, margin: 1, color: { dark: "#0a0a0a", light: "#f7f5f3" } })
      .then(setQr)
      .catch(() => {});
  }, [url]);

  return (
    <div className="scan">
      <Wordmark size={30} stacked color="var(--white)" />
      <span className="step-tag" style={{ marginTop: 18 }}>SCAN TO JOIN</span>
      <h1 className="display" style={{ color: "var(--white)", textAlign: "center", marginTop: 6 }}>{label}</h1>
      {qr && <img className="scan__qr" src={qr} alt="Scan to open on your phone" />}
      <p className="lede" style={{ color: "rgba(247,245,243,0.8)", textAlign: "center" }}>
        Point your phone camera here to open Specimen.lab and join the room.
      </p>
      <span className="mono" style={{ opacity: 0.45, wordBreak: "break-all", textAlign: "center" }}>{url}</span>
    </div>
  );
}

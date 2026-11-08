import { ImageResponse } from "next/og";

export const alt = "Preppy: cook a few times, eat well all week";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** The card shown when a Preppy link is shared in a chat. */
export default function Image() {
  const bowl = (fill: string, r: number) => (
    <div style={{ width: r * 2, height: r * 2, borderRadius: r, background: "#ffffff", border: "6px solid #eae5dc", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: r * 1.5, height: r * 1.5, borderRadius: r, background: fill, display: "flex" }} />
    </div>
  );
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 90px", background: "#fff0e8" }}>
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 640 }}>
          <div style={{ fontSize: 44, fontWeight: 700, color: "#b5461c" }}>Preppy</div>
          <div style={{ fontSize: 76, lineHeight: 1.05, color: "#1e1b18", marginTop: 20 }}>Cook a few times. Eat well all week.</div>
          <div style={{ fontSize: 30, color: "#646962", marginTop: 28 }}>Plans around your cook days, one shopping list, and a cooking order.</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
          {bowl("#D9774A", 120)}
          <div style={{ display: "flex", gap: 20 }}>
            {bowl("#C8553D", 60)}
            {bowl("#5B3A2E", 60)}
          </div>
        </div>
      </div>
    ),
    size,
  );
}

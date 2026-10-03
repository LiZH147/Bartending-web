import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "NIGHTCAP — AI cocktail & drink recipes";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(135deg, #17120b 0%, #2a1605 60%, #3a1c08 100%)",
          color: "#f3e8d3",
          padding: 64,
        }}
      >
        <div
          style={{
            fontSize: 42,
            letterSpacing: 12,
            color: "#d9a441",
            fontWeight: 700,
          }}
        >
          🍸 NIGHTCAP
        </div>
        <div
          style={{
            fontSize: 78,
            fontWeight: 800,
            marginTop: 28,
            textAlign: "center",
            lineHeight: 1.1,
          }}
        >
          What can I mix tonight?
        </div>
        <div style={{ fontSize: 30, marginTop: 24, opacity: 0.82, textAlign: "center" }}>
          Classic cocktails & AI-crafted drinks from your own cabinet
        </div>
      </div>
    ),
    { ...size },
  );
}
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Retold — AI Resume Tailoring";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          background: "#0a0a0a",
          padding: "80px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Logo lockup */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "48px",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              background: "#f59e0b",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "30px",
              fontWeight: 800,
              color: "white",
            }}
          >
            R
          </div>
          <span
            style={{
              fontSize: "34px",
              fontWeight: 700,
              color: "white",
              letterSpacing: "-0.5px",
            }}
          >
            Retold
          </span>
        </div>

        {/* Headline */}
        <h1
          style={{
            fontSize: "76px",
            fontWeight: 800,
            color: "white",
            lineHeight: 1.05,
            margin: "0 0 28px",
            letterSpacing: "-2px",
          }}
        >
          Your Resume,
          <br />
          <span style={{ color: "#f59e0b" }}>Retold.</span>
        </h1>

        {/* Subline */}
        <p
          style={{
            fontSize: "26px",
            color: "#888888",
            margin: 0,
            lineHeight: 1.4,
          }}
        >
          AI resume tailoring in 30 seconds.
          <br />
          Keyword matching · ATS analysis · Multiple variations.
        </p>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}

import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "ERC-8004 × Superfluid — Earn from the Agent Economy";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#09090b",
          position: "relative",
        }}
      >
        {/* Glow */}
        <div
          style={{
            position: "absolute",
            width: 600,
            height: 300,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background:
              "radial-gradient(ellipse, rgba(16,185,129,0.08) 0%, transparent 70%)",
          }}
        />

        {/* Title */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span
            style={{
              fontSize: 56,
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: -1,
            }}
          >
            ERC-8004
          </span>
          <span style={{ fontSize: 48, color: "#3f3f46", fontWeight: 400 }}>
            ×
          </span>
          <span
            style={{
              fontSize: 56,
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: -1,
            }}
          >
            Superfluid
          </span>
        </div>

        {/* Subtitle */}
        <span
          style={{
            marginTop: 20,
            fontSize: 24,
            color: "#a1a1aa",
            letterSpacing: -0.3,
          }}
        >
          Earn from the Agent Economy
        </span>

        {/* Bottom left: dot + badge */}
        <div
          style={{
            position: "absolute",
            bottom: 32,
            left: 40,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              backgroundColor: "#34d399",
              borderRadius: "50%",
              boxShadow: "0 0 12px rgba(52,211,153,0.5)",
            }}
          />
          <span style={{ fontSize: 13, color: "#52525b", letterSpacing: 0.5 }}>
            Live on Base
          </span>
        </div>

        {/* Bottom right */}
        <span
          style={{
            position: "absolute",
            bottom: 28,
            right: 40,
            fontSize: 13,
            color: "#3f3f46",
          }}
        >
          8004-demo.superfluid.org
        </span>
      </div>
    ),
    { ...size }
  );
}

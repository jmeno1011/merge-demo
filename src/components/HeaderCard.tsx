export default function HeaderCard() {
  return (
    <div
      style={{
        padding: 20,
        borderRadius: 16,
        background:
          "linear-gradient(135deg, #0b1d3a 0%, #0f2c4a 45%, #1a3d5f 100%)",
        color: "#e9f3ff",
        boxShadow: "0 20px 40px rgba(9, 30, 66, 0.25)",
      }}
    >
      <h1 style={{ marginBottom: 8 }}>Merge Studio</h1>
      <p style={{ marginTop: 0, opacity: 0.85 }}>
        Upload → Merge → Download (ffmpeg.wasm in the browser)
      </p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <span
          style={{
            padding: "6px 10px",
            borderRadius: 999,
            background: "rgba(255,255,255,0.12)",
            fontSize: 12,
          }}
        >
          MP3 / M4A / WAV
        </span>
        <span
          style={{
            padding: "6px 10px",
            borderRadius: 999,
            background: "rgba(255,255,255,0.12)",
            fontSize: 12,
          }}
        >
          MP4 / MOV
        </span>
        <span
          style={{
            padding: "6px 10px",
            borderRadius: 999,
            background: "rgba(255,255,255,0.12)",
            fontSize: 12,
          }}
        >
          Fast copy + fallback re-encode
        </span>
      </div>
    </div>
  );
}

import type { MediaType } from "../types";

type OutputPreviewProps = {
  url: string;
  mediaType: MediaType;
};

export default function OutputPreview({ url, mediaType }: OutputPreviewProps) {
  if (!url) return null;

  return (
    <div
      style={{
        marginTop: 12,
        padding: 12,
        borderRadius: 12,
        border: "1px solid rgba(44, 123, 229, 0.4)",
        background:
          "linear-gradient(180deg, rgba(236, 245, 255, 0.9), #ffffff 55%)",
        boxShadow:
          "0 14px 28px rgba(17, 38, 68, 0.12), inset 0 0 0 1px rgba(44, 123, 229, 0.25)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 10px",
          borderRadius: 999,
          background: "rgba(44, 123, 229, 0.12)",
          color: "#1c5fb8",
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: "0.02em",
          textTransform: "uppercase",
          marginBottom: 10,
        }}
      >
        <span>Preview</span>
        <span style={{ opacity: 0.7 }}>•</span>
        <span>Result</span>
      </div>
      <div
        style={{
          position: "absolute",
          top: 10,
          right: 12,
          fontSize: 11,
          color: "#2c7be5",
          fontWeight: 700,
          letterSpacing: "0.08em",
        }}
      >
        PREVIEW
      </div>
      {mediaType === "audio" ? (
        <audio controls src={url} style={{ width: "100%" }} />
      ) : (
        <video
          controls
          src={url}
          style={{ width: "100%", borderRadius: 8 }}
        />
      )}
    </div>
  );
}

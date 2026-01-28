import type { MediaType, MergeMode } from "../types";

type ControlsPanelProps = {
  mediaType: MediaType;
  setMediaType: (value: MediaType) => void;
  outputName: string;
  setOutputName: (value: string) => void;
  mergeMode: MergeMode;
  setMergeMode: (value: MergeMode) => void;
  ready: boolean;
  loading: boolean;
};

export default function ControlsPanel({
  mediaType,
  setMediaType,
  outputName,
  setOutputName,
  mergeMode,
  setMergeMode,
  ready,
  loading,
}: ControlsPanelProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: 12,
        marginTop: 18,
      }}
    >
      <div
        style={{
          padding: 14,
          borderRadius: 12,
          background: "#ffffff",
          border: "1px solid #e6edf5",
          boxShadow: "0 8px 16px rgba(17, 38, 68, 0.08)",
        }}
      >
        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span>Type</span>
          <select
            value={mediaType}
            onChange={(e) => setMediaType(e.target.value as MediaType)}
            disabled={loading}
          >
            <option value="audio">Audio (MP3/M4A/WAV)</option>
            <option value="video">Video (MP4/MOV)</option>
          </select>
        </label>
        <label
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            marginTop: 10,
          }}
        >
            <span>Output filename</span>
          <input
            value={outputName}
            onChange={(e) => setOutputName(e.target.value)}
            placeholder="merged"
            disabled={loading}
          />
        </label>
      </div>

      <div
        style={{
          padding: 14,
          borderRadius: 12,
          background: "#ffffff",
          border: "1px solid #e6edf5",
          boxShadow: "0 8px 16px rgba(17, 38, 68, 0.08)",
        }}
      >
        <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 8 }}>
          Merge mode
        </div>
        <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input
            type="radio"
            checked={mergeMode === "copy"}
            onChange={() => setMergeMode("copy")}
            disabled={loading}
          />
          <span>Fast copy (auto re-encode on failure)</span>
        </label>
        <label
          style={{
            display: "flex",
            gap: 6,
            alignItems: "center",
            marginTop: 6,
          }}
        >
          <input
            type="radio"
            checked={mergeMode === "reencode"}
            onChange={() => setMergeMode("reencode")}
            disabled={loading}
          />
          <span>Always re-encode (stability first)</span>
        </label>
        <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
          {ready ? "✅ FFmpeg ready" : "⏳ FFmpeg loading..."}
        </div>
      </div>
    </div>
  );
}

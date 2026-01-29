type CoverArtCardProps = {
  enabled: boolean;
  loading: boolean;
  coverUrl: string;
  onPickCover: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearCover: () => void;
  statusText: string;
};

export default function CoverArtCard({
  enabled,
  loading,
  coverUrl,
  onPickCover,
  onClearCover,
  statusText,
}: CoverArtCardProps) {
  if (!enabled) return null;

  return (
    <div
      style={{
        marginTop: 18,
        padding: 16,
        borderRadius: 14,
        background: "#ffffff",
        border: "1px solid #e6edf5",
        boxShadow: "0 8px 16px rgba(17, 38, 68, 0.08)",
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 8 }}>Cover art</div>
      <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 10 }}>
        Optional. The image is optimised to ~1 MB and embedded as the MP3 cover.
      </div>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <input
          type="file"
          accept="image/*"
          onChange={onPickCover}
          disabled={loading}
        />
        <button onClick={onClearCover} disabled={loading || !coverUrl}>
          Clear cover
        </button>
        {statusText && (
          <span style={{ fontSize: 12, opacity: 0.7 }}>{statusText}</span>
        )}
      </div>
      {coverUrl && (
        <div style={{ marginTop: 10 }}>
          <img
            src={coverUrl}
            alt="Cover preview"
            style={{
              width: 160,
              height: 160,
              objectFit: "cover",
              borderRadius: 10,
              border: "1px solid #e6edf5",
            }}
          />
        </div>
      )}
    </div>
  );
}

type ActionBarProps = {
  loading: boolean;
  filesCount: number;
  onMerge: () => void;
  onReset: () => void;
  downloadUrl: string;
  downloadFileName: string;
  progress: number;
  statusText: string;
  elapsedMs: number;
};

export default function ActionBar({
  loading,
  filesCount,
  onMerge,
  onReset,
  downloadUrl,
  downloadFileName,
  progress,
  statusText,
  elapsedMs,
}: ActionBarProps) {
  const seconds = Math.floor(elapsedMs / 1000);
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        flexWrap: "wrap",
        alignItems: "center",
        marginTop: 16,
      }}
    >
      <button
        onClick={onMerge}
        disabled={loading || filesCount < 2}
        style={{
          padding: "10px 16px",
          borderRadius: 10,
          border: "none",
          background: "#0b1d3a",
          color: "#fff",
        }}
      >
        {loading ? "Merging..." : "Merge"}
      </button>
      <button
        onClick={onReset}
        disabled={loading}
        style={{
          padding: "10px 14px",
          borderRadius: 10,
          border: "1px solid #d9e3ef",
          background: "#f7fbff",
          color: "#0b1d3a",
        }}
      >
        Reset
      </button>

      {downloadUrl && (
        <a
          href={downloadUrl}
          download={downloadFileName}
          style={{
            padding: "10px 14px",
            border: "1px solid #0b1d3a",
            borderRadius: 10,
            color: "#0b1d3a",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
            Download: {downloadFileName}
          </a>
      )}

      <div style={{ minWidth: 220, flex: 1 }}>
        <div
          style={{
            height: 8,
            borderRadius: 999,
            background: "#e7eef6",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${Math.round(progress * 100)}%`,
              height: "100%",
              background: "linear-gradient(90deg, #0b1d3a 0%, #2c7be5 100%)",
              transition: "width 120ms ease",
            }}
          />
        </div>
        <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
          Progress: {Math.round(progress * 100)}%
          {loading && (
            <span style={{ marginLeft: 8 }}>
              • {statusText || "Processing..."} ({mm}:{ss})
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

type FileListProps = {
  files: File[];
  loading: boolean;
  onMove: (from: number, to: number) => void;
  onRemove: (index: number) => void;
};

export default function FileList({
  files,
  loading,
  onMove,
  onRemove,
}: FileListProps) {
  return (
    <>
      <h3 style={{ marginBottom: 8 }}>
        File order (merged from top to bottom)
      </h3>
      {files.length === 0 ? (
        <p style={{ opacity: 0.8 }}>Please choose files.</p>
      ) : (
        <ul style={{ paddingLeft: 18 }}>
          {files.map((f, idx) => (
            <li key={idx} style={{ marginBottom: 6 }}>
              <strong>{idx + 1}.</strong> {f.name}{" "}
              <span style={{ opacity: 0.7 }}>
                ({Math.round(f.size / 1024 / 1024)}MB)
              </span>{" "}
              <button
                onClick={() => onMove(idx, Math.max(0, idx - 1))}
                disabled={loading || idx === 0}
              >
                ↑
              </button>{" "}
              <button
                onClick={() => onMove(idx, Math.min(files.length - 1, idx + 1))}
                disabled={loading || idx === files.length - 1}
              >
                ↓
              </button>{" "}
              <button onClick={() => onRemove(idx)} disabled={loading}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

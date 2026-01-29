import { useEffect, useMemo } from "react";
import type { FileSetting, MediaType } from "../types";

type FileListProps = {
  files: File[];
  settings: FileSetting[];
  mediaType: MediaType;
  loading: boolean;
  onMove: (from: number, to: number) => void;
  onRemove: (index: number) => void;
  onUpdateSetting: (index: number, patch: Partial<FileSetting>) => void;
};

export default function FileList({
  files,
  settings,
  mediaType,
  loading,
  onMove,
  onRemove,
  onUpdateSetting,
}: FileListProps) {
  const urls = useMemo(
    () => files.map((file) => URL.createObjectURL(file)),
    [files],
  );

  useEffect(() => {
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [urls]);

  return (
    <>
      <h3 style={{ marginBottom: 8 }}>
        File order (merged from top to bottom)
      </h3>
      {files.length === 0 ? (
        <p style={{ opacity: 0.8 }}>Please choose files.</p>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {files.map((f, idx) => {
            const setting = settings[idx] ?? {
              start: 0,
              end: 0,
              fadeIn: 0,
              fadeOut: 0,
            };
            return (
              <div
                key={idx}
                style={{
                  padding: 12,
                  borderRadius: 12,
                  border: "1px solid #e6edf5",
                  background: "#ffffff",
                  boxShadow: "0 6px 14px rgba(17, 38, 68, 0.06)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <strong>{idx + 1}.</strong>
                  <span>{f.name}</span>
                  <span style={{ opacity: 0.7 }}>
                    ({Math.round(f.size / 1024 / 1024)}MB)
                  </span>
                  <button
                    onClick={() => onMove(idx, Math.max(0, idx - 1))}
                    disabled={loading || idx === 0}
                  >
                    ↑
                  </button>
                  <button
                    onClick={() =>
                      onMove(idx, Math.min(files.length - 1, idx + 1))
                    }
                    disabled={loading || idx === files.length - 1}
                  >
                    ↓
                  </button>
                  <button onClick={() => onRemove(idx)} disabled={loading}>
                    Remove
                  </button>
                </div>

                <div style={{ marginTop: 10 }}>
                  {mediaType === "audio" ? (
                    <audio controls src={urls[idx]} style={{ width: "100%" }} />
                  ) : (
                    <video
                      controls
                      src={urls[idx]}
                      style={{ width: "100%", borderRadius: 8 }}
                    />
                  )}
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(160px, 1fr))",
                    gap: 8,
                    marginTop: 10,
                  }}
                >
                  <label>
                    Start (s)
                    <input
                      type="number"
                      min={0}
                      step={0.1}
                      value={setting.start}
                      onChange={(e) =>
                        onUpdateSetting(idx, {
                          start: Number(e.target.value),
                        })
                      }
                      disabled={loading}
                    />
                  </label>
                  <label>
                    End (s)
                    <input
                      type="number"
                      min={0}
                      step={0.1}
                      value={setting.end}
                      onChange={(e) =>
                        onUpdateSetting(idx, {
                          end: Number(e.target.value),
                        })
                      }
                      disabled={loading}
                    />
                  </label>
                  <label>
                    Fade in (s)
                    <input
                      type="number"
                      min={0}
                      step={0.1}
                      value={setting.fadeIn}
                      onChange={(e) =>
                        onUpdateSetting(idx, {
                          fadeIn: Number(e.target.value),
                        })
                      }
                      disabled={loading}
                    />
                  </label>
                  <label>
                    Fade out (s)
                    <input
                      type="number"
                      min={0}
                      step={0.1}
                      value={setting.fadeOut}
                      onChange={(e) =>
                        onUpdateSetting(idx, {
                          fadeOut: Number(e.target.value),
                        })
                      }
                      disabled={loading}
                    />
                  </label>
                </div>
                <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
                  End time is required for fade-out.
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

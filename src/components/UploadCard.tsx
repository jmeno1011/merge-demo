import type { ChangeEvent, DragEvent } from "react";
import type { MediaType } from "../types";

type UploadCardProps = {
  mediaType: MediaType;
  accept: string;
  loading: boolean;
  onPickFiles: (e: ChangeEvent<HTMLInputElement>) => void;
  onDropFiles: (e: DragEvent<HTMLDivElement>) => void;
  inputKey: number;
};

export default function UploadCard({
  mediaType,
  accept,
  loading,
  onPickFiles,
  onDropFiles,
  inputKey,
}: UploadCardProps) {
  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDropFiles}
      style={{
        border: "2px dashed #98b4d0",
        borderRadius: 12,
        padding: "24px 16px",
        textAlign: "center",
        color: "#2f4b66",
        background: "linear-gradient(180deg, #f7fbff, #ffffff)",
      }}
    >
      <div style={{ fontWeight: 600 }}>Drag and drop files</div>
      <div style={{ fontSize: 13, opacity: 0.75, marginTop: 6 }}>
        {mediaType === "audio"
          ? "Supports MP3, M4A, WAV"
          : "Supports MP4, MOV"}
      </div>
      <div style={{ marginTop: 12 }}>
        <input
          key={inputKey}
          type="file"
          accept={accept}
          multiple
          onChange={onPickFiles}
          disabled={loading}
        />
      </div>
    </div>
  );
}

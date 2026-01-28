import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import type { MediaType, MergeMode } from "./types";
import HeaderCard from "./components/HeaderCard";
import ControlsPanel from "./components/ControlsPanel";
import MergeSection from "./components/MergeSection";
import UploadCard from "./components/UploadCard";
import ActionBar from "./components/ActionBar";
import ErrorBanner from "./components/ErrorBanner";
import FileList from "./components/FileList";
import LogPanel from "./components/LogPanel";

type FFmpegProgressEvent = { ratio?: number };

export default function App() {
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const initRef = useRef<Promise<void> | null>(null);

  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [mediaType, setMediaType] = useState<MediaType>("audio");
  const [files, setFiles] = useState<File[]>([]);
  const [downloadUrl, setDownloadUrl] = useState<string>("");
  const [outputName, setOutputName] = useState<string>("merged");
  const [progress, setProgress] = useState<number>(0);
  const [mergeMode, setMergeMode] = useState<MergeMode>("copy");
  const [statusText, setStatusText] = useState<string>("");
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [clickCount, setClickCount] = useState<number>(0);
  const [lastClickAt, setLastClickAt] = useState<string>("");
  const [inputKey, setInputKey] = useState<number>(0);

  const accept = useMemo(() => {
    // Use broad MIME types + extensions for better cross-browser support.
    return mediaType === "audio"
      ? "audio/*,.mp3,.m4a,.wav"
      : "video/*,.mp4,.mov";
  }, [mediaType]);

  const ensureReady = useCallback(async () => {
    if (initRef.current) return initRef.current;

    initRef.current = (async () => {
      try {
        const ffmpeg = new FFmpeg();
        ffmpegRef.current = ffmpeg;

        ffmpeg.on("log", ({ message }) => {
          setLog((prev) => (prev + message + "\n").slice(-8000));
        });

        const isFFmpegProgressEvent = (
          value: unknown,
        ): value is FFmpegProgressEvent => {
          return (
            !!value &&
            typeof value === "object" &&
            typeof (value as FFmpegProgressEvent).ratio === "number"
          );
        };

        ffmpeg.on("progress", (event: unknown) => {
          const ratio = isFFmpegProgressEvent(event) ? (event.ratio ?? 0) : 0;
          setProgress(Math.max(0, Math.min(1, ratio)));
          setStatusText("Merging...");
        });

        // Load ffmpeg core/wasm from CDN
        setStatusText("Loading FFmpeg core...");
        const baseURL =
          "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm";
        await ffmpeg.load({
          coreURL: await toBlobURL(
            `${baseURL}/ffmpeg-core.js`,
            "text/javascript",
          ),
          wasmURL: await toBlobURL(
            `${baseURL}/ffmpeg-core.wasm`,
            "application/wasm",
          ),
        });

        setReady(true);
      } catch (err) {
        console.error(err);
        setReady(false);
        setLog((prev) =>
          (prev + "FFmpeg load failed: " + String(err) + "\n").slice(-8000),
        );
        initRef.current = null;
        throw err;
      }
    })();

    return initRef.current;
  }, []);

  useEffect(() => {
    void ensureReady();
  }, [ensureReady]);

  useEffect(() => {
    // Clear previous download URL when files/type change
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setDownloadUrl("");
    setProgress(0);
    setStatusText("");
    setElapsedMs(0);
  }, [mediaType, files]);

  useEffect(() => {
    // Reset files when media type changes
    setFiles([]);
    setError("");
  }, [mediaType]);

  useEffect(() => {
    if (!loading) return;
    const startedAt = Date.now();
    setElapsedMs(0);
    const timer = setInterval(() => {
      setElapsedMs(Date.now() - startedAt);
    }, 250);
    return () => clearInterval(timer);
  }, [loading]);

  const isAudioFile = (file: File) => {
    const name = file.name.toLowerCase();
    return (
      file.type.startsWith("audio/") ||
      name.endsWith(".mp3") ||
      name.endsWith(".m4a") ||
      name.endsWith(".wav")
    );
  };

  const isVideoFile = (file: File) => {
    const name = file.name.toLowerCase();
    return (
      file.type.startsWith("video/") ||
      name.endsWith(".mp4") ||
      name.endsWith(".mov")
    );
  };

  const filterByType = (list: File[]) => {
    return list.filter((f) =>
      mediaType === "audio" ? isAudioFile(f) : isVideoFile(f),
    );
  };

  const applyFiles = (list: File[], actionLabel: string) => {
    if (list.length === 0) return;
    const filtered = filterByType(list);
    if (filtered.length === 0) {
      setError(
        mediaType === "audio"
          ? `Please ${actionLabel} audio files only. (mp3, m4a, wav)`
          : `Please ${actionLabel} video files only. (mp4, mov)`,
      );
      return;
    }
    if (filtered.length !== list.length) {
      setError(
        mediaType === "audio"
          ? "Kept audio files only. (mp3, m4a, wav)"
          : "Kept video files only. (mp4, mov)",
      );
    } else {
      setError("");
    }
    setFiles(filtered);
  };

  const onPickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files ?? []);
    applyFiles(list, "select");
  };

  const onDropFiles = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const list = Array.from(e.dataTransfer.files ?? []);
    applyFiles(list, "drop");
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const moveFile = (from: number, to: number) => {
    setFiles((prev) => {
      const next = [...prev];
      const item = next.splice(from, 1)[0];
      next.splice(to, 0, item);
      return next;
    });
  };

  const merge = async () => {
    setLoading(true);
    if (!ready) {
      setStatusText("Checking FFmpeg loading...");
      try {
        const timeoutMs = 20000;
        await Promise.race([
          ensureReady(),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error("FFmpeg load timed out")),
              timeoutMs,
            ),
          ),
        ]);
      } catch (err) {
        const message = String((err as Error)?.message ?? err);
        setError(message);
        setStatusText("FFmpeg load failed");
        alert("FFmpeg failed to load, so merging cannot start.");
        setLoading(false);
        return;
      }
    }
    if (files.length < 2) {
      alert("Please select at least two files.");
      setLoading(false);
      return;
    }

    const ffmpeg = ffmpegRef.current;
    if (!ffmpeg) {
      setError("Could not create the FFmpeg instance.");
      setStatusText("FFmpeg init failed");
      setLoading(false);
      return;
    }
    setLog("");
    setDownloadUrl("");
    setProgress(0);
    setError("");
    setStatusText("Preparing input files...");
    alert("Merge started!");

    try {
      // 1) Write input files to FFmpeg FS
      const inputNames: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const ext = f.name.split(".").pop()?.toLowerCase();
        const safeExt =
          ext && ext.length <= 5
            ? ext.replace(/[^a-z0-9]/g, "")
            : mediaType === "audio"
              ? "mp3"
              : "mp4";
        const name = `input_${String(i).padStart(2, "0")}.${safeExt}`;
        inputNames.push(name);
        await ffmpeg.writeFile(name, await fetchFile(f));
      }

      // 2) Write concat list file
      // The FFmpeg concat demuxer needs a file in this format:
      // file 'input_00.mp3'
      // file 'input_01.mp3'
      const listTxt = inputNames.map((n) => `file '${n}'`).join("\n");
      await ffmpeg.writeFile("list.txt", new TextEncoder().encode(listTxt));

      // 3) Run merge
      setStatusText("Starting merge...");
      const outExt = mediaType === "audio" ? "mp3" : "mp4";
      const outFile = `output.${outExt}`;

      const runCopy = async () => {
        await ffmpeg.exec([
          "-f",
          "concat",
          "-safe",
          "0",
          "-i",
          "list.txt",
          "-c",
          "copy",
          outFile,
        ]);
      };

      const runReencode = async () => {
        if (mediaType === "audio") {
          await ffmpeg.exec([
            "-f",
            "concat",
            "-safe",
            "0",
            "-i",
            "list.txt",
            "-c:a",
            "libmp3lame",
            "-b:a",
            "192k",
            outFile,
          ]);
          return;
        }

        await ffmpeg.exec([
          "-f",
          "concat",
          "-safe",
          "0",
          "-i",
          "list.txt",
          "-c:v",
          "libx264",
          "-c:a",
          "aac",
          "-movflags",
          "+faststart",
          outFile,
        ]);
      };

      if (mergeMode === "copy") {
        try {
          await runCopy();
        } catch (err) {
          setLog((prev) =>
            (prev + "\n⚠️ -c copy failed, retrying with re-encode.\n").slice(
              -8000,
            ),
          );
          await runReencode();
        }
      } else {
        await runReencode();
      }

      // If -c copy fails for video, re-encode often improves success rates:
      // await ffmpeg.exec([
      //   "-f", "concat", "-safe", "0", "-i", "list.txt",
      //   "-c:v", "libx264", "-c:a", "aac", "-movflags", "+faststart",
      //   outFile
      // ])

      // 4) Read output file and create download URL
      setStatusText("Generating output file...");
      const data = await ffmpeg.readFile(outFile); // Uint8Array
      const mime = mediaType === "audio" ? "audio/mpeg" : "video/mp4";
      // ffmpeg.readFile returns a Uint8Array whose .buffer may be an ArrayBufferLike
      // (e.g. SharedArrayBuffer). Convert to a plain ArrayBuffer slice to satisfy
      // the Blob constructor's type (ArrayBuffer).
      const arr =
        data instanceof Uint8Array ? data : new Uint8Array(data as any);
      const arrayBuffer = arr.buffer.slice(
        arr.byteOffset,
        arr.byteOffset + arr.byteLength,
      );
      const blob = new Blob([arrayBuffer], { type: mime });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setProgress(1);
      setStatusText("Done!");
    } catch (err: any) {
      console.error(err);
      const message = String(err?.message ?? err);
      setError(message);
      setStatusText("Error occurred");
      alert("Merge failed! Please check the error message for details.");
    } finally {
      setLoading(false);
    }
  };

  const handleMergeClick = () => {
    setClickCount((prev) => prev + 1);
    setLastClickAt(new Date().toLocaleTimeString());
    setStatusText("Merge requested");
    void merge();
  };

  const resetAll = () => {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setFiles([]);
    setLog("");
    setError("");
    setDownloadUrl("");
    setProgress(0);
    setStatusText("");
    setElapsedMs(0);
    setOutputName("merged");
    setClickCount(0);
    setLastClickAt("");
    setInputKey((prev) => prev + 1);
  };

  const downloadFileName = useMemo(() => {
    const ext = mediaType === "audio" ? "mp3" : "mp4";
    const safe = outputName.trim() ? outputName.trim() : "merged";
    return `${safe}.${ext}`;
  }, [outputName, mediaType]);

  const isMergeDisabled = loading || files.length < 2;

  return (
    <div
      style={{
        maxWidth: 900,
        margin: "32px auto 64px",
        padding: 16,
        fontFamily:
          "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont",
      }}
    >
      <HeaderCard />

      <ControlsPanel
        mediaType={mediaType}
        setMediaType={setMediaType}
        outputName={outputName}
        setOutputName={setOutputName}
        mergeMode={mergeMode}
        setMergeMode={setMergeMode}
        ready={ready}
        loading={loading}
      />

      <MergeSection>
        <UploadCard
          mediaType={mediaType}
          accept={accept}
          loading={loading}
          onPickFiles={onPickFiles}
          onDropFiles={onDropFiles}
          inputKey={inputKey}
        />
        <ActionBar
          loading={loading}
          filesCount={files.length}
          onMerge={handleMergeClick}
          onReset={resetAll}
          downloadUrl={downloadUrl}
          downloadFileName={downloadFileName}
          progress={progress}
          statusText={statusText}
          elapsedMs={elapsedMs}
        />
        <div
          style={{
            marginTop: 12,
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #e6edf5",
            background: "#f7fbff",
            fontSize: 12,
            color: "#274060",
          }}
        >
          Status: ready={String(ready)} · loading={String(loading)} · files=
          {files.length} · mergeMode={mergeMode} · disabled=
          {String(isMergeDisabled)}
          <br />
          Last click: {lastClickAt || "-"} (total {clickCount})
        </div>
        <ErrorBanner error={error} />
      </MergeSection>

      <FileList
        files={files}
        loading={loading}
        onMove={moveFile}
        onRemove={removeFile}
      />
      <LogPanel log={log} />
    </div>
  );
}

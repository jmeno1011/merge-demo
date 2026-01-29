import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import type { MediaType, MergeMode, FileSetting } from "./types";
import HeaderCard from "./components/HeaderCard";
import ControlsPanel from "./components/ControlsPanel";
import MergeSection from "./components/MergeSection";
import UploadCard from "./components/UploadCard";
import ActionBar from "./components/ActionBar";
import ErrorBanner from "./components/ErrorBanner";
import FileList from "./components/FileList";
import LogPanel from "./components/LogPanel";
import OutputPreview from "./components/OutputPreview";
import CoverArtCard from "./components/CoverArtCard";

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
  const [fileSettings, setFileSettings] = useState<FileSetting[]>([]);
  const [downloadUrl, setDownloadUrl] = useState<string>("");
  const [outputName, setOutputName] = useState<string>("merged");
  const [progress, setProgress] = useState<number>(0);
  const [mergeMode, setMergeMode] = useState<MergeMode>("copy");
  const [statusText, setStatusText] = useState<string>("");
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [clickCount, setClickCount] = useState<number>(0);
  const [lastClickAt, setLastClickAt] = useState<string>("");
  const [inputKey, setInputKey] = useState<number>(0);
  const [coverBlob, setCoverBlob] = useState<Blob | null>(null);
  const [coverUrl, setCoverUrl] = useState<string>("");
  const [coverStatus, setCoverStatus] = useState<string>("");

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
    setFileSettings([]);
    setError("");
    setCoverBlob(null);
    if (coverUrl) URL.revokeObjectURL(coverUrl);
    setCoverUrl("");
    setCoverStatus("");
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

  const compressCoverImage = async (file: File) => {
    const img = await createImageBitmap(file);
    const maxSize = 1024;
    const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
    const width = Math.max(1, Math.round(img.width * scale));
    const height = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to create canvas context.");
    ctx.drawImage(img, 0, 0, width, height);

    const maxBytes = 1_000_000;
    let quality = 0.9;
    let blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );

    while (blob && blob.size > maxBytes && quality > 0.5) {
      quality -= 0.1;
      blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", quality),
      );
    }

    if (blob && blob.size > maxBytes) {
      const shrink = 0.85;
      canvas.width = Math.max(1, Math.round(width * shrink));
      canvas.height = Math.max(1, Math.round(height * shrink));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.8),
      );
    }

    if (!blob) throw new Error("Failed to compress image.");
    return blob;
  };

  const onPickCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setCoverStatus("Please select an image file.");
      return;
    }
    setCoverStatus("Optimising cover...");
    try {
      const blob = await compressCoverImage(file);
      if (coverUrl) URL.revokeObjectURL(coverUrl);
      setCoverBlob(blob);
      setCoverUrl(URL.createObjectURL(blob));
      setCoverStatus(
        `Ready (${Math.round(blob.size / 1024)} KB, JPEG)`,
      );
    } catch (err) {
      setCoverBlob(null);
      setCoverStatus("Failed to optimise cover.");
      console.error(err);
    }
  };

  const clearCover = () => {
    setCoverBlob(null);
    if (coverUrl) URL.revokeObjectURL(coverUrl);
    setCoverUrl("");
    setCoverStatus("");
  };

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
    setFileSettings(
      filtered.map(() => ({ start: 0, end: 0, fadeIn: 0, fadeOut: 0 })),
    );
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
    setFileSettings((prev) => prev.filter((_, i) => i !== index));
  };

  const moveFile = (from: number, to: number) => {
    setFiles((prev) => {
      const next = [...prev];
      const item = next.splice(from, 1)[0];
      next.splice(to, 0, item);
      return next;
    });
    setFileSettings((prev) => {
      const next = [...prev];
      const item = next.splice(from, 1)[0];
      next.splice(to, 0, item);
      return next;
    });
  };

  const updateFileSetting = (
    index: number,
    patch: Partial<FileSetting>,
  ) => {
    setFileSettings((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
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
      const defaultSetting: FileSetting = {
        start: 0,
        end: 0,
        fadeIn: 0,
        fadeOut: 0,
      };
      const resolvedSettings = files.map(
        (_, i) => fileSettings[i] ?? defaultSetting,
      );
      const hasEdits = resolvedSettings.some(
        (s) => s.start > 0 || s.end > 0 || s.fadeIn > 0 || s.fadeOut > 0,
      );
      const forceReencode = mergeMode === "reencode" || hasEdits;

      for (let i = 0; i < resolvedSettings.length; i++) {
        const s = resolvedSettings[i];
        if (s.start < 0 || s.end < 0 || s.fadeIn < 0 || s.fadeOut < 0) {
          setError("Trim and fade values must be zero or positive.");
          setStatusText("Invalid settings");
          setLoading(false);
          return;
        }
        if (s.end > 0 && s.end <= s.start) {
          setError("End time must be greater than start time.");
          setStatusText("Invalid settings");
          setLoading(false);
          return;
        }
        if (s.fadeOut > 0 && s.end <= 0) {
          setError("Fade-out requires an end time.");
          setStatusText("Invalid settings");
          setLoading(false);
          return;
        }
        if (s.end > 0) {
          const duration = s.end - s.start;
          if (s.fadeIn + s.fadeOut > duration) {
            setError("Fade durations exceed the clip length.");
            setStatusText("Invalid settings");
            setLoading(false);
            return;
          }
        }
      }

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

      const outExt = mediaType === "audio" ? "mp3" : "mp4";
      const processedNames: string[] = [];
      if (forceReencode) {
        setStatusText("Preparing clips (re-encode)...");
        for (let i = 0; i < inputNames.length; i++) {
          const inputName = inputNames[i];
          const s = resolvedSettings[i];
          const processedName = `processed_${String(i).padStart(2, "0")}.${outExt}`;
          const start = s.start > 0 ? s.start : 0;
          const end = s.end > 0 ? s.end : 0;
          const fadeIn = s.fadeIn > 0 ? s.fadeIn : 0;
          const fadeOut = s.fadeOut > 0 ? s.fadeOut : 0;
          const duration = end > 0 ? Math.max(0, end - start) : 0;
          const args: string[] = [];

          setStatusText(`Processing clip ${i + 1}/${inputNames.length}...`);

          if (start > 0) args.push("-ss", String(start));
          if (end > 0) args.push("-to", String(end));
          args.push("-i", inputName);

          if (mediaType === "audio") {
            const afilters: string[] = [];
            if (fadeIn > 0) {
              afilters.push(`afade=t=in:st=0:d=${fadeIn}`);
            }
            if (fadeOut > 0) {
              const fadeStart = Math.max(0, duration - fadeOut);
              afilters.push(`afade=t=out:st=${fadeStart}:d=${fadeOut}`);
            }
            if (afilters.length > 0) {
              args.push("-af", afilters.join(","));
            }
            args.push("-c:a", "libmp3lame", "-b:a", "192k", processedName);
          } else {
            const vfilters: string[] = [];
            const afilters: string[] = [];
            if (fadeIn > 0) {
              vfilters.push(`fade=t=in:st=0:d=${fadeIn}`);
              afilters.push(`afade=t=in:st=0:d=${fadeIn}`);
            }
            if (fadeOut > 0) {
              const fadeStart = Math.max(0, duration - fadeOut);
              vfilters.push(`fade=t=out:st=${fadeStart}:d=${fadeOut}`);
              afilters.push(`afade=t=out:st=${fadeStart}:d=${fadeOut}`);
            }
            if (vfilters.length > 0) {
              args.push("-vf", vfilters.join(","));
            }
            if (afilters.length > 0) {
              args.push("-af", afilters.join(","));
            }
            args.push(
              "-c:v",
              "libx264",
              "-c:a",
              "aac",
              "-movflags",
              "+faststart",
              processedName,
            );
          }

          await ffmpeg.exec(args);
          processedNames.push(processedName);
        }
      }

      // 2) Write concat list file
      // The FFmpeg concat demuxer needs a file in this format:
      // file 'input_00.mp3'
      // file 'input_01.mp3'
      const listSource = forceReencode ? processedNames : inputNames;
      const listTxt = listSource.map((n) => `file '${n}'`).join("\n");
      await ffmpeg.writeFile("list.txt", new TextEncoder().encode(listTxt));

      // 3) Run merge
      setStatusText("Starting merge...");
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

      if (forceReencode) {
        await runCopy();
      } else if (mergeMode === "copy") {
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
      let finalOutFile = outFile;
      if (mediaType === "audio" && coverBlob) {
        setStatusText("Embedding cover art...");
        await ffmpeg.writeFile("cover.jpg", await fetchFile(coverBlob));
        const outWithCover = "output_with_cover.mp3";
        await ffmpeg.exec([
          "-i",
          outFile,
          "-i",
          "cover.jpg",
          "-map",
          "0:a",
          "-map",
          "1:v",
          "-c:a",
          "copy",
          "-c:v",
          "mjpeg",
          "-id3v2_version",
          "3",
          "-metadata:s:v",
          "title=Album cover",
          "-metadata:s:v",
          "comment=Cover (front)",
          outWithCover,
        ]);
        finalOutFile = outWithCover;
      }

      const data = await ffmpeg.readFile(finalOutFile); // Uint8Array
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
    setFileSettings([]);
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
    clearCover();
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

      <CoverArtCard
        enabled={mediaType === "audio"}
        loading={loading}
        coverUrl={coverUrl}
        onPickCover={onPickCover}
        onClearCover={clearCover}
        statusText={coverStatus}
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
        <OutputPreview url={downloadUrl} mediaType={mediaType} />
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
        settings={fileSettings}
        mediaType={mediaType}
        loading={loading}
        onMove={moveFile}
        onRemove={removeFile}
        onUpdateSetting={updateFileSetting}
      />
      <LogPanel log={log} />
    </div>
  );
}

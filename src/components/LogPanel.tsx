type LogPanelProps = {
  log: string;
};

export default function LogPanel({ log }: LogPanelProps) {
  return (
    <>
      <h3 style={{ marginBottom: 8 }}>FFmpeg log</h3>
      <textarea
        readOnly
        value={log}
        style={{
          width: "100%",
          height: 220,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        }}
      />
    </>
  );
}

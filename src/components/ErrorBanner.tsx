type ErrorBannerProps = {
  error: string;
};

export default function ErrorBanner({ error }: ErrorBannerProps) {
  if (!error) return null;

  return (
    <div
      style={{
        marginTop: 14,
        padding: "10px 12px",
        borderRadius: 10,
        background: "#fff4f4",
        border: "1px solid #ffd0d0",
        color: "#a11d1d",
        fontSize: 13,
        whiteSpace: "pre-wrap",
      }}
    >
      Error: {error}
    </div>
  );
}

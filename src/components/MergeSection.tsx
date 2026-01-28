import type { ReactNode } from "react";

type MergeSectionProps = {
  children: ReactNode;
};

export default function MergeSection({ children }: MergeSectionProps) {
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
      {children}
    </div>
  );
}

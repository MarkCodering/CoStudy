import type { ReactNode } from "react";

export function EmptyState({
  eyebrow,
  title,
  body,
  action,
}: {
  eyebrow?: string;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div
      style={{
        maxWidth: 480,
        margin: "80px auto",
        textAlign: "center",
        padding: "0 24px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
      }}
    >
      {eyebrow && (
        <div style={{ fontSize: 9.5, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--color-accent)" }}>
          {eyebrow}
        </div>
      )}
      <h3 style={{ margin: 0, fontWeight: 400, fontSize: 24 }}>{title}</h3>
      {body && <p style={{ fontSize: 13.5, color: "var(--color-neutral-600)", margin: 0 }}>{body}</p>}
      {action && <div style={{ marginTop: 8, display: "flex", gap: 10, justifyContent: "center" }}>{action}</div>}
    </div>
  );
}

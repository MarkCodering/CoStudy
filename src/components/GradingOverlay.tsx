"use client";

import { GRADE_STEPS } from "@/data/examData";

export function GradingOverlay({ gradeStep }: { gradeStep: number }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "color-mix(in srgb, var(--color-bg) 88%, transparent)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 20,
      }}
    >
      <div
        style={{
          border: "1px solid var(--color-divider)",
          background: "var(--color-bg)",
          boxShadow: "var(--shadow-lg)",
          borderRadius: "var(--radius-md)",
          padding: "34px 40px",
          width: 420,
          textAlign: "center",
        }}
      >
        <div style={{ fontFamily: "var(--font-heading)", fontSize: 24 }}>Marking your paper</div>
        <div style={{ fontSize: 13, color: "var(--color-neutral-600)", marginTop: 6 }}>5 answers · 48 marks</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 22, textAlign: "left" }}>
          {GRADE_STEPS.map((label, i) => (
            <div
              key={label}
              style={{
                fontSize: 13.5,
                color: i < gradeStep ? "var(--color-text)" : "var(--color-neutral-500)",
                animation: i === gradeStep ? "examPulse 1.3s ease-in-out infinite" : "none",
              }}
            >
              <span style={{ width: 14, display: "inline-block" }}>{i < gradeStep ? "✓" : i === gradeStep ? "·" : ""}</span>
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

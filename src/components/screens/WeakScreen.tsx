"use client";

import { EmptyState } from "@/components/EmptyState";
import { computeHeatmap, computeTopicStats, computeTrend } from "@/lib/analytics";
import { isGraded } from "@/lib/models";
import type { ExamPracticeState } from "@/hooks/useExamPractice";

const HEAT_CELL_COLORS = ["transparent", "var(--color-accent-200)", "var(--color-accent-400)", "var(--color-accent-600)"];

export function WeakScreen({ state }: { state: ExamPracticeState }) {
  const { papers, go } = state;
  const gradedCount = papers.filter(isGraded).length;

  if (gradedCount === 0) {
    return (
      <EmptyState
        eyebrow="Diagnosis"
        title="Nothing to diagnose yet"
        body="Mark a paper or two and this page fills in with your real topic breakdown, error trend and a heatmap — all computed from your own scores."
        action={
          <button className="btn btn-primary" onClick={() => go("library")}>
            Go to Library
          </button>
        }
      />
    );
  }

  const topics = computeTopicStats(papers);
  const trend = computeTrend(papers);
  const { cols, rows } = computeHeatmap(papers);
  const trendPoints = trend.map((t, i) => ({ x: 20 + i * (280 / Math.max(1, trend.length - 1 || 1)), y: 100 - t.pct * 0.9 }));

  return (
    <div style={{ maxWidth: 1120, padding: "38px 46px 80px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          borderBottom: "1px solid var(--color-divider)",
          paddingBottom: 18,
        }}
      >
        <div>
          <div style={{ fontSize: 9.5, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--color-accent)" }}>
            Diagnosis · {gradedCount} paper{gradedCount === 1 ? "" : "s"} marked
          </div>
          <h2 style={{ margin: "6px 0 0", fontWeight: 400, fontSize: 36 }}>Weakness</h2>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.25fr 1fr", gap: 0, borderBottom: "1px solid var(--color-divider)" }}>
        <div style={{ padding: "26px 34px 30px 0", borderRight: "1px solid var(--color-divider)" }}>
          <h5 style={{ margin: "0 0 4px" }}>Topics by error rate</h5>
          <p style={{ fontSize: 12.5, color: "var(--color-neutral-600)", margin: "0 0 18px" }}>
            Marks lost as a share of marks available, across every marked paper.
          </p>
          {topics.map((t) => (
            <div key={t.name} style={{ padding: "11px 0", borderTop: "1px solid var(--color-divider)" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                <span style={{ fontFamily: "var(--font-heading)", fontSize: 16.5, flex: 1 }}>{t.name}</span>
                <span style={{ fontSize: 12, color: "var(--color-neutral-600)", fontVariantNumeric: "tabular-nums" }}>
                  {t.attempts} attempt{t.attempts === 1 ? "" : "s"}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontVariantNumeric: "tabular-nums",
                    width: 78,
                    textAlign: "right",
                    color: t.rate > 45 ? "var(--color-accent-700)" : "var(--color-neutral-600)",
                  }}
                >
                  {t.rate}% lost
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 7 }}>
                <div style={{ flex: 1, height: 5, background: "var(--color-neutral-200)", borderRadius: 3, overflow: "hidden" }}>
                  <div
                    style={{
                      width: t.mastery + "%",
                      height: "100%",
                      background: t.mastery < 55 ? "var(--color-accent-600)" : "var(--color-accent-300)",
                    }}
                  />
                </div>
                <span style={{ fontSize: 11, color: "var(--color-neutral-500)", width: 96, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                  {t.mastery}% mastery
                </span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: "26px 0 30px 34px" }}>
          <h5 style={{ margin: "0 0 4px" }}>Score across your last {trend.length} marked paper{trend.length === 1 ? "" : "s"}</h5>
          <p style={{ fontSize: 12.5, color: "var(--color-neutral-600)", margin: "0 0 12px" }}>Per cent of marks awarded.</p>
          {trend.length > 1 ? (
            <svg viewBox="0 0 320 110" style={{ width: "100%", height: 112, overflow: "visible" }}>
              <line x1={0} y1={100} x2={320} y2={100} stroke="var(--color-divider)" strokeWidth={1} />
              <line x1={0} y1={50} x2={320} y2={50} stroke="var(--color-divider)" strokeWidth={1} strokeDasharray="2 4" />
              <polyline points={trendPoints.map((p) => p.x + "," + p.y).join(" ")} fill="none" stroke="var(--color-accent)" strokeWidth={1.6} />
              {trendPoints.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r={3} fill="var(--color-bg)" stroke="var(--color-accent)" strokeWidth={1.4} />
              ))}
              {trendPoints.map((p, i) => (
                <text key={i} x={p.x} y={p.y - 10} textAnchor="middle" fontSize={9} fill="var(--color-neutral-600)" fontFamily="Lora, serif">
                  {trend[i].pct}%
                </text>
              ))}
            </svg>
          ) : (
            <p style={{ fontSize: 13, color: "var(--color-neutral-500)", fontStyle: "italic" }}>Mark one more paper to see a trend line.</p>
          )}
        </div>
      </div>

      {rows.length > 0 && (
        <div style={{ padding: "26px 0 0" }}>
          <h5 style={{ margin: "0 0 4px" }}>Topic against attempt</h5>
          <p style={{ fontSize: 12.5, color: "var(--color-neutral-600)", margin: "0 0 16px" }}>
            Darker is a heavier loss of marks. Read left to right for a topic that is not moving.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
              <span style={{ width: 186 }} />
              {cols.map((c) => (
                <span key={c} style={{ flex: 1, fontSize: 10.5, color: "var(--color-neutral-500)", textAlign: "center", fontVariantNumeric: "tabular-nums" }}>
                  {c}
                </span>
              ))}
            </div>
            {rows.map((r) => (
              <div key={r.topic} style={{ display: "flex", gap: 5, alignItems: "center" }}>
                <span style={{ width: 186, fontSize: 13, paddingRight: 10 }}>{r.topic}</span>
                {r.cells.map((c, i) => (
                  <div
                    key={i}
                    title={c.title}
                    style={{
                      flex: 1,
                      height: 30,
                      borderRadius: 2,
                      border: "1px solid var(--color-divider)",
                      background: HEAT_CELL_COLORS[c.bucket],
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

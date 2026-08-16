// Derives the Weakness dashboard entirely from the user's own marked
// papers — no fixture stats. Every number here traces back to a real
// score the user entered on the Graded screen.

import type { PaperRecord } from "@/lib/models";
import { isGraded, totalMarks, totalScore } from "@/lib/models";

export interface TopicStat {
  name: string;
  attempts: number;
  marksLost: number;
  marksAvailable: number;
  rate: number; // % of available marks lost, rounded
  mastery: number; // % of available marks scored, rounded
}

export interface TrendPoint {
  paperId: string;
  label: string; // short paper title for the axis
  pct: number;
}

export interface HeatCell {
  bucket: 0 | 1 | 2 | 3; // 0 = no attempt that paper, 1..3 = increasing loss
  title: string;
}

export interface HeatRow {
  topic: string;
  cells: HeatCell[];
}

function gradedPapersByDate(papers: PaperRecord[]): PaperRecord[] {
  return papers
    .filter(isGraded)
    .filter((p) => p.gradedAt)
    .sort((a, b) => new Date(a.gradedAt!).getTime() - new Date(b.gradedAt!).getTime());
}

export function computeTopicStats(papers: PaperRecord[]): TopicStat[] {
  const byTopic = new Map<string, { attempts: number; lost: number; avail: number }>();
  for (const paper of papers) {
    if (!isGraded(paper)) continue;
    for (const q of paper.questions) {
      const entry = byTopic.get(q.topic) ?? { attempts: 0, lost: 0, avail: 0 };
      entry.attempts += 1;
      entry.avail += q.marks;
      entry.lost += q.marks - (q.score ?? 0);
      byTopic.set(q.topic, entry);
    }
  }
  return [...byTopic.entries()]
    .map(([name, s]) => ({
      name,
      attempts: s.attempts,
      marksLost: s.lost,
      marksAvailable: s.avail,
      rate: s.avail ? Math.round((s.lost / s.avail) * 100) : 0,
      mastery: s.avail ? Math.round(((s.avail - s.lost) / s.avail) * 100) : 0,
    }))
    .sort((a, b) => b.rate - a.rate);
}

export function computeTrend(papers: PaperRecord[], limit = 6): TrendPoint[] {
  const graded = gradedPapersByDate(papers).slice(-limit);
  return graded.map((p) => {
    const marks = totalMarks(p);
    const score = totalScore(p) ?? 0;
    return {
      paperId: p.id,
      label: p.title.length > 14 ? p.title.slice(0, 13) + "…" : p.title,
      pct: marks ? Math.round((score / marks) * 100) : 0,
    };
  });
}

export function computeHeatmap(papers: PaperRecord[], limit = 6): { cols: string[]; rows: HeatRow[] } {
  const graded = gradedPapersByDate(papers).slice(-limit);
  const cols = graded.map((p, i) => String(i + 1));
  const topics = computeTopicStats(papers).map((t) => t.name);

  const rows: HeatRow[] = topics.map((topic) => ({
    topic,
    cells: graded.map((paper) => {
      const qs = paper.questions.filter((q) => q.topic === topic);
      if (!qs.length) return { bucket: 0 as const, title: paper.title + " · no question on this topic" };
      const avail = qs.reduce((s, q) => s + q.marks, 0);
      const lost = qs.reduce((s, q) => s + (q.marks - (q.score ?? 0)), 0);
      const frac = avail ? lost / avail : 0;
      const bucket: 1 | 2 | 3 = frac > 0.4 ? 3 : frac > 0.15 ? 2 : 1;
      return { bucket, title: paper.title + " · " + Math.round(frac * 100) + "% lost" };
    }),
  }));

  return { cols, rows };
}

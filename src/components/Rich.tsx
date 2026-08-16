import type { CSSProperties } from "react";
import { renderRich } from "@/lib/richText";

/** Renders a question prompt / worked answer: markdown-lite + KaTeX. */
export function Rich({ text, style, className }: { text: string; style?: CSSProperties; className?: string }) {
  return (
    <div
      className={["rich", className].filter(Boolean).join(" ")}
      style={style}
      dangerouslySetInnerHTML={{ __html: renderRich(text) }}
    />
  );
}

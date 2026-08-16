// Tiny markdown-ish + LaTeX renderer for question prompts and worked
// answers. Ported from the `esc`/`math`/`inline`/`blocks`/`rich` methods on
// the mockup's Component class, swapping the mock's `window.katex` global
// for a real `katex` import so it also works offline in the Tauri build.
//
// Supports: `$...$` inline math, `$$...$$` display math, `**bold**`,
// `` `code` ``, `-`/`*` bullet lists, and blank-line-separated paragraphs.

import katex from "katex";

function esc(s: string): string {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function math(src: string, display: boolean): string {
  try {
    return katex.renderToString(src, { displayMode: display, throwOnError: false, output: "html" });
  } catch {
    return (
      '<span style="font-family:var(--font-heading);font-style:italic;color:var(--color-accent-800)">' +
      esc(src) +
      "</span>"
    );
  }
}

function inline(s: string): string {
  let t = esc(s);
  t = t.replace(/\$([^$]+)\$/g, (_m, x: string) => math(x, false));
  t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  t = t.replace(
    /`([^`]+)`/g,
    '<code style="font-family:ui-monospace,Menlo,monospace;font-size:.9em;background:var(--color-neutral-200);padding:1px 4px;border-radius:2px">$1</code>'
  );
  return t;
}

function blocks(text: string): string {
  const lines = String(text).split("\n");
  let out = "";
  let list: string[] = [];
  let para: string[] = [];
  const flushList = () => {
    if (list.length) {
      out += "<ul>" + list.map((l) => "<li>" + l + "</li>").join("") + "</ul>";
      list = [];
    }
  };
  const flushPara = () => {
    if (para.length) {
      out += "<p>" + para.join(" ") + "</p>";
      para = [];
    }
  };
  lines.forEach((raw) => {
    const l = raw.trim();
    if (!l) {
      flushList();
      flushPara();
      return;
    }
    if (/^[-*]\s+/.test(l)) {
      flushPara();
      list.push(inline(l.replace(/^[-*]\s+/, "")));
      return;
    }
    flushList();
    para.push(inline(l));
  });
  flushList();
  flushPara();
  return out;
}

/** Render a prompt/answer string (markdown-lite + `$…$`/`$$…$$` LaTeX) to HTML. */
export function renderRich(src: string | null | undefined): string {
  if (!src) return "";
  return String(src)
    .split(/\$\$([\s\S]+?)\$\$/g)
    .map((part, i) => (i % 2 ? math(part.trim(), true) : blocks(part)))
    .join("");
}

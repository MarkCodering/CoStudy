import type { Metadata } from "next";
import { Cormorant_Garamond, Lora } from "next/font/google";
import "katex/dist/katex.min.css";
import "@/styles/classical.css";
import "@/styles/app.css";
import "./globals.css";

// Self-hosted (via next/font) so the Tauri build works fully offline —
// the original design system loaded these from Google Fonts at runtime.
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-cormorant",
  display: "swap",
});

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-lora",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CoStudy — Exam Practice",
  description:
    "Marginalia: upload past papers, extract exam questions, work them in a notebook, and see where your marks are actually going.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${cormorant.variable} ${lora.variable}`}>
      <body>{children}</body>
    </html>
  );
}

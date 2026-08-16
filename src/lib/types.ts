export type Screen =
  | "library"
  | "upload"
  | "sources"
  | "review"
  | "notebook"
  | "timed"
  | "graded"
  | "weak"
  | "practice";

/** How the answer editor and its rendered preview are arranged in the notebook. */
export type PreviewMode = "Side by side" | "Below the answer" | "Tabbed";

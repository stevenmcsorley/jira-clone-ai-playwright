export const tidyDescription = (raw: string | null | undefined): string =>
  (raw ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+$/gm, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

export const splitParagraphs = (text: string): string[] =>
  text.split(/\n[^\S\n]*\n/).map((paragraph) => paragraph.trim()).filter(Boolean);

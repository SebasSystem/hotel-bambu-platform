/**
 * Length limits of the generated titles and meta descriptions (D6). Google sets no hard limit and
 * truncates to the device width (research §7); about 60 and 155 characters keep the brand and the
 * key facts visible on phones.
 */
export const TITLE_MAX = 60;
export const DESCRIPTION_MAX = 155;

const squash = (text: string) => text.replace(/\s+/g, ' ').trim();

/** Cut at the last word boundary that leaves room for an ellipsis. */
function cut(text: string, max: number): string {
  if (text.length <= max) return text;
  const head = text.slice(0, max - 1);
  const space = head.lastIndexOf(' ');
  const base = space > max / 2 ? head.slice(0, space) : head;
  return `${base.replace(/[\s,;:.–-]+$/, '')}…`;
}

/** The first candidate (most descriptive first) that fits, else the last one cut to fit. */
export function fitTitle(candidates: string[], max = TITLE_MAX): string {
  const clean = candidates.map(squash).filter(Boolean);
  return clean.find((title) => title.length <= max) ?? cut(clean.at(-1) ?? '', max);
}

/**
 * The lead sentence plus every optional part, in order, that still fits; parts that would overflow
 * are skipped (callers order them by value). An over-long lead is cut at a word boundary.
 */
export function fitDescription(
  lead: string,
  parts: (string | null | undefined)[],
  max = DESCRIPTION_MAX,
): string {
  let text = cut(squash(lead), max);
  for (const part of parts) {
    const clean = part ? squash(part) : '';
    if (!clean) continue;
    const next = `${text} ${clean}`;
    if (next.length <= max) text = next;
  }
  return text;
}

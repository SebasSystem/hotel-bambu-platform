/**
 * ESCNNA notice (Ley 1336 de 2009; owner review 2026-11-08): the footer prints a short version, the
 * guest-info page the full text. The short version is the first sentence of the notice the hotel
 * edits in /admin, so there is a single source text.
 */

/** Longest footer notice before it is cut at a word boundary. */
const FOOTER_MAX = 180;

/** A sentence ends at "." "!" or "?" followed by a capitalised word (so "p. m." or "art. 7" never split). */
const SENTENCE_END = /[.!?](?=\s+[¿¡"«(]?[A-ZÁÉÍÓÚÑÜ])/u;

export interface EscnnaFooterText {
  text: string;
  /** True when the footer omits part of the notice (link to the full text). */
  shortened: boolean;
}

export function escnnaFooterText(notice: string): EscnnaFooterText {
  const full = notice.trim().replace(/\s+/g, ' ');
  const end = SENTENCE_END.exec(full);
  let text = end ? full.slice(0, end.index + 1) : full;
  if (text.length > FOOTER_MAX) {
    const cut = text.slice(0, FOOTER_MAX);
    text = `${cut.slice(0, cut.lastIndexOf(' ') > 0 ? cut.lastIndexOf(' ') : FOOTER_MAX)}…`;
  }
  return { text, shortened: text !== full };
}

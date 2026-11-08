import { describe, expect, it } from 'vitest';
import { escnnaFooterText } from './escnna';

const notice =
  'Hotel Bambú Plaza rechaza la explotación sexual comercial de niñas, niños y adolescentes (ESCNNA) y cumple la Ley 679 de 2001 y la Ley 1336 de 2009. En Colombia, la explotación y el abuso sexual de menores de edad son delitos castigados con prisión. Si conoces un caso, denúncialo a la Línea 141 del ICBF o a la Línea 123 de la Policía Nacional.';

describe('escnnaFooterText (short footer notice, full text on the guest-info page)', () => {
  it('keeps the first sentence and flags that the full notice lives elsewhere', () => {
    expect(escnnaFooterText(notice)).toEqual({
      text: 'Hotel Bambú Plaza rechaza la explotación sexual comercial de niñas, niños y adolescentes (ESCNNA) y cumple la Ley 679 de 2001 y la Ley 1336 de 2009.',
      shortened: true,
    });
  });

  it('prints a short single-sentence notice as is', () => {
    expect(escnnaFooterText('  Rechazamos la ESCNNA.  ')).toEqual({
      text: 'Rechazamos la ESCNNA.',
      shortened: false,
    });
  });

  it('does not split on abbreviations such as "p. m." or "art."', () => {
    const text = 'Atendemos denuncias hasta las 10 p. m. según el art. 7 de la ley. Línea 141.';
    expect(escnnaFooterText(text).text).toBe(
      'Atendemos denuncias hasta las 10 p. m. según el art. 7 de la ley.',
    );
  });

  it('cuts an overlong first sentence at a word boundary', () => {
    const long = `${'palabra '.repeat(40).trim()}.`;
    const result = escnnaFooterText(long);
    expect(result.shortened).toBe(true);
    expect(result.text.length).toBeLessThanOrEqual(181);
    expect(result.text.endsWith('…')).toBe(true);
  });
});

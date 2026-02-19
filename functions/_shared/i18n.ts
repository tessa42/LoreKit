export type Lang = 'en-US' | 'ko-KR';

/**
 * Resolves the request language.
 * Priority: X-LoreKit-Lang header → body.lang → default 'en-US'
 */
export function getLang(request: Request, body?: Record<string, unknown>): Lang {
  const header = request.headers.get('X-LoreKit-Lang');
  if (header === 'ko-KR' || header === 'en-US') return header;

  const bodyLang = body?.['lang'];
  if (bodyLang === 'ko-KR') return 'ko-KR';

  return 'en-US';
}

export function isKorean(lang: Lang): boolean {
  return lang === 'ko-KR';
}

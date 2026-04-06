/**
 * AI 응답에서 JSON 문자열을 추출합니다.
 * ```json ... ``` 또는 ``` ... ``` 마크다운 블록이 포함된 경우 제거합니다.
 */
export function extractJson(text: string): string {
  let result = text.trim();

  // 앞쪽 ```json 또는 ``` 제거
  if (result.startsWith('```json')) {
    result = result.slice('```json'.length);
  } else if (result.startsWith('```')) {
    result = result.slice('```'.length);
  }

  // 뒤쪽 ``` 제거
  if (result.endsWith('```')) {
    result = result.slice(0, -'```'.length);
  }

  return result.trim();
}

import type { NormalizedLorcraftInput, FormatSection, LorcraftPayload } from '@/types/lorecraft';

// 마크다운 h2(##) 기준으로 섹션 분리
function parseIntoSections(text: string): FormatSection[] {
  const lines = text.split('\n');
  const sections: FormatSection[] = [];
  let currentTitle = '';
  let currentLines: string[] = [];

  for (const line of lines) {
    const h2Match = line.match(/^##\s+(.+)/);
    if (h2Match) {
      if (currentTitle) {
        sections.push({ title: currentTitle, content: currentLines.join('\n').trim() });
      }
      currentTitle = h2Match[1].trim();
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }

  if (currentTitle) {
    sections.push({ title: currentTitle, content: currentLines.join('\n').trim() });
  }

  // h2가 없으면 전체를 하나의 섹션으로
  if (sections.length === 0 && text.trim()) {
    sections.push({ title: '설정집', content: text.trim() });
  }

  return sections;
}

export function formatLorecraft(
  generatedText: string,
  input: NormalizedLorcraftInput,
): LorcraftPayload {
  return {
    background: input.background,
    genre: input.genre,
    areas: input.areas,
    sections: parseIntoSections(generatedText),
    generated_at: new Date().toISOString(),
  };
}

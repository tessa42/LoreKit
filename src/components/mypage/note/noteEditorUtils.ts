import type { NoteBlock } from '@/types/note';
import type { LoreCraftPayload } from '@/types/mypage';

export interface ArchiveItem {
  id: string;
  title: string;
  payload: LoreCraftPayload;
}

export function blockToSectionTitle(block: NoteBlock): string {
  const c = block.content;
  switch (block.type) {
    case 'text': return '텍스트';
    case 'world_overview': return (c as { title: string }).title || '세계관 개요';
    case 'setting': return (c as { title: string }).title || '설정 항목';
    case 'character': return (c as { name: string }).name || '인물 카드';
    case 'timeline': return '타임라인';
    case 'plot': return '플롯';
  }
}

export function blockToSectionContent(block: NoteBlock): string {
  const c = block.content;
  switch (block.type) {
    case 'text': return (c as { body: string }).body;
    case 'world_overview': return (c as { body: string }).body;
    case 'setting': return (c as { body: string }).body;
    case 'character': {
      const ch = c as { role: string; description: string; traits: string[] };
      const parts: string[] = [];
      if (ch.role) parts.push(`역할: ${ch.role}`);
      if (ch.description) parts.push(ch.description);
      if (ch.traits.length) parts.push(`특성: ${ch.traits.join(', ')}`);
      return parts.join('\n\n');
    }
    case 'timeline': {
      const events = (c as { events: { date: string; description: string }[] }).events;
      return events.map((e) => `${e.date}: ${e.description}`).join('\n');
    }
    case 'plot': {
      const cards = (c as { cards: { content: string }[] }).cards;
      return cards.map((card) => card.content).join('\n\n');
    }
  }
}

import type {
  NoteBlock,
  NoteBlockContent,
  TextContent,
  WorldOverviewContent,
  SettingContent,
  CharacterContent,
  TimelineContent,
  PlotContent,
} from '@/types/note';

export type BlockLike = { type: NoteBlock['type']; content: NoteBlock['content'] };

// 노트 블록 → 섹션 title/content 변환
export function blockToSection(block: BlockLike): { title: string; content: string } {
  const c = block.content as NoteBlockContent;
  switch (block.type) {
    case 'text':
      return { title: '텍스트', content: (c as TextContent).body };
    case 'world_overview': {
      const wc = c as WorldOverviewContent;
      return { title: wc.title || '세계관 개요', content: wc.body };
    }
    case 'setting': {
      const sc = c as SettingContent;
      return { title: sc.title || '설정 항목', content: sc.body };
    }
    case 'character': {
      const ch = c as CharacterContent;
      const parts: string[] = [];
      if (ch.role) parts.push(`역할: ${ch.role}`);
      if (ch.description) parts.push(ch.description);
      if (ch.traits.length) parts.push(`특성: ${ch.traits.join(', ')}`);
      return { title: ch.name || '인물 카드', content: parts.join('\n\n') };
    }
    case 'timeline': {
      const tl = c as TimelineContent;
      return {
        title: '타임라인',
        content: tl.events.map((e) => `${e.date}: ${e.description}`).join('\n'),
      };
    }
    case 'plot': {
      const pl = c as PlotContent;
      return {
        title: '플롯',
        content: pl.cards.map((card) => card.content).join('\n\n'),
      };
    }
  }
}

// 섹션 미리보기 텍스트
export function blockPreview(block: BlockLike): string {
  const { content } = blockToSection(block);
  return content.slice(0, 60) + (content.length > 60 ? '…' : '');
}

export type NoteBlockType =
  | 'text'
  | 'world_overview'
  | 'setting'
  | 'character'
  | 'timeline'
  | 'plot';

// 블록별 content 구조
export interface TextContent {
  body: string;
}

export interface WorldOverviewContent {
  title: string;
  body: string;
}

export interface SettingContent {
  title: string;
  body: string;
}

export interface CharacterContent {
  name: string;
  role: string;
  description: string;
  traits: string[];
}

export interface TimelineEvent {
  date: string;
  description: string;
}

export interface TimelineContent {
  events: TimelineEvent[];
}

export interface PlotCard {
  id: string;
  content: string;
}

export interface PlotContent {
  cards: PlotCard[];
}

export type NoteBlockContent =
  | TextContent
  | WorldOverviewContent
  | SettingContent
  | CharacterContent
  | TimelineContent
  | PlotContent;

export interface Note {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface NoteWithBlockCount extends Note {
  block_count: number;
}

export interface NoteBlock {
  id: string;
  note_id: string;
  user_id: string;
  type: NoteBlockType;
  content: NoteBlockContent;
  order_index: number;
  source_archive_id: string | null;
  created_at: string;
  updated_at: string;
}

export const NOTE_BLOCK_TYPE_LABELS: Record<NoteBlockType, string> = {
  text: '텍스트',
  world_overview: '세계관 개요',
  setting: '설정 항목',
  character: '인물 카드',
  timeline: '타임라인',
  plot: '플롯 보드',
};

export function defaultContent(type: NoteBlockType): NoteBlockContent {
  switch (type) {
    case 'text':
      return { body: '' } satisfies TextContent;
    case 'world_overview':
      return { title: '', body: '' } satisfies WorldOverviewContent;
    case 'setting':
      return { title: '', body: '' } satisfies SettingContent;
    case 'character':
      return { name: '', role: '', description: '', traits: [] } satisfies CharacterContent;
    case 'timeline':
      return { events: [] } satisfies TimelineContent;
    case 'plot':
      return { cards: [] } satisfies PlotContent;
  }
}

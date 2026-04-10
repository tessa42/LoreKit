'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import dynamic from 'next/dynamic';
import type { NoteBlock, NoteBlockContent } from '@/types/note';
import { NOTE_BLOCK_TYPE_LABELS } from '@/types/note';
import type { TextContent, WorldOverviewContent, SettingContent, CharacterContent, TimelineContent, PlotContent } from '@/types/note';

const TextBlock = dynamic(() => import('./blocks/TextBlock'), { ssr: false });
const WorldOverviewBlock = dynamic(() => import('./blocks/WorldOverviewBlock'), { ssr: false });
const SettingBlock = dynamic(() => import('./blocks/SettingBlock'), { ssr: false });
const CharacterBlock = dynamic(() => import('./blocks/CharacterBlock'), { ssr: false });
const TimelineBlock = dynamic(() => import('./blocks/TimelineBlock'), { ssr: false });
const PlotBlock = dynamic(() => import('./blocks/PlotBlock'), { ssr: false });

const TYPE_COLORS: Record<string, string> = {
  text: 'bg-[var(--surface-2)] text-[var(--muted)]',
  world_overview: 'bg-blue-500/10 text-blue-400',
  setting: 'bg-purple-500/10 text-purple-400',
  character: 'bg-green-500/10 text-green-400',
  timeline: 'bg-orange-500/10 text-orange-400',
  plot: 'bg-pink-500/10 text-pink-400',
};

interface Props {
  block: NoteBlock;
  noteId: string;
  onDelete: (blockId: string) => void;
  onSave: (blockId: string, content: NoteBlockContent) => Promise<void>;
}

export default function NoteBlockEditor({ block, onDelete, onSave }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  function renderBlockContent() {
    switch (block.type) {
      case 'text':
        return (
          <TextBlock
            content={block.content as TextContent}
            onSave={(c) => onSave(block.id, c)}
          />
        );
      case 'world_overview':
        return (
          <WorldOverviewBlock
            content={block.content as WorldOverviewContent}
            onSave={(c) => onSave(block.id, c)}
          />
        );
      case 'setting':
        return (
          <SettingBlock
            content={block.content as SettingContent}
            onSave={(c) => onSave(block.id, c)}
          />
        );
      case 'character':
        return (
          <CharacterBlock
            content={block.content as CharacterContent}
            onSave={(c) => onSave(block.id, c)}
          />
        );
      case 'timeline':
        return (
          <TimelineBlock
            content={block.content as TimelineContent}
            onSave={(c) => onSave(block.id, c)}
          />
        );
      case 'plot':
        return (
          <PlotBlock
            content={block.content as PlotContent}
            onSave={(c) => onSave(block.id, c)}
          />
        );
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* 드래그 핸들 */}
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="cursor-grab touch-none text-[var(--muted)] hover:text-[var(--foreground)] active:cursor-grabbing"
            aria-label="드래그하여 순서 변경"
          >
            <svg width="12" height="16" viewBox="0 0 12 16" fill="none">
              <circle cx="4" cy="3" r="1.5" fill="currentColor"/>
              <circle cx="8" cy="3" r="1.5" fill="currentColor"/>
              <circle cx="4" cy="8" r="1.5" fill="currentColor"/>
              <circle cx="8" cy="8" r="1.5" fill="currentColor"/>
              <circle cx="4" cy="13" r="1.5" fill="currentColor"/>
              <circle cx="8" cy="13" r="1.5" fill="currentColor"/>
            </svg>
          </button>
          <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_COLORS[block.type] ?? 'bg-[var(--surface-2)] text-[var(--muted)]'}`}
          >
            {NOTE_BLOCK_TYPE_LABELS[block.type]}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onDelete(block.id)}
          className="rounded-[var(--radius-sm)] px-2 py-1 text-xs text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-red-400"
        >
          삭제
        </button>
      </div>
      {renderBlockContent()}
    </div>
  );
}

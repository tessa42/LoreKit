'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const NoteBlockList = dynamic(() => import('./NoteBlockList'), { ssr: false });
import Button from '@/components/ui/Button';
import type { Note, NoteBlock, NoteBlockType, NoteBlockContent } from '@/types/note';
import { NOTE_BLOCK_TYPE_LABELS } from '@/types/note';
import type { LoreCraftPayload } from '@/types/mypage';
import type { Lorebook } from '@/types/lorebook';

const BLOCK_TYPES: NoteBlockType[] = [
  'text', 'world_overview', 'setting', 'character', 'timeline', 'plot',
];

interface ArchiveItem {
  id: string;
  title: string;
  payload: LoreCraftPayload;
}

interface Props {
  note: Note;
  initialBlocks: NoteBlock[];
  lorearchiveItems: ArchiveItem[];
}

export default function NoteEditorClient({ note, initialBlocks, lorearchiveItems }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(note.title);
  const [blocks, setBlocks] = useState<NoteBlock[]>(initialBlocks);
  const [addingBlock, setAddingBlock] = useState(false);
  const [showBlockMenu, setShowBlockMenu] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [lorebooks, setLorebooks] = useState<Lorebook[]>([]);
  const [loadingLorebooks, setLoadingLorebooks] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  async function handleTitleBlur() {
    const trimmed = title.trim() || '제목 없음';
    if (trimmed === note.title) return;
    await fetch(`/api/notes/${note.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: trimmed }),
    });
  }

  async function handleAddBlock(type: NoteBlockType) {
    setShowBlockMenu(false);
    setAddingBlock(true);
    try {
      const res = await fetch(`/api/notes/${note.id}/blocks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      const json = await res.json();
      if (json.ok) {
        setBlocks((prev) => [...prev, json.block as NoteBlock]);
      }
    } finally {
      setAddingBlock(false);
    }
  }

  async function handleDeleteBlock(blockId: string) {
    if (!confirm('블록을 삭제할까요?')) return;
    const res = await fetch(`/api/notes/${note.id}/blocks/${blockId}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.ok) {
      setBlocks((prev) => prev.filter((b) => b.id !== blockId));
    }
  }

  async function handleSaveBlock(blockId: string, content: NoteBlockContent) {
    await fetch(`/api/notes/${note.id}/blocks/${blockId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
  }

  async function handleOpenPublishModal() {
    setLoadingLorebooks(true);
    setShowPublishModal(true);
    try {
      const res = await fetch('/api/lorebooks');
      const json = await res.json();
      if (json.ok) setLorebooks(json.lorebooks as Lorebook[]);
    } finally {
      setLoadingLorebooks(false);
    }
  }

  async function handlePublishToLorebook(lorebookId: string) {
    setPublishingId(lorebookId);
    try {
      for (const block of blocks) {
        await fetch(`/api/lorebooks/${lorebookId}/sections`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: blockToSectionTitle(block),
            content: blockToSectionContent(block),
            note_block_id: block.id,
          }),
        });
      }
      setShowPublishModal(false);
      router.push(`/mypage/lorebook/${lorebookId}`);
    } finally {
      setPublishingId(null);
    }
  }

  function blockToSectionTitle(block: NoteBlock): string {
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

  function blockToSectionContent(block: NoteBlock): string {
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

  async function handleImportArchive(item: ArchiveItem) {
    setImportingId(item.id);
    try {
      // sections → world_overview 블록으로 변환
      const created: NoteBlock[] = [];
      for (const section of item.payload.sections) {
        const res = await fetch(`/api/notes/${note.id}/blocks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'world_overview',
            content: { title: section.title, body: section.content },
            source_archive_id: item.id,
          }),
        });
        const json = await res.json();
        if (json.ok) created.push(json.block as NoteBlock);
      }
      setBlocks((prev) => [...prev, ...created]);
      setShowArchiveModal(false);
    } finally {
      setImportingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      {/* 헤더 */}
      <div className="mb-6 flex items-start justify-between gap-3">
        <div className="flex-1">
          <button
            type="button"
            onClick={() => router.push('/mypage/note')}
            className="mb-2 text-xs text-[var(--muted)] hover:text-[var(--foreground)]"
          >
            ← 노트 목록
          </button>
          <input
            ref={titleRef}
            type="text"
            className="w-full bg-transparent text-2xl font-bold text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none"
            placeholder="제목 없음"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
          />
        </div>
      </div>

      {/* 블록 목록 */}
      <NoteBlockList
        noteId={note.id}
        blocks={blocks}
        onBlocksChange={setBlocks}
        onDeleteBlock={handleDeleteBlock}
        onSaveBlock={handleSaveBlock}
      />

      {/* 액션 바 */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {/* 블록 추가 드롭다운 */}
        <div className="relative">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowBlockMenu((v) => !v)}
            loading={addingBlock}
          >
            + 블록 추가
          </Button>
          {showBlockMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowBlockMenu(false)}
              />
              <div className="absolute left-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] shadow-lg">
                {BLOCK_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleAddBlock(type)}
                    className="w-full px-4 py-2.5 text-left text-sm text-[var(--foreground)] hover:bg-[var(--surface-2)]"
                  >
                    {NOTE_BLOCK_TYPE_LABELS[type]}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 아카이브에서 불러오기 */}
        {lorearchiveItems.length > 0 && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowArchiveModal(true)}
          >
            아카이브에서 불러오기
          </Button>
        )}

        {/* 로어북으로 발행 */}
        <Button
          size="sm"
          variant="ghost"
          disabled={blocks.length === 0}
          onClick={handleOpenPublishModal}
          className="ml-auto"
        >
          로어북으로 발행
        </Button>
      </div>

      {/* 로어북 발행 모달 */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--background)] p-6">
            <h2 className="mb-1 text-base font-semibold text-[var(--foreground)]">
              로어북으로 발행
            </h2>
            <p className="mb-4 text-xs text-[var(--muted)]">
              현재 노트의 블록 {blocks.length}개가 선택한 로어북의 섹션으로 추가됩니다.
            </p>
            {loadingLorebooks ? (
              <p className="py-8 text-center text-sm text-[var(--muted)]">불러오는 중...</p>
            ) : lorebooks.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-[var(--muted)]">로어북이 없어요.</p>
                <button
                  type="button"
                  onClick={() => {
                    setShowPublishModal(false);
                    router.push('/mypage/lorebook');
                  }}
                  className="mt-2 text-xs text-[var(--accent)] hover:underline"
                >
                  새 로어북 만들기 →
                </button>
              </div>
            ) : (
              <ul className="max-h-64 space-y-2 overflow-y-auto">
                {lorebooks.map((lb) => (
                  <li key={lb.id}>
                    <button
                      type="button"
                      disabled={publishingId === lb.id}
                      onClick={() => handlePublishToLorebook(lb.id)}
                      className="w-full rounded-[var(--radius-md)] border border-[var(--border)] px-4 py-3 text-left transition-colors hover:border-[var(--accent)] hover:bg-[var(--surface-2)] disabled:opacity-50"
                    >
                      <p className="text-sm font-medium text-[var(--foreground)]">{lb.title}</p>
                      <p className="mt-0.5 text-xs text-[var(--muted)]">
                        {lb.is_public ? '공개' : '비공개'}
                        {publishingId === lb.id && ' · 발행 중...'}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button
              type="button"
              onClick={() => setShowPublishModal(false)}
              className="mt-4 w-full rounded-[var(--radius-md)] border border-[var(--border)] py-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* 아카이브 선택 모달 */}
      {showArchiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--background)] p-6">
            <h2 className="mb-4 text-base font-semibold text-[var(--foreground)]">
              아카이브에서 불러오기
            </h2>
            <p className="mb-4 text-xs text-[var(--muted)]">
              선택한 Lorecraft 결과의 섹션들이 세계관 개요 블록으로 추가됩니다.
            </p>
            <ul className="max-h-64 space-y-2 overflow-y-auto">
              {lorearchiveItems.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    disabled={importingId === item.id}
                    onClick={() => handleImportArchive(item)}
                    className="w-full rounded-[var(--radius-md)] border border-[var(--border)] px-4 py-3 text-left transition-colors hover:border-[var(--accent)] hover:bg-[var(--surface-2)] disabled:opacity-50"
                  >
                    <p className="text-sm font-medium text-[var(--foreground)]">{item.title}</p>
                    <p className="mt-0.5 text-xs text-[var(--muted)]">
                      섹션 {item.payload.sections.length}개
                    </p>
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setShowArchiveModal(false)}
              className="mt-4 w-full rounded-[var(--radius-md)] border border-[var(--border)] py-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

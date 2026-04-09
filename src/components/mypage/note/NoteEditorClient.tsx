'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import NoteBlockList from './NoteBlockList';
import Button from '@/components/ui/Button';
import type { Note, NoteBlock, NoteBlockType, NoteBlockContent } from '@/types/note';
import { NOTE_BLOCK_TYPE_LABELS } from '@/types/note';
import type { LoreCraftPayload } from '@/types/mypage';

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

        {/* 로어북으로 발행 (추후 구현) */}
        <Button size="sm" variant="ghost" disabled className="ml-auto">
          로어북으로 발행
        </Button>
      </div>

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

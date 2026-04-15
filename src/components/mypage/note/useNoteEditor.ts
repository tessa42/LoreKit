'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { blockToSectionTitle, blockToSectionContent } from './noteEditorUtils';
import type { ArchiveItem } from './noteEditorUtils';
import type { Note, NoteBlock, NoteBlockType, NoteBlockContent } from '@/types/note';
import type { Lorebook } from '@/types/lorebook';

export function useNoteEditor(note: Note, initialBlocks: NoteBlock[], linkedLorebookId: string | null = null) {
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
  const [directPublishing, setDirectPublishing] = useState(false);
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

  // 연결된 로어북 찾기: linkedLorebookId → source_note_id 조회 → 없으면 자동 생성
  async function handleOpenPublishModal() {
    setDirectPublishing(true);
    try {
      // 1. 이미 알고 있는 연결 로어북
      let lorebookId = linkedLorebookId;

      if (!lorebookId) {
        // 2. source_note_id로 연결된 로어북 조회
        const searchRes = await fetch(`/api/lorebooks?source_note_id=${note.id}`);
        const searchJson = await searchRes.json();
        if (searchJson.ok && searchJson.lorebooks?.length > 0) {
          lorebookId = searchJson.lorebooks[0].id as string;
        }
      }

      if (!lorebookId) {
        // 3. 연결된 로어북 없으면 자동 생성 (노트 제목 사용)
        const createRes = await fetch('/api/lorebooks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: title.trim() || '제목 없음' }),
        });
        const createJson = await createRes.json();
        if (!createJson.ok) return;
        lorebookId = createJson.lorebook.id as string;
      }

      // 4. 발행
      await fetch(`/api/lorebooks/${lorebookId}/publish`, { method: 'POST' });
      router.push(`/mypage/lorebook/${lorebookId}`);
    } finally {
      setDirectPublishing(false);
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

  async function handleImportArchive(item: ArchiveItem) {
    setImportingId(item.id);
    try {
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

  return {
    title,
    setTitle,
    titleRef,
    blocks,
    setBlocks,
    addingBlock,
    showBlockMenu,
    setShowBlockMenu,
    showArchiveModal,
    setShowArchiveModal,
    importingId,
    showPublishModal,
    setShowPublishModal,
    lorebooks,
    loadingLorebooks,
    publishingId,
    directPublishing,
    linkedLorebookId,
    handleTitleBlur,
    handleAddBlock,
    handleDeleteBlock,
    handleSaveBlock,
    handleOpenPublishModal,
    handlePublishToLorebook,
    handleImportArchive,
    navigateBack: () => router.push('/mypage/note'),
    navigateToNewLorebook: () => {
      setShowPublishModal(false);
      router.push('/mypage/lorebook');
    },
  };
}

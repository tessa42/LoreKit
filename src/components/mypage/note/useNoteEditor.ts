'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { blockToSectionTitle, blockToSectionContent } from './noteEditorUtils';
import type { ArchiveItem } from './noteEditorUtils';
import type { Note, NoteBlock, NoteBlockType, NoteBlockContent } from '@/types/note';
import type { Lorebook } from '@/types/lorebook';

export function useNoteEditor(note: Note, initialBlocks: NoteBlock[]) {
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

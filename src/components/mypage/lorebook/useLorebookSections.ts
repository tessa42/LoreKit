'use client';

import { useState } from 'react';
import { useSensor, useSensors, PointerSensor, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import type { LorebookSection } from '@/types/lorebook';
import type { NoteBlockForImport } from './ImportModal';
import { blockToSection } from './lorebookSectionUtils';

export function useLorebookSections(lorebookId: string, initialSections: LorebookSection[]) {
  const [sections, setSections] = useState<LorebookSection[]>(initialSections);
  const [addingSection, setAddingSection] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);
    const reordered = arrayMove(sections, oldIndex, newIndex).map((s, i) => ({
      ...s,
      order_index: i,
    }));

    setSections(reordered);

    const oldIndexMap = new Map(sections.map((s) => [s.id, s.order_index]));
    await Promise.all(
      reordered
        .filter((s) => s.order_index !== oldIndexMap.get(s.id))
        .map((s) =>
          fetch(`/api/lorebooks/${lorebookId}/sections/${s.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_index: s.order_index }),
          }),
        ),
    );
  }

  async function handleAddSection() {
    setAddingSection(true);
    try {
      const res = await fetch(`/api/lorebooks/${lorebookId}/sections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: '새 섹션', content: '' }),
      });
      const json = await res.json();
      if (json.ok) {
        setSections((prev) => [...prev, json.section as LorebookSection]);
      }
    } finally {
      setAddingSection(false);
    }
  }

  async function handleImportBlock(block: NoteBlockForImport) {
    setImportingId(block.id);
    try {
      const { title, content } = blockToSection(block);
      const res = await fetch(`/api/lorebooks/${lorebookId}/sections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, note_block_id: block.id }),
      });
      const json = await res.json();
      if (json.ok) {
        setSections((prev) => [...prev, json.section as LorebookSection]);
        setShowImportModal(false);
      }
    } finally {
      setImportingId(null);
    }
  }

  async function handleDeleteSection(sectionId: string) {
    if (!confirm('섹션을 삭제할까요?')) return;
    setDeletingId(sectionId);
    try {
      const res = await fetch(`/api/lorebooks/${lorebookId}/sections/${sectionId}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.ok) {
        setSections((prev) => prev.filter((s) => s.id !== sectionId));
      }
    } finally {
      setDeletingId(null);
    }
  }

  function handleUpdateSection(id: string, updates: Partial<LorebookSection>) {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  }

  return {
    sections,
    addingSection,
    deletingId,
    showImportModal,
    importingId,
    sensors,
    setShowImportModal,
    handleDragEnd,
    handleAddSection,
    handleImportBlock,
    handleDeleteSection,
    handleUpdateSection,
  };
}

'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { PlotContent, PlotCard } from '@/types/note';

interface CardProps {
  card: PlotCard;
  onChange: (id: string, value: string) => void;
  onBlur: () => void;
  onRemove: (id: string) => void;
}

function SortablePlotCard({ card, onChange, onBlur, onRemove }: CardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-start gap-2">
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="mt-2 shrink-0 cursor-grab touch-none rounded p-1 text-[var(--muted)] hover:text-[var(--foreground)] active:cursor-grabbing"
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
      <textarea
        className="flex-1 resize-none rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        rows={3}
        placeholder="플롯 카드 내용..."
        value={card.content}
        onChange={(e) => onChange(card.id, e.target.value)}
        onBlur={onBlur}
      />
      <button
        type="button"
        onClick={() => onRemove(card.id)}
        className="mt-2 shrink-0 rounded p-1 text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-red-400"
        aria-label="카드 삭제"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 2L10 10M10 2L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  );
}

interface Props {
  content: PlotContent;
  onSave: (content: PlotContent) => void;
}

export default function PlotBlock({ content, onSave }: Props) {
  const [cards, setCards] = useState<PlotCard[]>(content.cards);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = cards.findIndex((c) => c.id === active.id);
    const newIndex = cards.findIndex((c) => c.id === over.id);
    const next = arrayMove(cards, oldIndex, newIndex);
    setCards(next);
    onSave({ cards: next });
  }

  function handleChange(id: string, value: string) {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, content: value } : c)));
  }

  function handleBlur() {
    onSave({ cards });
  }

  function addCard() {
    const next = [...cards, { id: crypto.randomUUID(), content: '' }];
    setCards(next);
    onSave({ cards: next });
  }

  function removeCard(id: string) {
    const next = cards.filter((c) => c.id !== id);
    setCards(next);
    onSave({ cards: next });
  }

  return (
    <div className="space-y-2">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <SortablePlotCard
              key={card.id}
              card={card}
              onChange={handleChange}
              onBlur={handleBlur}
              onRemove={removeCard}
            />
          ))}
        </SortableContext>
      </DndContext>
      <button
        type="button"
        onClick={addCard}
        className="w-full rounded-[var(--radius-md)] border border-dashed border-[var(--border)] py-2 text-xs text-[var(--muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
      >
        + 카드 추가
      </button>
    </div>
  );
}

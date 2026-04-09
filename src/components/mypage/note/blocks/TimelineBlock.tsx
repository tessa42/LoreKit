'use client';

import { useState } from 'react';
import type { TimelineContent, TimelineEvent } from '@/types/note';

interface Props {
  content: TimelineContent;
  onSave: (content: TimelineContent) => void;
}

export default function TimelineBlock({ content, onSave }: Props) {
  const [events, setEvents] = useState<TimelineEvent[]>(content.events);

  function updateEvent(index: number, field: keyof TimelineEvent, value: string) {
    const next = events.map((e, i) => (i === index ? { ...e, [field]: value } : e));
    setEvents(next);
  }

  function saveEvents(next: TimelineEvent[]) {
    onSave({ events: next });
  }

  function addEvent() {
    const next = [...events, { date: '', description: '' }];
    setEvents(next);
    saveEvents(next);
  }

  function removeEvent(index: number) {
    const next = events.filter((_, i) => i !== index);
    setEvents(next);
    saveEvents(next);
  }

  return (
    <div className="space-y-2">
      {events.map((event, index) => (
        <div key={index} className="flex items-start gap-2">
          <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[var(--accent)] bg-[var(--accent)]/10 text-[10px] font-bold text-[var(--accent)]">
            {index + 1}
          </div>
          <div className="flex-1 space-y-1.5">
            <input
              type="text"
              className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              placeholder="날짜 또는 시기 (예: 1화, 3년 전)"
              value={event.date}
              onChange={(e) => updateEvent(index, 'date', e.target.value)}
              onBlur={() => saveEvents(events)}
            />
            <input
              type="text"
              className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              placeholder="사건 설명"
              value={event.description}
              onChange={(e) => updateEvent(index, 'description', e.target.value)}
              onBlur={() => saveEvents(events)}
            />
          </div>
          <button
            type="button"
            onClick={() => removeEvent(index)}
            className="mt-1 shrink-0 rounded p-1 text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-red-400"
            aria-label="이벤트 삭제"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 2L10 10M10 2L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addEvent}
        className="w-full rounded-[var(--radius-md)] border border-dashed border-[var(--border)] py-2 text-xs text-[var(--muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
      >
        + 이벤트 추가
      </button>
    </div>
  );
}

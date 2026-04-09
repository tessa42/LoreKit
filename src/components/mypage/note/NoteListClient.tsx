'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import type { NoteWithBlockCount } from '@/types/note';

interface Props {
  initialNotes: NoteWithBlockCount[];
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

export default function NoteListClient({ initialNotes }: Props) {
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleCreate() {
    setCreating(true);
    try {
      const res = await fetch('/api/notes', { method: 'POST', body: JSON.stringify({ title: '제목 없음' }), headers: { 'Content-Type': 'application/json' } });
      const json = await res.json();
      if (json.ok) {
        router.push(`/mypage/note/${json.note.id}`);
      }
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('노트를 삭제할까요?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/notes/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.ok) {
        setNotes((prev) => prev.filter((n) => n.id !== id));
      }
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-[var(--foreground)]">작가 노트</h1>
        <Button size="sm" onClick={handleCreate} loading={creating}>
          + 새 노트
        </Button>
      </div>

      {notes.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border)] px-6 py-16 text-center">
          <p className="text-sm text-[var(--muted)]">아직 작성한 노트가 없어요.</p>
          <p className="mt-1 text-sm text-[var(--muted)]">새 노트를 만들어 세계관을 기록해 보세요.</p>
          <Button size="sm" className="mt-4" onClick={handleCreate} loading={creating}>
            + 새 노트 만들기
          </Button>
        </div>
      ) : (
        <ul className="space-y-3">
          {notes.map((note) => (
            <li key={note.id}>
              <div
                className="group flex cursor-pointer items-center gap-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] px-4 py-4 transition-colors hover:border-[var(--accent)] hover:bg-[var(--surface-2)]"
                onClick={() => router.push(`/mypage/note/${note.id}`)}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-[var(--foreground)]">{note.title}</p>
                  <p className="mt-0.5 text-xs text-[var(--muted)]">
                    {formatDate(note.updated_at)} · 블록 {note.block_count}개
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleDelete(note.id); }}
                  disabled={deletingId === note.id}
                  className="shrink-0 rounded-[var(--radius-sm)] px-2 py-1 text-xs text-[var(--muted)] opacity-0 transition-opacity hover:bg-[var(--surface-3)] hover:text-red-400 group-hover:opacity-100 disabled:opacity-40"
                >
                  {deletingId === note.id ? '삭제 중...' : '삭제'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

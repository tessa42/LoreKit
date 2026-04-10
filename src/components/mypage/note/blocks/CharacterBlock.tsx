'use client';

import { useState, KeyboardEvent } from 'react';
import LorcraftMarkdown from '@/components/lorecraft/LorcraftMarkdown';
import type { CharacterContent } from '@/types/note';

interface Props {
  content: CharacterContent;
  onSave: (content: CharacterContent) => void;
}

export default function CharacterBlock({ content, onSave }: Props) {
  const [name, setName] = useState(content.name);
  const [role, setRole] = useState(content.role);
  const [description, setDescription] = useState(content.description);
  const [traits, setTraits] = useState<string[]>(content.traits);
  const [traitInput, setTraitInput] = useState('');
  const [isDescEditing, setIsDescEditing] = useState(false);

  const save = () => onSave({ name, role, description, traits });

  function handleDescBlur() {
    onSave({ name, role, description, traits });
    setIsDescEditing(false);
  }

  function addTrait() {
    const trimmed = traitInput.trim();
    if (!trimmed || traits.includes(trimmed)) return;
    const next = [...traits, trimmed];
    setTraits(next);
    setTraitInput('');
    onSave({ name, role, description, traits: next });
  }

  function removeTrait(trait: string) {
    const next = traits.filter((t) => t !== trait);
    setTraits(next);
    onSave({ name, role, description, traits: next });
  }

  function handleTraitKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); addTrait(); }
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <input
          type="text"
          className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          placeholder="이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={save}
        />
        <input
          type="text"
          className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          placeholder="역할 (예: 주인공)"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          onBlur={save}
        />
      </div>
      {isDescEditing ? (
        <textarea
          autoFocus
          className="w-full resize-none rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          rows={3}
          placeholder="인물 설명..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={handleDescBlur}
        />
      ) : (
        <div
          onClick={() => setIsDescEditing(true)}
          className="min-h-[56px] cursor-text rounded-[var(--radius-md)] border border-transparent px-3 py-2.5 hover:border-[var(--border)] hover:bg-[var(--surface)]"
        >
          {description ? (
            <LorcraftMarkdown text={description} />
          ) : (
            <p className="text-sm text-[var(--muted)]">인물 설명...</p>
          )}
        </div>
      )}
      {/* 특징 태그 */}
      <div>
        <div className="mb-1.5 flex flex-wrap gap-1.5">
          {traits.map((trait) => (
            <span
              key={trait}
              className="inline-flex items-center gap-1 rounded-full bg-[var(--accent)]/10 px-2.5 py-0.5 text-xs text-[var(--accent)]"
            >
              {trait}
              <button
                type="button"
                onClick={() => removeTrait(trait)}
                className="leading-none text-[var(--accent)] opacity-60 hover:opacity-100"
                aria-label={`${trait} 삭제`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            placeholder="특징 추가 (Enter)"
            value={traitInput}
            onChange={(e) => setTraitInput(e.target.value)}
            onKeyDown={handleTraitKeyDown}
          />
          <button
            type="button"
            onClick={addTrait}
            className="rounded-[var(--radius-md)] border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            추가
          </button>
        </div>
      </div>
    </div>
  );
}

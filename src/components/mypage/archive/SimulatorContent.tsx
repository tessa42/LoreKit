import LorcraftMarkdown from '@/components/lorecraft/LorcraftMarkdown';
import type { SimulatorPayload } from '@/types/mypage';

interface SimulatorContentProps {
  payload: SimulatorPayload;
  title: string;
}

export default function SimulatorContent({ payload, title }: SimulatorContentProps) {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-[var(--foreground)]">{title}</h3>

      {payload.summary && (
        <p className="text-sm text-[var(--muted)]">{payload.summary}</p>
      )}

      {payload.story && (
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-widest text-[var(--muted)]">서사</p>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--foreground)]">
            {payload.story}
          </p>
        </div>
      )}

      {payload.quote && (
        <blockquote className="rounded-[var(--radius-md)] border-l-2 border-[var(--accent)] bg-[var(--accent-subtle)] px-4 py-3">
          <p className="text-sm italic leading-relaxed text-[var(--foreground)]">
            &ldquo;{payload.quote}&rdquo;
          </p>
        </blockquote>
      )}
    </div>
  );
}

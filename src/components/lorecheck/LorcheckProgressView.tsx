import { STEP_LABELS } from './lorcheckFormConstants';

export default function LorcheckProgressView({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-6 py-16">
      <span
        className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]"
        aria-hidden="true"
      />
      <p className="text-sm text-[var(--muted)]">
        {STEP_LABELS[message] ?? message}
      </p>
    </div>
  );
}

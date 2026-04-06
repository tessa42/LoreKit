type BadgeVariant = 'default' | 'accent' | 'success' | 'warning' | 'error';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted)]',
  accent:  'border-[var(--accent)]/30 bg-[var(--accent-subtle)] text-[var(--accent)]',
  success: 'border-[var(--success)]/30 bg-[var(--success-subtle)] text-[var(--success)]',
  warning: 'border-[var(--warning)]/30 bg-[var(--warning)]/10 text-[var(--warning)]',
  error:   'border-[var(--error-border)] bg-[var(--error-subtle)] text-[var(--error)]',
};

export default function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-[var(--radius-full)] border px-2.5 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className,
      ].join(' ')}
    >
      {children}
    </span>
  );
}

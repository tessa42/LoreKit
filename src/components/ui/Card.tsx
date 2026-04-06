interface CardProps {
  children: React.ReactNode;
  className?: string;
  /** surface-2 배경 사용 여부 (기본: surface) */
  elevated?: boolean;
}

export default function Card({ children, className = '', elevated = false }: CardProps) {
  return (
    <div
      className={[
        'rounded-[var(--radius-lg)] border border-[var(--border)]',
        elevated ? 'bg-[var(--surface-2)]' : 'bg-[var(--surface)]',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
}

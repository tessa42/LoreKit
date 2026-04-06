interface TagButtonProps {
  label: string;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
}

export default function TagButton({ label, selected, disabled = false, onClick }: TagButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={[
        'rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c6af7] focus-visible:ring-offset-1 focus-visible:ring-offset-[#0f0f12]',
        'disabled:cursor-not-allowed disabled:opacity-40',
        selected
          ? 'border-[#7c6af7] bg-[#7c6af7] text-white'
          : 'border-[#2e2e38] bg-[#222228] text-[#6b6b78] hover:border-[#7c6af7] hover:text-[#e8e6e1]',
      ].join(' ')}
    >
      {label}
    </button>
  );
}

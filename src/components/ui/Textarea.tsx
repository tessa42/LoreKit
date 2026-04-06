import { forwardRef } from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  required?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, required, className = '', id, ...props }, ref) => {
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={textareaId} className="block text-sm font-medium text-[var(--foreground)]">
            {label}
            {required && <span className="ml-1 text-[var(--accent)]">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={[
            'w-full rounded-[var(--radius-md)] border bg-[var(--surface-2)] px-3 py-2.5 text-sm',
            'text-[var(--foreground)] placeholder:text-[var(--muted)]',
            'transition-colors focus:outline-none focus:ring-1',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'resize-y min-h-[120px]',
            error
              ? 'border-[var(--error-border)] focus:border-[var(--error)] focus:ring-[var(--error)]'
              : 'border-[var(--border)] focus:border-[var(--accent)] focus:ring-[var(--accent)]',
            className,
          ].join(' ')}
          {...props}
        />
        {error && (
          <p className="text-xs text-[var(--error)]" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';

export default Textarea;

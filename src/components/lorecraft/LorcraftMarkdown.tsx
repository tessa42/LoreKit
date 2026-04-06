/**
 * LorcraftMarkdown
 * ### → bold heading, --- → <hr> 만 처리하는 경량 렌더러
 */

interface LorcraftMarkdownProps {
  text: string;
  className?: string;
}

export default function LorcraftMarkdown({ text, className }: LorcraftMarkdownProps) {
  const lines = text.split('\n');

  return (
    <div className={className}>
      {lines.map((line, i) => {
        if (line.startsWith('### ')) {
          return (
            <p key={i} className="mt-5 mb-1.5 text-sm font-bold text-[var(--foreground)] first:mt-0">
              {line.slice(4)}
            </p>
          );
        }
        if (line === '---') {
          return <hr key={i} className="my-4 border-[var(--border)]" />;
        }
        if (line === '') {
          return <div key={i} className="h-2" />;
        }
        return (
          <span key={i} className="block text-sm leading-relaxed text-[var(--foreground)]">
            {line}
          </span>
        );
      })}
    </div>
  );
}

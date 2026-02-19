import ReactMarkdown from 'react-markdown';

interface Props {
  content: string;
  className?: string;
}

export default function MarkdownResult({ content, className = '' }: Props) {
  return (
    <div className={`md-result ${className}`}>
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}

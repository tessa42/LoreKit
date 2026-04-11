import type { LoreCheckPayload } from '@/types/mypage';
import type { LorcheckIssue, IssueType, IssueSeverity } from '@/types/lorecheck';

interface LoreCheckContentProps {
  payload: LoreCheckPayload;
  title: string;
}

const ISSUE_TYPE_LABEL: Record<IssueType, string> = {
  immersion_break: '몰입 저해',
  intentional: '의도적 설정',
  insider_context: '독자 맥락',
};

const ISSUE_SEVERITY_LABEL: Record<IssueSeverity, string> = {
  high: '높음',
  medium: '보통',
  low: '낮음',
};

const ISSUE_BORDER_CLASS: Record<IssueType, string> = {
  immersion_break: 'border-l-2 border-red-400',
  intentional: 'border-l-2 border-green-400',
  insider_context: 'border-l-2 border-yellow-400',
};

const ISSUE_TYPE_BADGE_CLASS: Record<IssueType, string> = {
  immersion_break: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  intentional: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  insider_context: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
};

const ISSUE_SEVERITY_BADGE_CLASS: Record<IssueSeverity, string> = {
  high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  medium: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  low: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

export default function LoreCheckContent({ payload, title }: LoreCheckContentProps) {
  const issues: LorcheckIssue[] = payload.issues ?? [];

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-[var(--foreground)]">{title}</h3>

      {issues.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">문제가 발견되지 않았습니다</p>
      ) : (
        <div className="space-y-2">
          {issues.map((issue, i) => (
            <div
              key={i}
              className={`rounded-r-[var(--radius-md)] bg-[var(--surface-2)] px-4 py-3 space-y-1 ${ISSUE_BORDER_CLASS[issue.type]}`}
            >
              <div className="flex flex-wrap items-center gap-1.5">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ISSUE_TYPE_BADGE_CLASS[issue.type]}`}>
                  {ISSUE_TYPE_LABEL[issue.type]}
                </span>
                {issue.type !== 'intentional' && issue.severity && (
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ISSUE_SEVERITY_BADGE_CLASS[issue.severity]}`}>
                    {ISSUE_SEVERITY_LABEL[issue.severity]}
                  </span>
                )}
              </div>
              <p className="text-sm text-[var(--foreground)]">{issue.description}</p>
              <p className="text-xs text-[var(--muted)]">{issue.suggestion}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

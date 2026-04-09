'use client';

import { useSearchParams } from 'next/navigation';
import Card from '@/components/ui/Card';
import type { CreditTransaction } from '@/lib/credits/transaction';

interface Props {
  balance: number;
  transactions: CreditTransaction[];
}

export default function BillingSection({ balance, transactions }: Props) {
  const searchParams = useSearchParams();
  const success = searchParams.get('success') === 'true';

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-[var(--foreground)]">결제 내역</h1>

      {success && (
        <div className="rounded-[var(--radius-md)] border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-600 dark:text-green-400">
          결제가 완료되었습니다. 씨앗이 지급되었습니다.
        </div>
      )}

      {/* 현재 잔액 */}
      <Card>
        <div className="flex items-center justify-between px-5 py-4">
          <span className="text-sm text-[var(--muted)]">현재 씨앗 잔액</span>
          <span className="flex items-center gap-1.5 text-sm font-semibold text-[var(--foreground)]">
            🌱 {balance.toLocaleString()} 씨앗
          </span>
        </div>
      </Card>

      {/* 거래 내역 */}
      {transactions.length === 0 ? (
        <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-5 py-10 text-center">
          <p className="text-sm text-[var(--muted)]">아직 거래 내역이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {transactions.map((tx) => {
            const isCharge = tx.amount > 0;
            return (
              <Card key={tx.id}>
                <div className="flex items-center justify-between px-5 py-4">
                  <div>
                    <p className="text-sm text-[var(--foreground)]">{tx.reason}</p>
                    <p className="mt-0.5 text-xs text-[var(--muted)]">
                      {new Date(tx.created_at).toLocaleString('ko-KR', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <span
                    className={[
                      'text-sm font-semibold tabular-nums',
                      isCharge ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400',
                    ].join(' ')}
                  >
                    {isCharge ? '+' : ''}{tx.amount.toLocaleString()}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

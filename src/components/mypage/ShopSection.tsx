'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

const PACKAGES = [
  { productId: 'b297051d-b196-4c47-8d1d-438b2f625d58', seeds: 5, price: '$4.99', label: '스타터' },
  { productId: 'eb7df972-16ef-4d6f-8955-492eb8521a39', seeds: 12, price: '$9.99', label: '베이직' },
  { productId: 'ece78c7b-fb38-4c50-9338-2926a8ab2f8f', seeds: 30, price: '$23.99', label: '프로' },
];

interface Props {
  balance: number;
}

export default function ShopSection({ balance }: Props) {
  const searchParams = useSearchParams();
  const success = searchParams.get('success') === 'true';
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function handlePurchase(productId: string) {
    setLoadingId(productId);
    setError('');
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? '결제 페이지를 열 수 없습니다.');
      window.location.href = json.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : '결제 페이지를 열 수 없습니다.');
      setLoadingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-[var(--foreground)]">씨앗 구매</h1>

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

      {/* 패키지 목록 */}
      <div className="space-y-3">
        {PACKAGES.map((pkg) => (
          <Card key={pkg.productId}>
            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-sm font-medium text-[var(--foreground)]">
                  🌱 {pkg.seeds} 씨앗
                  <span className="ml-2 text-xs font-normal text-[var(--muted)]">{pkg.label}</span>
                </p>
                <p className="mt-0.5 text-sm font-semibold text-[var(--foreground)]">{pkg.price}</p>
              </div>
              <Button
                size="sm"
                loading={loadingId === pkg.productId}
                disabled={loadingId !== null && loadingId !== pkg.productId}
                onClick={() => handlePurchase(pkg.productId)}
              >
                구매
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {error && (
        <p className="text-xs text-[var(--error,#ef4444)]">{error}</p>
      )}

      <p className="text-xs text-[var(--muted)]">
        결제는 Polar를 통해 처리됩니다. 씨앗은 결제 완료 후 즉시 지급됩니다.
      </p>
    </div>
  );
}

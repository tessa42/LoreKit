'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LorcheckResult from '@/components/lorecheck/LorcheckResult';
import type { LorcheckQuickPayload } from '@/types/lorecheck';

export default function LorcheckResultPage() {
  const router = useRouter();
  const [payload, setPayload] = useState<LorcheckQuickPayload | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem('lorecheck:result');
    if (!raw) {
      router.replace('/lorecheck');
      return;
    }
    try {
      setPayload(JSON.parse(raw));
    } catch {
      router.replace('/lorecheck');
    }
  }, [router]);

  if (!payload) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
      </div>
    );
  }

  return <LorcheckResult payload={payload} />;
}

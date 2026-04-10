export const runtime = 'edge';

import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { getCreditBalance, getCreditTransactions } from '@/lib/credits/transaction';
import BillingSection from '@/components/mypage/BillingSection';

export default async function BillingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [balance, transactions] = await Promise.all([
    getCreditBalance(user.id),
    getCreditTransactions(user.id),
  ]);

  return (
    <Suspense>
      <BillingSection balance={balance} transactions={transactions} />
    </Suspense>
  );
}

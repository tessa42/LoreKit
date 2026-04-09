import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { getCreditBalance } from '@/lib/credits/transaction';
import ShopSection from '@/components/mypage/ShopSection';

export default async function ShopPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const balance = await getCreditBalance(user.id);

  return (
    <Suspense>
      <ShopSection balance={balance} />
    </Suspense>
  );
}

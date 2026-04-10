export const runtime = 'edge';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCreditBalance } from '@/lib/credits/transaction';
import AccountSection from '@/components/mypage/AccountSection';

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const balance = await getCreditBalance(user.id);

  return (
    <AccountSection
      email={user.email ?? ''}
      createdAt={user.created_at}
      balance={balance}
    />
  );
}

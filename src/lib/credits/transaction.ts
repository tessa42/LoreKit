import { createClient } from '@/lib/supabase/server'

export interface CreditTransaction {
  id: string;
  amount: number;
  balance_after: number;
  reason: string;
  created_at: string;
}

export async function getCreditTransactions(userId: string): Promise<CreditTransaction[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('credit_transactions')
    .select('id, amount, balance_after, reason, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw new Error(`내역 조회 실패: ${error.message}`)
  return data ?? []
}

export async function getCreditBalance(userId: string): Promise<number> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('credit_wallets')
    .select('balance')
    .eq('user_id', userId)
    .single()
  if (error) throw new Error(`잔액 조회 실패: ${error.message}`)
  return data.balance
}

export async function canSpendCredits(userId: string, amount: number): Promise<boolean> {
  const balance = await getCreditBalance(userId)
  return balance >= amount
}

export async function spendCredits(
  userId: string,
  amount: number,
  reason: string,
  referenceId?: string
): Promise<void> {
  const supabase = await createClient()
  const balance = await getCreditBalance(userId)
  if (balance < amount) throw new Error('씨앗이 부족합니다')
  const newBalance = balance - amount
  const { error: walletError } = await supabase
    .from('credit_wallets')
    .update({ balance: newBalance })
    .eq('user_id', userId)
  if (walletError) throw new Error(`씨앗 차감 실패: ${walletError.message}`)
  await supabase.from('credit_transactions').insert({
    user_id: userId,
    amount: -amount,
    balance_after: newBalance,
    reason,
    reference_id: referenceId ?? null,
  })
}

export async function addCredits(
  userId: string,
  amount: number,
  reason: string,
  referenceId?: string
): Promise<void> {
  const supabase = await createClient()
  const balance = await getCreditBalance(userId)
  const newBalance = balance + amount
  await supabase.from('credit_wallets').update({ balance: newBalance }).eq('user_id', userId)
  await supabase.from('credit_transactions').insert({
    user_id: userId,
    amount,
    balance_after: newBalance,
    reason,
    reference_id: referenceId ?? null,
  })
}

export async function refundCredits(
  userId: string,
  amount: number,
  reason: string
): Promise<void> {
  const supabase = await createClient()
  const balance = await getCreditBalance(userId)
  const newBalance = balance + amount
  await supabase.from('credit_wallets').update({ balance: newBalance }).eq('user_id', userId)
  await supabase.from('credit_transactions').insert({
    user_id: userId,
    amount,
    balance_after: newBalance,
    reason: `refund:${reason}`,
  })
}

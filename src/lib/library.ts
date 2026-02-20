import { supabase } from './supabase';

export type ReportType = 'lorecraft' | 'lorecheck' | 'simulator';

export interface SavedReport {
  id:         string;
  user_id:    string;
  type:       ReportType;
  title:      string;
  data:       unknown;
  created_at: string;
}

export async function saveReport(
  userId: string,
  type:   ReportType,
  title:  string,
  data:   unknown,
): Promise<{ error?: string }> {
  const { error } = await supabase
    .from('saved_reports')
    .insert({ user_id: userId, type, title, data });
  return error ? { error: error.message } : {};
}

export async function fetchReports(userId: string): Promise<{ data?: SavedReport[]; error?: string }> {
  const { data, error } = await supabase
    .from('saved_reports')
    .select('id, type, title, data, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) return { error: error.message };
  return { data: data as SavedReport[] };
}

export async function deleteReport(id: string): Promise<{ error?: string }> {
  const { error } = await supabase
    .from('saved_reports')
    .delete()
    .eq('id', id);
  return error ? { error: error.message } : {};
}

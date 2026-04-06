import type { SimulatorResult } from '@/types/simulator';

export type ArchiveItemType =
  | 'lorecraft'
  | 'lorecheck_quick'
  | 'lorecheck_deep'
  | 'simulator';

export type ArchiveFilter = 'all' | ArchiveItemType;

// archive_items 테이블 row
export interface ArchiveItem {
  id: string;
  user_id: string;
  type: ArchiveItemType;
  title: string;
  payload: ArchivePayload;
  created_at: string;
}

// payload 타입 (type에 따라 다름)
export type ArchivePayload =
  | SimulatorPayload
  | LoreCraftPayload
  | LoreCheckPayload;

export interface SimulatorPayload extends SimulatorResult {
  name: string;
}

export interface LoreCraftPayload {
  title?: string;
  content?: string;
  [key: string]: unknown;
}

export interface LoreCheckPayload {
  issues?: unknown[];
  score?: number;
  [key: string]: unknown;
}

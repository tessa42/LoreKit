export interface Lorebook {
  id: string;
  user_id: string;
  title: string;
  cover_image: string | null;
  is_public: boolean;
  source_note_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface LorebookWithSectionCount extends Lorebook {
  section_count: number;
}

export interface LorebookSection {
  id: string;
  lorebook_id: string;
  user_id: string;
  title: string;
  content: string;
  order_index: number;
  note_block_id: string | null;
  is_public: boolean;
  is_usable: boolean;
  created_at: string;
  updated_at: string;
}

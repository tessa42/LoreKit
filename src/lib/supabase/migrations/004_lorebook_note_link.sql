-- lorebooks에 source_note_id 추가
ALTER TABLE public.lorebooks
  ADD COLUMN IF NOT EXISTS source_note_id uuid REFERENCES public.notes(id) ON DELETE SET NULL;

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_lorebooks_source_note_id ON public.lorebooks(source_note_id);

-- 블록 0개 노트 삭제
DELETE FROM public.notes
WHERE id NOT IN (SELECT DISTINCT note_id FROM public.note_blocks);

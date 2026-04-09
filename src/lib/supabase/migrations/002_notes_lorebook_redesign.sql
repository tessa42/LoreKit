-- ============================================================
-- 002: 작가 노트 + 로어북 구조 개편
-- Supabase Dashboard → SQL Editor에서 실행
-- ============================================================

-- 1. notes 테이블에서 content 컬럼 제거 (블록 구조로 전환)
ALTER TABLE public.notes DROP COLUMN IF EXISTS content;

-- 2. note_blocks 테이블 신규 생성
CREATE TABLE public.note_blocks (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  note_id          uuid NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  user_id          uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type             text NOT NULL CHECK (type IN (
                     'text', 'character', 'world_overview', 'setting',
                     'timeline', 'plot', 'org_chart', 'scenario'
                   )),
  content          jsonb NOT NULL DEFAULT '{}',
  order_index      integer NOT NULL DEFAULT 0,
  source_archive_id uuid REFERENCES public.archive_items(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.note_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "note_blocks: 본인만 조회"
  ON public.note_blocks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "note_blocks: 본인만 insert"
  ON public.note_blocks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "note_blocks: 본인만 수정"
  ON public.note_blocks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "note_blocks: 본인만 삭제"
  ON public.note_blocks FOR DELETE
  USING (auth.uid() = user_id);

-- updated_at 트리거
CREATE TRIGGER set_updated_at_note_blocks
  BEFORE UPDATE ON public.note_blocks
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- 인덱스
CREATE INDEX idx_note_blocks_note_id ON public.note_blocks(note_id);
CREATE INDEX idx_note_blocks_user_id ON public.note_blocks(user_id);

-- 3. lorebooks에 is_public 추가
ALTER TABLE public.lorebooks
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false;

-- 4. lorebook_sections에 컬럼 추가
ALTER TABLE public.lorebook_sections
  ADD COLUMN IF NOT EXISTS note_block_id uuid REFERENCES public.note_blocks(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_usable boolean NOT NULL DEFAULT false;

-- 완료
-- Supabase Dashboard → Table Editor에서 아래 확인:
-- note_blocks 테이블 생성 여부
-- lorebooks.is_public 컬럼 추가 여부
-- lorebook_sections.note_block_id, is_public, is_usable 컬럼 추가 여부

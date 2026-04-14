-- profiles에 nickname 컬럼 추가
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nickname text;

-- 한국어 랜덤 닉네임 생성 함수
CREATE OR REPLACE FUNCTION public.generate_random_nickname()
RETURNS text AS $$
DECLARE
  adjectives text[] := ARRAY['고독한','붉은','잊혀진','새벽의','어두운','빛나는','조용한','깊은','푸른','황금빛','차가운','뜨거운','바람같은','별빛의','안개속'];
  nouns text[] := ARRAY['늑대','달빛','서사','기록자','탐험가','마법사','연대기','전설','목격자','방랑자','수호자','예언자','이야기꾼','세계관','창조자'];
  adj text;
  noun text;
BEGIN
  adj := adjectives[floor(random() * array_length(adjectives, 1) + 1)];
  noun := nouns[floor(random() * array_length(nouns, 1) + 1)];
  RETURN adj || noun;
END;
$$ LANGUAGE plpgsql;

-- 신규 가입 시 닉네임 자동 부여 트리거
CREATE OR REPLACE FUNCTION public.handle_new_user_nickname()
RETURNS trigger AS $$
BEGIN
  UPDATE public.profiles
  SET nickname = public.generate_random_nickname()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_nickname ON auth.users;
CREATE TRIGGER on_auth_user_created_nickname
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_nickname();

-- 기존 계정 전부 랜덤 닉네임 부여
UPDATE public.profiles
SET nickname = public.generate_random_nickname()
WHERE nickname IS NULL;

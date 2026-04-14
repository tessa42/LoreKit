
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { getCreditBalance } from '@/lib/credits/transaction';
import { formatDate, TYPE_LABEL } from '@/components/mypage/archive/archiveCardUtils';
import type { ArchiveItemType } from '@/types/mypage';

// 로어북 ID → 결정론적 그라디언트 배경색
function lorebookHashGradient(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const h1 = Math.abs(hash) % 360;
  const h2 = (h1 + 45) % 360;
  return `linear-gradient(145deg, hsl(${h1}, 35%, 22%), hsl(${h2}, 30%, 16%))`;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // 병렬 데이터 조회
  const [profileResult, balance, lorebooksResult, archiveResult, notesResult] =
    await Promise.all([
      supabase
        .from('profiles')
        .select('nickname, display_name')
        .eq('id', user.id)
        .single(),
      getCreditBalance(user.id),
      supabase
        .from('lorebooks')
        .select('id, title, cover_image')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(5),
      supabase
        .from('archive_items')
        .select('id, title, type, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(2),
      supabase
        .from('notes')
        .select('id, title, updated_at, note_blocks(count)')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(2),
    ]);

  const profile = profileResult.data;
  // character_type은 추후 DB 컬럼 추가 후 연동 예정 → 현재는 '마법사님' 고정
  const characterLabel = '마법사님';
  const nickname =
    profile?.nickname ?? profile?.display_name ?? null;

  const lorebooks = (lorebooksResult.data ?? []) as Array<{
    id: string;
    title: string;
    cover_image: string | null;
  }>;

  const archiveItems = (archiveResult.data ?? []) as Array<{
    id: string;
    title: string;
    type: ArchiveItemType;
    created_at: string;
  }>;

  const notes = (notesResult.data ?? []).map((row) => ({
    id: row.id as string,
    title: row.title as string,
    updated_at: row.updated_at as string,
    block_count: Array.isArray(row.note_blocks)
      ? ((row.note_blocks[0] as { count: number } | undefined)?.count ?? 0)
      : 0,
  }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 space-y-10">
      {/* ── 상단 헤더 ── */}
      <section>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">
          {nickname ? `${nickname}님의 작업실` : '마법사님의 작업실'}
        </h1>
        <p className="mt-2 text-[var(--muted)]">
          오늘은 어떤 세계를 빚어볼까요, {characterLabel}?
        </p>
        <p className="mt-1 text-sm text-[var(--muted)]">
          세계수 씨앗이 {balance}개 남았어요{' '}
          <span style={{ fontSize: 11, opacity: 0.5 }}>✦</span>
        </p>
      </section>

      {/* ── 책장 섹션 ── */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-[var(--foreground)]">내 책장</h2>
          <Link
            href="/mypage/lorebook"
            className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            전체 보기 →
          </Link>
        </div>

        {lorebooks.length === 0 ? (
          <p className="text-sm text-[var(--muted)] py-6 border border-[var(--border)] rounded-[var(--radius-lg)] text-center">
            아직 책장이 비어 있어요. 첫 번째 세계를 만들어보세요!
          </p>
        ) : (
          <div
            className="flex gap-3 pb-2"
            style={{ overflowX: 'auto' }}
          >
            {lorebooks.map((book) => (
              <Link
                key={book.id}
                href={`/mypage/lorebook/${book.id}`}
                className="flex-shrink-0 group"
                style={{ width: 110 }}
              >
                {/* 표지 */}
                <div
                  className="rounded-[var(--radius-md)] overflow-hidden border border-[var(--border)] group-hover:border-[var(--accent)] transition-colors"
                  style={{ aspectRatio: '2/3', position: 'relative' }}
                >
                  {book.cover_image ? (
                    <Image
                      src={book.cover_image}
                      alt={book.title}
                      fill
                      className="object-cover"
                      sizes="110px"
                    />
                  ) : (
                    <div
                      style={{
                        background: lorebookHashGradient(book.id),
                        width: '100%',
                        height: '100%',
                      }}
                    />
                  )}
                </div>
                {/* 제목 */}
                <p
                  className="mt-1.5 text-xs text-[var(--foreground)] leading-snug"
                  style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {book.title}
                </p>
              </Link>
            ))}

            {/* + 새 로어북 카드 */}
            <Link
              href="/mypage/lorebook"
              className="flex-shrink-0"
              style={{ width: 110 }}
            >
              <div
                className="rounded-[var(--radius-md)] border border-dashed border-[var(--border)] hover:border-[var(--accent)] transition-colors flex items-center justify-center text-[var(--muted)] hover:text-[var(--accent)]"
                style={{ aspectRatio: '2/3' }}
              >
                <span className="text-2xl leading-none">+</span>
              </div>
              <p className="mt-1.5 text-xs text-[var(--muted)] text-center leading-snug">
                새 로어북
              </p>
            </Link>
          </div>
        )}
      </section>

      {/* ── 하단 2열 그리드 ── */}
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}
      >
        {/* 왼쪽: 아카이브 */}
        <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--foreground)]">최근 아카이브</h2>
            <Link
              href="/mypage/archive"
              className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              전체 보기 →
            </Link>
          </div>

          {archiveItems.length === 0 ? (
            <p className="text-xs text-[var(--muted)]">아직 저장된 결과물이 없어요.</p>
          ) : (
            <ul className="space-y-2">
              {archiveItems.map((item) => (
                <li key={item.id}>
                  <Link
                    href="/mypage/archive"
                    className="flex items-start gap-2 rounded-[var(--radius-md)] p-2 hover:bg-[var(--surface-2)] transition-colors"
                  >
                    <span className="mt-0.5 text-xs text-[var(--muted)] whitespace-nowrap">
                      {TYPE_LABEL[item.type]}
                    </span>
                    <span
                      className="text-xs text-[var(--foreground)] leading-snug"
                      style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {item.title}
                    </span>
                  </Link>
                  <p className="ml-2 text-[11px] text-[var(--muted)]">
                    {formatDate(item.created_at)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 오른쪽: 작가 노트 */}
        <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--foreground)]">최근 작가 노트</h2>
            <Link
              href="/mypage/note"
              className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              전체 보기 →
            </Link>
          </div>

          {notes.length === 0 ? (
            <p className="text-xs text-[var(--muted)]">아직 작성한 노트가 없어요.</p>
          ) : (
            <ul className="space-y-2">
              {notes.map((note) => (
                <li key={note.id}>
                  <Link
                    href={`/mypage/note/${note.id}`}
                    className="flex items-start justify-between gap-2 rounded-[var(--radius-md)] p-2 hover:bg-[var(--surface-2)] transition-colors"
                  >
                    <span
                      className="text-xs text-[var(--foreground)] leading-snug"
                      style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {note.title || '제목 없음'}
                    </span>
                    <span className="flex-shrink-0 text-[11px] text-[var(--muted)]">
                      블록 {note.block_count}
                    </span>
                  </Link>
                  <p className="ml-2 text-[11px] text-[var(--muted)]">
                    {formatDate(note.updated_at)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

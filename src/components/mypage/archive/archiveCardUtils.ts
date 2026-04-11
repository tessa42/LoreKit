import type { ArchiveItem } from '@/types/mypage';

export const TYPE_LABEL: Record<ArchiveItem['type'], string> = {
  simulator: 'Simulator',
  lorecraft: 'Lorecraft',
  lorecheck_quick: 'Lorecheck',
  lorecheck_deep: 'Lorecheck Deep',
};

export const TYPE_BADGE_VARIANT: Record<ArchiveItem['type'], 'accent' | 'default' | 'success'> = {
  simulator: 'accent',
  lorecraft: 'success',
  lorecheck_quick: 'default',
  lorecheck_deep: 'default',
};

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

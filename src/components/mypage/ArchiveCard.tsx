'use client';

import Card from '@/components/ui/Card';
import ArchiveCardHeader from '@/components/mypage/archive/ArchiveCardHeader';
import SimulatorContent from '@/components/mypage/archive/SimulatorContent';
import LoreCraftContent from '@/components/mypage/archive/LoreCraftContent';
import LoreCheckContent from '@/components/mypage/archive/LoreCheckContent';
import type { ArchiveItem, SimulatorPayload, LoreCraftPayload, LoreCheckPayload } from '@/types/mypage';

interface ArchiveCardProps {
  item: ArchiveItem;
  onDelete: (id: string) => void;
}

export default function ArchiveCard({ item, onDelete }: ArchiveCardProps) {
  return (
    <Card className="p-5">
      <ArchiveCardHeader item={item} onDelete={onDelete} />

      {item.type === 'simulator' && (
        <SimulatorContent payload={item.payload as SimulatorPayload} title={item.title} />
      )}
      {item.type === 'lorecraft' && (
        <LoreCraftContent payload={item.payload as LoreCraftPayload} title={item.title} />
      )}
      {(item.type === 'lorecheck_quick' || item.type === 'lorecheck_deep') && (
        <LoreCheckContent payload={item.payload as LoreCheckPayload} title={item.title} />
      )}
    </Card>
  );
}

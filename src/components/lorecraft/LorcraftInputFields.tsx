'use client';

import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import TagButton from '@/components/ui/TagButton';
import type { LorcraftArea } from '@/types/lorecraft';

interface LorcraftInputFieldsProps {
  background: string;
  onBackgroundChange: (value: string) => void;
  genre: string;
  onGenreChange: (value: string) => void;
  existingSetting: string;
  onExistingSettingChange: (value: string) => void;
  areas: LorcraftArea[];
  onToggleArea: (area: LorcraftArea) => void;
  availableAreas: LorcraftArea[];
}

export default function LorcraftInputFields({
  background,
  onBackgroundChange,
  genre,
  onGenreChange,
  existingSetting,
  onExistingSettingChange,
  areas,
  onToggleArea,
  availableAreas,
}: LorcraftInputFieldsProps) {
  return (
    <>
      {/* 배경 */}
      <div className="space-y-1.5">
        <Textarea
          label="세계관 배경"
          required
          value={background}
          onChange={(e) => onBackgroundChange(e.target.value)}
          maxLength={500}
          placeholder="예: 1920년대 경성을 배경으로 한 대체역사. 일제강점기이지만 조선의 독립운동 세력이 비밀 마법 결사를 운영하고 있다."
          className="min-h-[140px]"
        />
        <p className={`text-right text-xs ${background.length >= 500 ? 'text-[var(--error)]' : 'text-[var(--muted)]'}`}>
          {background.length}/500
        </p>
      </div>

      {/* 장르 */}
      <Input
        label="장르"
        required
        value={genre}
        onChange={(e) => onGenreChange(e.target.value)}
        maxLength={100}
        placeholder="예: 대체역사 / 다크 판타지 / SF 스릴러"
      />

      {/* 기존 설정 */}
      <div className="space-y-1.5">
        <Textarea
          label="기존 설정 (선택)"
          value={existingSetting}
          onChange={(e) => onExistingSettingChange(e.target.value)}
          maxLength={1000}
          placeholder="이미 구성해 둔 설정이 있다면 입력하세요. 없으면 비워두세요."
          className="min-h-[100px]"
        />
        <p className={`text-right text-xs ${existingSetting.length >= 1000 ? 'text-[var(--error)]' : 'text-[var(--muted)]'}`}>
          {existingSetting.length}/1000
        </p>
      </div>

      {/* 요청 영역 */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-[var(--foreground)]">
          생성 영역 <span className="text-[var(--accent)]">*</span>
        </p>
        <p className="text-xs text-[var(--muted)]">원하는 항목을 복수 선택하세요.</p>
        <div className="flex flex-wrap gap-2 pt-1">
          {availableAreas.map((area) => (
            <TagButton
              key={area}
              label={area}
              selected={areas.includes(area)}
              onClick={() => onToggleArea(area)}
            />
          ))}
        </div>
      </div>
    </>
  );
}

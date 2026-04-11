import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';

interface Props {
  genre: string;
  onGenreChange: (v: string) => void;
  text: string;
  onTextChange: (v: string) => void;
  existingSetting: string;
  onExistingSettingChange: (v: string) => void;
}

export default function LorcheckInputFields({
  genre, onGenreChange,
  text, onTextChange,
  existingSetting, onExistingSettingChange,
}: Props) {
  return (
    <>
      {/* 장르 */}
      <Input
        label="장르 (선택)"
        value={genre}
        onChange={(e) => onGenreChange(e.target.value)}
        maxLength={100}
        placeholder="예: 조선시대 / 중세 판타지 / 근미래 SF"
      />

      {/* 검토할 텍스트 */}
      <div className="space-y-1.5">
        <Textarea
          label="검토할 텍스트"
          required
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          maxLength={3000}
          placeholder="고증 검토를 받을 텍스트를 입력하세요."
          className="min-h-[200px]"
        />
        <p
          className={`text-right text-xs ${
            text.length >= 3000 ? 'text-[var(--error)]' : 'text-[var(--muted)]'
          }`}
        >
          {text.length}/3000
        </p>
      </div>

      {/* 기존 설정 */}
      <div className="space-y-1.5">
        <Textarea
          label="기존 설정 (선택)"
          value={existingSetting}
          onChange={(e) => onExistingSettingChange(e.target.value)}
          maxLength={1000}
          placeholder="세계관 설정이나 작품 내 규칙이 있다면 입력하세요."
          className="min-h-[100px]"
        />
        <p
          className={`text-right text-xs ${
            existingSetting.length >= 1000 ? 'text-[var(--error)]' : 'text-[var(--muted)]'
          }`}
        >
          {existingSetting.length}/1000
        </p>
      </div>
    </>
  );
}

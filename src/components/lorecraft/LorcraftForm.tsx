'use client';

import Button from '@/components/ui/Button';
import LoginPromptModal from '@/components/common/LoginPromptModal';
import SeedShortageModal from '@/components/common/SeedShortageModal';
import LorcraftStreamingPreview from './LorcraftStreamingPreview';
import LorcraftInputFields from './LorcraftInputFields';
import { useLorcraftForm } from './useLorcraftForm';

export default function LorcraftForm() {
  const {
    background,
    setBackground,
    genre,
    setGenre,
    existingSetting,
    setExistingSetting,
    areas,
    toggleArea,
    isValid,
    isRunning,
    error,
    progressMessage,
    streamedText,
    showLoginModal,
    setShowLoginModal,
    seedModal,
    setSeedModal,
    handleSubmit,
    handleSeedModalConfirm,
    AREAS,
  } = useLorcraftForm();

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* 스트리밍 중: 입력 폼 숨기고 미리보기만 표시 */}
      {isRunning ? (
        <LorcraftStreamingPreview
          progressMessage={progressMessage}
          streamedText={streamedText}
        />
      ) : (
        <LorcraftInputFields
          background={background}
          onBackgroundChange={setBackground}
          genre={genre}
          onGenreChange={setGenre}
          existingSetting={existingSetting}
          onExistingSettingChange={setExistingSetting}
          areas={areas}
          onToggleArea={toggleArea}
          availableAreas={AREAS}
        />
      )}

      {/* 에러 */}
      {error && (
        <div
          className="rounded-[var(--radius-md)] border border-[var(--error-border)] bg-[var(--error-subtle)] px-4 py-3 text-sm text-[var(--error)]"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* 제출 */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        loading={isRunning}
        disabled={!isValid}
        className="w-full"
      >
        {isRunning ? '설정집 생성 중…' : (
          <>설정집 생성 <span className="text-xs opacity-70 ml-1">🌱 5</span></>
        )}
      </Button>

      {showLoginModal && (
        <LoginPromptModal
          onClose={() => setShowLoginModal(false)}
          next="/lorecraft"
        />
      )}

      {seedModal && (
        <SeedShortageModal
          isOpen
          currentBalance={seedModal.currentBalance}
          requiredAmount={seedModal.requiredAmount}
          onClose={() => setSeedModal(null)}
          onConfirm={handleSeedModalConfirm}
        />
      )}
    </form>
  );
}

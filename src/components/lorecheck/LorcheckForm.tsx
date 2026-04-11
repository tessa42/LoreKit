'use client';

import Button from '@/components/ui/Button';
import LoginPromptModal from '@/components/common/LoginPromptModal';
import SeedShortageModal from '@/components/common/SeedShortageModal';
import { useLorcheckForm } from './useLorcheckForm';
import LorcheckProgressView from './LorcheckProgressView';
import LorcheckInputFields from './LorcheckInputFields';

export default function LorcheckForm() {
  const {
    text, setText,
    genre, setGenre,
    existingSetting, setExistingSetting,
    isValid, isRunning, error,
    progressMessage, handleSubmit,
    showLoginModal, setShowLoginModal,
    seedModal, setSeedModal,
    saveDraftAndGoToShop,
  } = useLorcheckForm();

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {isRunning ? (
        <LorcheckProgressView message={progressMessage} />
      ) : (
        <LorcheckInputFields
          genre={genre}
          onGenreChange={setGenre}
          text={text}
          onTextChange={setText}
          existingSetting={existingSetting}
          onExistingSettingChange={setExistingSetting}
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
        {isRunning ? '검토 중…' : (
          <>고증 검토 실행 <span className="text-xs opacity-70 ml-1">🌱 1</span></>
        )}
      </Button>

      {showLoginModal && (
        <LoginPromptModal onClose={() => setShowLoginModal(false)} next="/lorecheck" />
      )}

      {seedModal && (
        <SeedShortageModal
          isOpen
          currentBalance={seedModal.currentBalance}
          requiredAmount={seedModal.requiredAmount}
          onClose={() => setSeedModal(null)}
          onConfirm={saveDraftAndGoToShop}
        />
      )}
    </form>
  );
}

'use client';

import dynamic from 'next/dynamic';
import { useNoteEditor } from './useNoteEditor';
import NoteEditorHeader from './NoteEditorHeader';
import NoteEditorActionBar from './NoteEditorActionBar';
import PublishLorebookModal from './PublishLorebookModal';
import ImportArchiveModal from './ImportArchiveModal';
import type { ArchiveItem } from './noteEditorUtils';
import type { Note, NoteBlock } from '@/types/note';

const NoteBlockList = dynamic(() => import('./NoteBlockList'), { ssr: false });

interface Props {
  note: Note;
  initialBlocks: NoteBlock[];
  lorearchiveItems: ArchiveItem[];
}

export default function NoteEditorClient({ note, initialBlocks, lorearchiveItems }: Props) {
  const editor = useNoteEditor(note, initialBlocks);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <NoteEditorHeader
        title={editor.title}
        titleRef={editor.titleRef}
        onTitleChange={editor.setTitle}
        onTitleBlur={editor.handleTitleBlur}
        onBack={editor.navigateBack}
      />

      <NoteBlockList
        noteId={note.id}
        blocks={editor.blocks}
        onBlocksChange={editor.setBlocks}
        onDeleteBlock={editor.handleDeleteBlock}
        onSaveBlock={editor.handleSaveBlock}
      />

      <NoteEditorActionBar
        addingBlock={editor.addingBlock}
        showBlockMenu={editor.showBlockMenu}
        hasArchiveItems={lorearchiveItems.length > 0}
        blocksEmpty={editor.blocks.length === 0}
        onToggleMenu={() => editor.setShowBlockMenu((v) => !v)}
        onAddBlock={editor.handleAddBlock}
        onOpenArchiveModal={() => editor.setShowArchiveModal(true)}
        onOpenPublishModal={editor.handleOpenPublishModal}
      />

      {editor.showPublishModal && (
        <PublishLorebookModal
          blocks={editor.blocks}
          lorebooks={editor.lorebooks}
          loadingLorebooks={editor.loadingLorebooks}
          publishingId={editor.publishingId}
          onClose={() => editor.setShowPublishModal(false)}
          onPublish={editor.handlePublishToLorebook}
          onNavigateToNewLorebook={editor.navigateToNewLorebook}
        />
      )}

      {editor.showArchiveModal && (
        <ImportArchiveModal
          lorearchiveItems={lorearchiveItems}
          importingId={editor.importingId}
          onClose={() => editor.setShowArchiveModal(false)}
          onImport={editor.handleImportArchive}
        />
      )}
    </div>
  );
}

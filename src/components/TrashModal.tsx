import React from 'react';
import { Trash2, X, RotateCcw, AlertTriangle } from 'lucide-react';
import { useNotes } from '../context/NotesContext';
import { useLanguage } from '../context/LanguageContext';

export const TrashModal: React.FC = () => {
  const {
    notes,
    isTrashModalOpen,
    setIsTrashModalOpen,
    restoreNote,
    deleteNote,
    emptyTrash,
  } = useNotes();

  const { t } = useLanguage();

  const deletedNotes = notes.filter(n => n.is_deleted);

  if (!isTrashModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#131d31] w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150 relative">
        <button
          onClick={() => setIsTrashModalOpen(false)}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex items-center justify-between mb-4 pr-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600">
              <Trash2 size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">{t.trashTitle}</h3>
              <p className="text-xs text-slate-500">{deletedNotes.length} {t.notesCount}</p>
            </div>
          </div>

          {deletedNotes.length > 0 && (
            <button
              onClick={() => {
                if (confirm(t.emptyTrashConfirm)) {
                  emptyTrash();
                }
              }}
              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Trash2 size={13} />
              <span>{t.emptyTrash}</span>
            </button>
          )}
        </div>

        {/* Description */}
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          {t.trashDescription}
        </p>

        {/* Deleted Notes List */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {deletedNotes.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center">
              <Trash2 size={32} className="text-slate-300 dark:text-slate-600 mb-2" />
              <p className="font-semibold text-sm mb-1">{t.trashEmpty}</p>
            </div>
          ) : (
            deletedNotes.map(note => (
              <div
                key={note.id}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3"
              >
                <div className="truncate flex-1">
                  <h4 className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate">
                    {note.title || 'தலைப்பில்லாத குறிப்பு'}
                  </h4>
                  <p className="text-[11px] text-slate-400 truncate">
                    {note.content_text || note.content.replace(/<[^>]*>/g, '')}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => restoreNote(note.id)}
                    title={t.restore}
                    className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw size={13} />
                    <span>{t.restore}</span>
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(t.deleteConfirmTitle)) {
                        deleteNote(note.id, true);
                      }
                    }}
                    title={t.permanentlyDelete}
                    className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400 rounded-lg transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

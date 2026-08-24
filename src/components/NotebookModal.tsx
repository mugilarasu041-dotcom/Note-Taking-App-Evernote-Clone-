import React, { useState } from 'react';
import { BookOpen, X, Check, Trash2, Plus } from 'lucide-react';
import { useNotes } from '../context/NotesContext';
import { useLanguage } from '../context/LanguageContext';

const NOTEBOOK_COLORS = [
  '#10b981', // Emerald
  '#0284c7', // Sky blue
  '#8b5cf6', // Violet
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#ec4899', // Pink
  '#14b8a6', // Teal
  '#64748b', // Slate
];

export const NotebookModal: React.FC = () => {
  const {
    notebooks,
    isNotebookModalOpen,
    setIsNotebookModalOpen,
    createNotebook,
    deleteNotebook,
    setActiveNotebookId,
    setCurrentView,
  } = useNotes();

  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#10b981');
  const [loading, setLoading] = useState(false);

  if (!isNotebookModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || loading) return;

    setLoading(true);
    try {
      const created = await createNotebook(name.trim(), description.trim(), color);
      setName('');
      setDescription('');
      setIsNotebookModalOpen(false);
      setActiveNotebookId(created.id);
      setCurrentView('notebook');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#131d31] w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150 relative">
        <button
          onClick={() => setIsNotebookModalOpen(false)}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600">
            <BookOpen size={20} />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">{t.notebooks}</h3>
            <p className="text-xs text-slate-500">{t.createNotebook}</p>
          </div>
        </div>

        {/* Create Notebook Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 mb-6">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t.notebookName} *
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. தனிப்பட்ட குறிப்புகள் (Personal)"
              required
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t.notebookDescription}
            </label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="விளக்கம்..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {t.notebookColor}
            </label>
            <div className="flex items-center gap-2">
              {NOTEBOOK_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform ${
                    color === c ? 'scale-110 ring-2 ring-offset-2 ring-slate-400' : ''
                  }`}
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check size={13} className="text-white" />}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus size={16} />
            <span>{loading ? 'உருவாக்குகிறது...' : t.createNotebook}</span>
          </button>
        </form>

        {/* Existing Notebooks List */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-4 flex-1 overflow-y-auto">
          <p className="text-xs font-semibold text-slate-500 mb-2">தற்போதுள்ள குறிப்பேடுகள் ({notebooks.length}):</p>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {notebooks.map(nb => (
              <div
                key={nb.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60"
              >
                <div
                  onClick={() => {
                    setActiveNotebookId(nb.id);
                    setCurrentView('notebook');
                    setIsNotebookModalOpen(false);
                  }}
                  className="flex items-center gap-2.5 cursor-pointer truncate flex-1"
                >
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: nb.color }} />
                  <div className="truncate">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{nb.name}</p>
                    {nb.description && <p className="text-[10px] text-slate-400 truncate">{nb.description}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 font-medium">
                    {nb.note_count || 0} {t.notesCount}
                  </span>
                  <button
                    onClick={() => {
                      if (confirm(t.deleteNotebookConfirm)) {
                        deleteNotebook(nb.id);
                      }
                    }}
                    className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

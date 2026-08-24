import React, { useState } from 'react';
import { Tag as TagIcon, X, Plus, Trash2 } from 'lucide-react';
import { useNotes } from '../context/NotesContext';
import { useLanguage } from '../context/LanguageContext';

export const TagModal: React.FC = () => {
  const { tags, isTagModalOpen, setIsTagModalOpen, createTag, deleteTag, setActiveTag, setCurrentView } = useNotes();
  const { t } = useLanguage();

  const [tagName, setTagName] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isTagModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagName.trim() || loading) return;

    setLoading(true);
    try {
      const created = await createTag(tagName.trim());
      setTagName('');
      setIsTagModalOpen(false);
      setActiveTag(created.name);
      setCurrentView('tag');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#131d31] w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150 relative">
        <button
          onClick={() => setIsTagModalOpen(false)}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600">
            <TagIcon size={20} />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">{t.tags}</h3>
            <p className="text-xs text-slate-500">{t.createTag}</p>
          </div>
        </div>

        {/* Create Tag Form */}
        <form onSubmit={handleSubmit} className="space-y-3 mb-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t.tagName} *
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-400">#</span>
              <input
                type="text"
                value={tagName}
                onChange={e => setTagName(e.target.value)}
                placeholder="முக்கியம் / important"
                required
                className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={loading || !tagName.trim()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <Plus size={15} />
                <span>{t.confirm}</span>
              </button>
            </div>
          </div>
        </form>

        {/* Existing Tags Chips */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-4 flex-1 overflow-y-auto">
          <p className="text-xs font-semibold text-slate-500 mb-2.5">
            தற்போதுள்ள குறிச்சொற்கள் ({tags.length}):
          </p>
          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
            {tags.map(tg => (
              <div
                key={tg.id}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs border border-slate-200 dark:border-slate-700"
              >
                <button
                  onClick={() => {
                    setActiveTag(tg.name);
                    setCurrentView('tag');
                    setIsTagModalOpen(false);
                  }}
                  className="font-medium hover:text-emerald-600"
                >
                  #{tg.name}
                </button>
                <span className="text-[10px] text-slate-400">({tg.note_count || 0})</span>
                <button
                  onClick={() => deleteTag(tg.id)}
                  className="hover:text-red-500 text-slate-400 ml-1"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

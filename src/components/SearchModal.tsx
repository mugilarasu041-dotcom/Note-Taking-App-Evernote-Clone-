import React, { useState, useMemo } from 'react';
import { Search, X, Calendar, BookOpen, Tag as TagIcon, Star, ArrowRight } from 'lucide-react';
import { useNotes } from '../context/NotesContext';
import { useLanguage } from '../context/LanguageContext';
import { Note } from '../types';

export const SearchModal: React.FC = () => {
  const {
    notes,
    notebooks,
    tags,
    isSearchModalOpen,
    setIsSearchModalOpen,
    selectNote,
    setCurrentView,
  } = useNotes();

  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [selectedNotebook, setSelectedNotebook] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  const searchResults = useMemo(() => {
    if (!query.trim() && selectedNotebook === 'all' && selectedTag === 'all' && !onlyFavorites) {
      return [];
    }

    const q = query.toLowerCase().trim();
    return notes.filter(n => {
      if (n.is_deleted) return false;
      if (onlyFavorites && !n.is_favorite) return false;
      if (selectedNotebook !== 'all' && n.notebook_id !== selectedNotebook) return false;
      if (selectedTag !== 'all' && !n.tags.includes(selectedTag)) return false;

      if (!q) return true;

      return (
        n.title.toLowerCase().includes(q) ||
        n.content_text.toLowerCase().includes(q) ||
        n.tags.some(t => t.toLowerCase().includes(q))
      );
    });
  }, [notes, query, selectedNotebook, selectedTag, onlyFavorites]);

  if (!isSearchModalOpen) return null;

  const handleSelectNote = (note: Note) => {
    selectNote(note);
    setCurrentView('all');
    setIsSearchModalOpen(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-start justify-center p-4 pt-16 sm:pt-24">
      <div className="bg-white dark:bg-[#131d31] w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[80vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <Search size={20} className="text-emerald-600 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            autoFocus
            className="flex-1 bg-transparent text-sm sm:text-base font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none"
          />
          <button
            onClick={() => setIsSearchModalOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Filters Row */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto text-xs">
          {/* Favorites Filter */}
          <button
            onClick={() => setOnlyFavorites(!onlyFavorites)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full border transition-colors shrink-0 ${
              onlyFavorites
                ? 'bg-amber-500/10 border-amber-500 text-amber-600 font-semibold'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Star size={13} className={onlyFavorites ? 'fill-amber-500' : ''} />
            <span>{t.favorites}</span>
          </button>

          {/* Notebook Filter */}
          <select
            value={selectedNotebook}
            onChange={e => setSelectedNotebook(e.target.value)}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full px-2.5 py-1 text-xs text-slate-700 dark:text-slate-300 outline-none shrink-0"
          >
            <option value="all">{t.allNotebooks}</option>
            {notebooks.map(nb => (
              <option key={nb.id} value={nb.id}>{nb.name}</option>
            ))}
          </select>

          {/* Tag Filter */}
          <select
            value={selectedTag}
            onChange={e => setSelectedTag(e.target.value)}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full px-2.5 py-1 text-xs text-slate-700 dark:text-slate-300 outline-none shrink-0"
          >
            <option value="all">{t.allTags}</option>
            {tags.map(tg => (
              <option key={tg.id} value={tg.name}>#{tg.name}</option>
            ))}
          </select>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {query.trim() || onlyFavorites || selectedNotebook !== 'all' || selectedTag !== 'all' ? (
            searchResults.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                <p className="font-semibold text-sm mb-1">{t.noResults}</p>
                <p>{t.tryDifferentSearch}</p>
              </div>
            ) : (
              searchResults.map(note => {
                const nb = notebooks.find(n => n.id === note.notebook_id);
                return (
                  <div
                    key={note.id}
                    onClick={() => handleSelectNote(note)}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-emerald-50 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700/60 cursor-pointer transition-all flex items-center justify-between group"
                  >
                    <div className="truncate flex-1 pr-3">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-xs text-slate-800 dark:text-slate-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 truncate">
                          {note.title || 'தலைப்பில்லாத குறிப்பு'}
                        </h4>
                        {nb && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 shrink-0">
                            {nb.name}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                        {note.content_text || note.content.replace(/<[^>]*>/g, '')}
                      </p>
                    </div>

                    <ArrowRight size={16} className="text-slate-400 group-hover:text-emerald-600 shrink-0" />
                  </div>
                );
              })
            )
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              தேட சொற்களை உள்ளிடவும் (Type words above to search across notes)
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

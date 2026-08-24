import React, { useState, useMemo } from 'react';
import {
  Search,
  SlidersHorizontal,
  Star,
  Pin,
  Calendar,
  CheckSquare,
  Paperclip,
  Trash2,
  Archive,
  MoreVertical,
  Plus,
  ArrowUpDown,
  Filter,
  X,
  FileText,
} from 'lucide-react';
import { useNotes } from '../context/NotesContext';
import { useLanguage } from '../context/LanguageContext';
import { Note } from '../types';

export const NotesList: React.FC = () => {
  const {
    notes,
    notebooks,
    tags,
    activeNote,
    activeNotebookId,
    activeTag,
    currentView,
    searchQuery,
    sortBy,
    selectNote,
    createNote,
    deleteNote,
    toggleFavorite,
    toggleArchive,
    togglePin,
    setSearchQuery,
    setSortBy,
  } = useNotes();

  const { t } = useLanguage();
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('all');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

  // Filter notes based on current view & search query
  const filteredNotes = useMemo(() => {
    let list = [...notes];

    // Exclude deleted notes unless in trash view
    if (currentView === 'trash') {
      list = list.filter(n => n.is_deleted);
    } else {
      list = list.filter(n => !n.is_deleted);

      // Handle archive
      if (currentView === 'archive') {
        list = list.filter(n => n.is_archived);
      } else {
        list = list.filter(n => !n.is_archived);
      }

      // Handle views
      if (currentView === 'favorites') {
        list = list.filter(n => n.is_favorite);
      } else if (currentView === 'notebook' && activeNotebookId) {
        list = list.filter(n => n.notebook_id === activeNotebookId);
      } else if (currentView === 'tag' && activeTag) {
        list = list.filter(n => n.tags.includes(activeTag));
      }
    }

    // Apply tag filter dropdown
    if (selectedTagFilter !== 'all') {
      list = list.filter(n => n.tags.includes(selectedTagFilter));
    }

    // Apply search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(n =>
        n.title.toLowerCase().includes(q) ||
        n.content_text.toLowerCase().includes(q) ||
        n.tags.some(tag => tag.toLowerCase().includes(q))
      );
    }

    // Sorting
    list.sort((a, b) => {
      // Pinned first if not in trash
      if (currentView !== 'trash') {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
      }

      if (sortBy === 'created_desc') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === 'title_asc') {
        return a.title.localeCompare(b.title);
      }
      // default: updated_desc
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

    return list;
  }, [notes, currentView, activeNotebookId, activeTag, searchQuery, selectedTagFilter, sortBy]);

  // Compute view header title
  const getHeaderTitle = () => {
    if (currentView === 'favorites') return t.favorites;
    if (currentView === 'archive') return t.archive;
    if (currentView === 'trash') return t.trash;
    if (currentView === 'recent') return t.recent;
    if (currentView === 'notebook' && activeNotebookId) {
      const nb = notebooks.find(n => n.id === activeNotebookId);
      return nb ? nb.name : t.notebooks;
    }
    if (currentView === 'tag' && activeTag) {
      return `#${activeTag}`;
    }
    return t.allNotes;
  };

  const currentNotebook = notebooks.find(n => n.id === activeNotebookId);

  return (
    <div className="w-full md:w-[360px] lg:w-[400px] h-full flex flex-col bg-white dark:bg-[#131d31] border-r border-slate-200/80 dark:border-slate-800 shrink-0 select-none">
      {/* Header Bar */}
      <div className="p-4 border-b border-slate-200/60 dark:border-slate-800/80 bg-white/90 dark:bg-[#131d31]/90 backdrop-blur-xs sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 truncate">
            {currentNotebook && (
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: currentNotebook.color || '#10b981' }}
              />
            )}
            <h2 className="font-bold text-lg text-slate-900 dark:text-slate-100 truncate">
              {getHeaderTitle()}
            </h2>
            <span className="text-xs text-slate-400 font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 shrink-0">
              {filteredNotes.length}
            </span>
          </div>

          {/* New note small trigger */}
          <button
            onClick={() => createNote()}
            title={t.newNote}
            className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors"
          >
            <Plus size={18} />
          </button>
        </div>

        {/* Search Input */}
        <div className="relative mb-2.5">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 rounded-xl py-2 pl-9 pr-8 text-xs text-slate-800 dark:text-slate-100 outline-none transition-all placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Sort and Filters Row */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1">
            <ArrowUpDown size={13} className="text-slate-400" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-transparent text-xs font-medium text-slate-600 dark:text-slate-300 outline-none cursor-pointer hover:text-emerald-600"
            >
              <option value="updated_desc" className="dark:bg-slate-800">{t.sortUpdatedDesc}</option>
              <option value="created_desc" className="dark:bg-slate-800">{t.sortCreatedDesc}</option>
              <option value="title_asc" className="dark:bg-slate-800">{t.sortTitleAsc}</option>
            </select>
          </div>

          {/* Quick Tag Filter */}
          {tags.length > 0 && (
            <div className="flex items-center gap-1">
              <Filter size={13} className="text-slate-400" />
              <select
                value={selectedTagFilter}
                onChange={e => setSelectedTagFilter(e.target.value)}
                className="bg-transparent text-xs font-medium text-slate-600 dark:text-slate-300 outline-none cursor-pointer hover:text-emerald-600 max-w-[110px] truncate"
              >
                <option value="all" className="dark:bg-slate-800">{t.allTags}</option>
                {tags.map(tg => (
                  <option key={tg.id} value={tg.name} className="dark:bg-slate-800">
                    #{tg.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Notes List Scroll Area */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
        {filteredNotes.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
              <FileText size={26} />
            </div>
            <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-200 mb-1">
              {searchQuery ? t.noResults : t.noNotesTitle}
            </h3>
            <p className="text-xs text-slate-400 max-w-[220px] mb-4">
              {searchQuery ? t.tryDifferentSearch : t.noNotesDesc}
            </p>
            {!searchQuery && (
              <button
                onClick={() => createNote()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 transition-colors shadow-xs"
              >
                <Plus size={15} />
                <span>{t.newNote}</span>
              </button>
            )}
          </div>
        ) : (
          filteredNotes.map(note => {
            const isSelected = activeNote?.id === note.id;
            const notebook = notebooks.find(nb => nb.id === note.notebook_id);
            const totalChecklist = note.checklist?.length || 0;
            const completedChecklist = note.checklist?.filter(c => c.checked).length || 0;

            return (
              <div
                key={note.id}
                onClick={() => selectNote(note)}
                className={`group relative rounded-xl p-3.5 cursor-pointer border transition-all duration-150 ${
                  isSelected
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-500/50 shadow-xs ring-1 ring-emerald-500/20'
                    : 'bg-white dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-800 hover:shadow-xs'
                }`}
              >
                {/* Left Active Accent Bar */}
                {isSelected && (
                  <div className="absolute left-0 top-3 bottom-3 w-1 bg-emerald-600 rounded-r" />
                )}

                {/* Top Row: Title, Date, Actions */}
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {note.pinned && (
                      <Pin size={13} className="text-amber-500 shrink-0 fill-amber-500 rotate-45" />
                    )}
                    <h3
                      className={`text-sm font-semibold truncate ${
                        isSelected ? 'text-emerald-900 dark:text-emerald-300' : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {highlightSearchMatch(note.title || t.untitledNote, searchQuery)}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        toggleFavorite(note.id);
                      }}
                      className={`p-0.5 rounded transition-colors ${
                        note.is_favorite
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-300 dark:text-slate-600 hover:text-amber-400 opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      <Star size={14} className={note.is_favorite ? 'fill-amber-400' : ''} />
                    </button>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                      {formatRelativeDate(note.updated_at)}
                    </span>
                  </div>
                </div>

                {/* Content Preview Snippet */}
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-2.5">
                  {highlightSearchMatch(
                    extractSnippet(note.content_text || note.content),
                    searchQuery
                  )}
                </p>

                {/* Footer Metadata Badges */}
                <div className="flex items-center justify-between gap-2 pt-1 text-[11px]">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Notebook Pill */}
                    {notebook && (
                      <span
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60"
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: notebook.color || '#10b981' }}
                        />
                        <span className="truncate max-w-[80px]">{notebook.name}</span>
                      </span>
                    )}

                    {/* Tag Pills */}
                    {note.tags.slice(0, 2).map(tag => (
                      <span
                        key={tag}
                        className="px-1.5 py-0.5 rounded-md text-[10px] bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400"
                      >
                        #{tag}
                      </span>
                    ))}
                    {note.tags.length > 2 && (
                      <span className="text-[10px] text-slate-400">+{note.tags.length - 2}</span>
                    )}
                  </div>

                  {/* Checklist & Attachment Indicators */}
                  <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 shrink-0">
                    {totalChecklist > 0 && (
                      <span
                        className={`inline-flex items-center gap-0.5 text-[10px] ${
                          completedChecklist === totalChecklist ? 'text-emerald-600 font-medium' : ''
                        }`}
                        title={`${completedChecklist}/${totalChecklist} completed`}
                      >
                        <CheckSquare size={12} />
                        <span>{completedChecklist}/{totalChecklist}</span>
                      </span>
                    )}

                    {note.attachments && note.attachments.length > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-[10px]" title="Attachments">
                        <Paperclip size={12} />
                        <span>{note.attachments.length}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

// Helper to highlight matching keywords
function highlightSearchMatch(text: string, query: string): React.ReactNode {
  if (!query || !text) return text;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark
        key={i}
        className="bg-emerald-200 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 px-0.5 rounded"
      >
        {part}
      </mark>
    ) : (
      part
    )
  );
}

// Clean HTML to plain text snippet
function extractSnippet(htmlOrText: string): string {
  if (!htmlOrText) return 'எதுவும் எழுதப்படவில்லை...';
  const tmp = htmlOrText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return tmp || 'எதுவும் எழுதப்படவில்லை...';
}

// Format relative date in Tamil / Short format
function formatRelativeDate(isoDate: string): string {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < 1) return 'இப்போது';
  if (diffHours < 24 && date.getDate() === now.getDate()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (diffHours < 48) return 'நேற்று';

  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

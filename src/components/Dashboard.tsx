import React from 'react';
import {
  FileText,
  Star,
  BookOpen,
  Archive,
  Plus,
  CheckSquare,
  Sparkles,
  Mic,
  Calendar,
  Search,
  Clock,
  ArrowRight,
  Menu,
  Pin,
} from 'lucide-react';
import { useNotes } from '../context/NotesContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Note } from '../types';

export const Dashboard: React.FC = () => {
  const {
    notes,
    notebooks,
    tags,
    createNote,
    selectNote,
    setCurrentView,
    setIsSearchModalOpen,
    setIsNotebookModalOpen,
    setIsAIAssistantOpen,
    setIsAudioDictateOpen,
    setIsMobileSidebarOpen,
    toggleFavorite,
  } = useNotes();

  const { t } = useLanguage();
  const { user } = useAuth();

  // Dynamic greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t.goodMorning;
    if (hour < 17) return t.goodAfternoon;
    return t.goodEvening;
  };

  const activeNotes = notes.filter(n => !n.is_deleted && !n.is_archived);
  const favoriteNotes = activeNotes.filter(n => n.is_favorite);
  const pinnedNotes = activeNotes.filter(n => n.pinned);
  const recentNotes = [...activeNotes].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  ).slice(0, 6);

  const handleOpenNote = (note: Note) => {
    selectNote(note);
    setCurrentView('all');
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-[#f8fafc] dark:bg-[#0b1120] p-4 sm:p-8 md:p-10 select-none">
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between pb-4 mb-4 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="p-2 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-xs"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
            கு
          </div>
          <span className="font-bold text-slate-800 dark:text-slate-100">{t.appName}</span>
        </div>
        <button
          onClick={() => setIsSearchModalOpen(true)}
          className="p-2 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-xs"
        >
          <Search size={18} />
        </button>
      </div>

      <div className="max-w-6xl mx-auto space-y-8">
        {/* Hero Greeting Banner */}
        <div className="relative rounded-3xl bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 text-white p-6 sm:p-8 shadow-md shadow-emerald-700/10 overflow-hidden">
          {/* Subtle decorative circles */}
          <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute right-32 -top-10 w-32 h-32 rounded-full bg-emerald-400/20 blur-xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-xs font-medium mb-3">
                <Calendar size={13} />
                <span>{new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</span>
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
                {getGreeting()}, {user?.name?.split(' ')[0] || 'பயனர்'} 👋
              </h1>
              <p className="text-emerald-100 text-sm max-w-xl">
                {t.notesOverview}. உங்களிடம் {activeNotes.length} குறிப்புகள் மற்றும் {notebooks.length} குறிப்பேடுகள் உள்ளன.
              </p>
            </div>

            {/* Quick Action in Banner */}
            <button
              onClick={() => {
                createNote();
                setCurrentView('all');
              }}
              className="bg-white hover:bg-emerald-50 text-emerald-800 font-semibold text-sm py-2.5 px-5 rounded-2xl flex items-center gap-2 shadow-sm transition-all duration-150 shrink-0"
            >
              <Plus size={18} strokeWidth={2.5} />
              <span>{t.newNote}</span>
            </button>
          </div>
        </div>

        {/* 4 Overview Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<FileText size={22} className="text-emerald-600 dark:text-emerald-400" />}
            title={t.totalNotes}
            value={activeNotes.length}
            bgColor="bg-emerald-500/10 dark:bg-emerald-950/40 border-emerald-500/20"
            onClick={() => setCurrentView('all')}
          />
          <StatCard
            icon={<Star size={22} className="text-amber-500 fill-amber-500" />}
            title={t.favoriteNotes}
            value={favoriteNotes.length}
            bgColor="bg-amber-500/10 dark:bg-amber-950/40 border-amber-500/20"
            onClick={() => setCurrentView('favorites')}
          />
          <StatCard
            icon={<BookOpen size={22} className="text-blue-600 dark:text-blue-400" />}
            title={t.notebooksCount}
            value={notebooks.length}
            bgColor="bg-blue-500/10 dark:bg-blue-950/40 border-blue-500/20"
            onClick={() => setIsNotebookModalOpen(true)}
          />
          <StatCard
            icon={<Archive size={22} className="text-purple-600 dark:text-purple-400" />}
            title={t.archivedNotes}
            value={notes.filter(n => n.is_archived && !n.is_deleted).length}
            bgColor="bg-purple-500/10 dark:bg-purple-950/40 border-purple-500/20"
            onClick={() => setCurrentView('archive')}
          />
        </div>

        {/* Quick Action Shortcuts Bar */}
        <div className="bg-white dark:bg-[#131d31] rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
            {t.quickActions}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <QuickActionButton
              icon={<Plus size={18} />}
              label={t.newNote}
              color="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100"
              onClick={() => {
                createNote();
                setCurrentView('all');
              }}
            />
            <QuickActionButton
              icon={<CheckSquare size={18} />}
              label={t.newChecklist}
              color="bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100"
              onClick={() => {
                createNote({
                  title: 'புதிய சரிபார்ப்பு பட்டியல்',
                  checklist: [{ id: `c_${Date.now()}`, text: 'முதல் பணி', checked: false }],
                });
                setCurrentView('all');
              }}
            />
            <QuickActionButton
              icon={<Mic size={18} />}
              label={t.audioNote}
              color="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100"
              onClick={() => setIsAudioDictateOpen(true)}
            />
            <QuickActionButton
              icon={<Sparkles size={18} />}
              label={t.aiAssistant}
              color="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100"
              onClick={() => setIsAIAssistantOpen(true)}
            />
          </div>
        </div>

        {/* Pinned Notes Grid (if any) */}
        {pinnedNotes.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-base text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Pin size={16} className="text-amber-500 fill-amber-500 rotate-45" />
                <span>{t.pinnedNotes}</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pinnedNotes.map(note => (
                <NoteCard
                  key={note.id}
                  note={note}
                  notebook={notebooks.find(n => n.id === note.notebook_id)}
                  onClick={() => handleOpenNote(note)}
                  onToggleFavorite={() => toggleFavorite(note.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Recent Notes Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-base text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Clock size={16} className="text-emerald-600" />
              <span>{t.recentNotesTitle}</span>
            </h2>

            <button
              onClick={() => setCurrentView('all')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition-colors"
            >
              <span>{t.viewAll}</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {recentNotes.length === 0 ? (
            <div className="bg-white dark:bg-[#131d31] rounded-2xl p-8 text-center border border-slate-200/80 dark:border-slate-800">
              <p className="text-sm text-slate-500 mb-3">{t.noNotesTitle}</p>
              <button
                onClick={() => createNote()}
                className="px-4 py-2 bg-emerald-600 text-white text-xs font-medium rounded-xl hover:bg-emerald-700 transition-colors"
              >
                {t.newNote}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentNotes.map(note => (
                <NoteCard
                  key={note.id}
                  note={note}
                  notebook={notebooks.find(n => n.id === note.notebook_id)}
                  onClick={() => handleOpenNote(note)}
                  onToggleFavorite={() => toggleFavorite(note.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: number;
  bgColor: string;
  onClick: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, bgColor, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`p-4 sm:p-5 rounded-2xl border ${bgColor} cursor-pointer hover:shadow-sm transition-all hover:scale-[1.01]`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="p-2 rounded-xl bg-white dark:bg-slate-800 shadow-2xs">{icon}</span>
        <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</span>
      </div>
      <p className="text-xs font-medium text-slate-600 dark:text-slate-400">{title}</p>
    </div>
  );
};

interface QuickActionButtonProps {
  icon: React.ReactNode;
  label: string;
  color: string;
  onClick: () => void;
}

const QuickActionButton: React.FC<QuickActionButtonProps> = ({ icon, label, color, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`p-3 rounded-xl flex items-center gap-2.5 text-xs font-semibold transition-all ${color}`}
    >
      <span>{icon}</span>
      <span className="truncate">{label}</span>
    </button>
  );
};

interface NoteCardProps {
  note: Note;
  notebook?: any;
  onClick: () => void;
  onToggleFavorite: () => void;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, notebook, onClick, onToggleFavorite }) => {
  const snippet = note.content_text || note.content.replace(/<[^>]*>/g, ' ').slice(0, 140);

  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-[#131d31] rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/40 dark:hover:border-emerald-500/40 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between group relative"
    >
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-bold text-sm sm:text-base text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 transition-colors line-clamp-1">
            {note.title || 'தலைப்பில்லாத குறிப்பு'}
          </h3>
          <button
            onClick={e => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            className="text-slate-300 dark:text-slate-600 hover:text-amber-400 transition-colors p-1"
          >
            <Star size={16} className={note.is_favorite ? 'text-amber-400 fill-amber-400' : ''} />
          </button>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed mb-4">
          {snippet || 'எதுவும் எழுதப்படவில்லை...'}
        </p>
      </div>

      <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100 dark:border-slate-800/80 text-slate-400">
        <div className="flex items-center gap-1.5 truncate">
          {notebook && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: notebook.color }} />
              <span className="truncate max-w-[70px]">{notebook.name}</span>
            </span>
          )}
          {note.tags.slice(0, 1).map(tag => (
            <span key={tag} className="text-slate-500">#{tag}</span>
          ))}
        </div>

        <span>
          {new Date(note.updated_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
        </span>
      </div>
    </div>
  );
};

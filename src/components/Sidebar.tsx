import React from 'react';
import {
  FileText,
  Home,
  BookOpen,
  Tag as TagIcon,
  Star,
  Clock,
  Archive,
  Trash2,
  Settings,
  Plus,
  Sparkles,
  Mic,
  FolderPlus,
  Cloud,
  ChevronRight,
  ChevronDown,
  X,
  Share2,
} from 'lucide-react';
import { useNotes } from '../context/NotesContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { NavView } from '../types';

export const Sidebar: React.FC = () => {
  const {
    notes,
    notebooks,
    tags,
    currentView,
    activeNotebookId,
    activeTag,
    setCurrentView,
    setActiveNotebookId,
    setActiveTag,
    createNote,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
    setIsNotebookModalOpen,
    setIsTagModalOpen,
    setIsSettingsModalOpen,
    setIsTrashModalOpen,
    setIsAIAssistantOpen,
    setIsVoiceLiveOpen,
    setIsWorkspaceModalOpen,
  } = useNotes();

  const { t, language, toggleLanguage } = useLanguage();
  const { user } = useAuth();
  const [isNotebooksExpanded, setIsNotebooksExpanded] = React.useState(true);
  const [isTagsExpanded, setIsTagsExpanded] = React.useState(true);

  const activeNotesCount = notes.filter(n => !n.is_deleted && !n.is_archived).length;
  const favCount = notes.filter(n => n.is_favorite && !n.is_deleted && !n.is_archived).length;
  const archiveCount = notes.filter(n => n.is_archived && !n.is_deleted).length;
  const trashCount = notes.filter(n => n.is_deleted).length;

  const handleNavClick = (view: NavView) => {
    setCurrentView(view);
    setActiveNotebookId(null);
    setActiveTag(null);
    setIsMobileSidebarOpen(false);
  };

  const handleNotebookSelect = (id: string) => {
    setCurrentView('notebook');
    setActiveNotebookId(id);
    setActiveTag(null);
    setIsMobileSidebarOpen(false);
  };

  const handleTagSelect = (tagName: string) => {
    setCurrentView('tag');
    setActiveTag(tagName);
    setActiveNotebookId(null);
    setIsMobileSidebarOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 md:hidden transition-opacity"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-[280px] bg-[#f8fafc] dark:bg-[#0f172a] border-r border-slate-200/80 dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out select-none shrink-0 ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center font-bold text-lg shadow-sm shadow-emerald-500/20">
              <span className="font-semibold text-xl">கு</span>
            </div>
            <div>
              <h1 className="font-bold text-lg text-emerald-800 dark:text-emerald-400 tracking-tight flex items-center gap-1.5">
                {t.appName}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t.appTagline}</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={toggleLanguage}
              title="Toggle Tamil / English"
              className="px-2 py-1 text-xs font-semibold rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors"
            >
              {language === 'ta' ? 'EN' : 'தமிழ்'}
            </button>
            <button
              className="md:hidden p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              onClick={() => setIsMobileSidebarOpen(false)}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Primary CTA Buttons */}
        <div className="p-3 space-y-2">
          <button
            onClick={() => {
              createNote();
              setCurrentView('all');
              setIsMobileSidebarOpen(false);
            }}
            className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-medium text-sm py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/25 transition-all duration-150"
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>{t.newNote}</span>
          </button>

          {/* Quick AI & Voice tools */}
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => setIsAIAssistantOpen(true)}
              className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-medium border border-emerald-200/60 dark:border-emerald-800/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
            >
              <Sparkles size={14} className="text-emerald-500 animate-pulse" />
              <span>{t.aiAssistant}</span>
            </button>

            <button
              onClick={() => setIsVoiceLiveOpen(true)}
              className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-medium border border-indigo-200/60 dark:border-indigo-800/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
            >
              <Mic size={14} className="text-indigo-500" />
              <span>{t.voiceLive}</span>
            </button>
          </div>
        </div>

        {/* Navigation Menu List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-5">
          {/* Main Navigation */}
          <div className="space-y-0.5">
            <NavItem
              icon={<Home size={18} />}
              label={t.home}
              active={currentView === 'dashboard'}
              onClick={() => handleNavClick('dashboard')}
            />
            <NavItem
              icon={<FileText size={18} />}
              label={t.allNotes}
              count={activeNotesCount}
              active={currentView === 'all'}
              onClick={() => handleNavClick('all')}
            />
            <NavItem
              icon={<Star size={18} />}
              label={t.favorites}
              count={favCount}
              active={currentView === 'favorites'}
              onClick={() => handleNavClick('favorites')}
            />
            <NavItem
              icon={<Clock size={18} />}
              label={t.recent}
              active={currentView === 'recent'}
              onClick={() => handleNavClick('recent')}
            />
          </div>

          {/* Notebooks Section */}
          <div>
            <div className="flex items-center justify-between px-2.5 py-1 mb-1 text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wider">
              <button
                onClick={() => setIsNotebooksExpanded(!isNotebooksExpanded)}
                className="flex items-center gap-1.5 hover:text-slate-800 dark:hover:text-slate-200"
              >
                {isNotebooksExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <span>{t.notebooks}</span>
              </button>
              <button
                onClick={() => setIsNotebookModalOpen(true)}
                title={t.createNotebook}
                className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-500 hover:text-emerald-600 transition-colors"
              >
                <Plus size={15} />
              </button>
            </div>

            {isNotebooksExpanded && (
              <div className="space-y-0.5 ml-1">
                {notebooks.map(nb => {
                  const count = notes.filter(n => n.notebook_id === nb.id && !n.is_deleted && !n.is_archived).length;
                  return (
                    <button
                      key={nb.id}
                      onClick={() => handleNotebookSelect(nb.id)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        currentView === 'notebook' && activeNotebookId === nb.id
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold border-l-3 border-emerald-600'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: nb.color || '#10b981' }}
                        />
                        <span className="truncate">{nb.name}</span>
                      </div>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 font-normal px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tags Section */}
          <div>
            <div className="flex items-center justify-between px-2.5 py-1 mb-1 text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wider">
              <button
                onClick={() => setIsTagsExpanded(!isTagsExpanded)}
                className="flex items-center gap-1.5 hover:text-slate-800 dark:hover:text-slate-200"
              >
                {isTagsExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <span>{t.tags}</span>
              </button>
              <button
                onClick={() => setIsTagModalOpen(true)}
                title={t.createTag}
                className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-500 hover:text-emerald-600 transition-colors"
              >
                <Plus size={15} />
              </button>
            </div>

            {isTagsExpanded && (
              <div className="flex flex-wrap gap-1 px-1.5">
                {tags.map(tag => {
                  const isSelected = currentView === 'tag' && activeTag === tag.name;
                  return (
                    <button
                      key={tag.id}
                      onClick={() => handleTagSelect(tag.name)}
                      className={`inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md transition-all ${
                        isSelected
                          ? 'bg-emerald-600 text-white font-medium shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span>#{tag.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Workspace & Archives */}
          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 space-y-0.5">
            <NavItem
              icon={<Cloud size={18} />}
              label={t.workspace}
              onClick={() => setIsWorkspaceModalOpen(true)}
            />
            <NavItem
              icon={<Archive size={18} />}
              label={t.archive}
              count={archiveCount}
              active={currentView === 'archive'}
              onClick={() => handleNavClick('archive')}
            />
            <NavItem
              icon={<Trash2 size={18} />}
              label={t.trash}
              count={trashCount}
              active={currentView === 'trash'}
              onClick={() => setIsTrashModalOpen(true)}
            />
          </div>
        </div>

        {/* Footer & User Profile */}
        <div className="p-3 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div
            onClick={() => setIsSettingsModalOpen(true)}
            className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 flex-1 min-w-0"
          >
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt="Avatar"
              className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-500/20 shrink-0"
            />
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{user?.name || 'User'}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user?.email || 'user@example.com'}</p>
            </div>
          </div>

          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title={t.settings}
          >
            <Settings size={18} />
          </button>
        </div>
      </aside>
    </>
  );
};

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  count?: number;
  active?: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, count, active, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all ${
        active
          ? 'bg-emerald-600 text-white shadow-xs font-semibold'
          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/60'
      }`}
    >
      <div className="flex items-center gap-2.5">
        <span className={active ? 'text-white' : 'text-slate-500 dark:text-slate-400'}>{icon}</span>
        <span>{label}</span>
      </div>
      {count !== undefined && count > 0 && (
        <span
          className={`text-xs px-2 py-0.5 rounded-full ${
            active ? 'bg-emerald-700 text-white' : 'bg-slate-200/70 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
};

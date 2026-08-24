/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { NotesList } from './components/NotesList';
import { NoteEditor } from './components/NoteEditor';
import { Dashboard } from './components/Dashboard';
import { AIAssistantModal } from './components/AIAssistantModal';
import { AudioDictateModal } from './components/AudioDictateModal';
import { VoiceLiveModal } from './components/VoiceLiveModal';
import { WorkspaceModal } from './components/WorkspaceModal';
import { ShareModal } from './components/ShareModal';
import { NotebookModal } from './components/NotebookModal';
import { TagModal } from './components/TagModal';
import { SearchModal } from './components/SearchModal';
import { SettingsModal } from './components/SettingsModal';
import { TrashModal } from './components/TrashModal';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { NotesProvider, useNotes } from './context/NotesContext';
import { ArrowLeft, Menu, Plus, Search, Sparkles, Mic } from 'lucide-react';

const MainLayout: React.FC = () => {
  const {
    currentView,
    activeNote,
    selectNote,
    createNote,
    setIsMobileSidebarOpen,
    setIsSearchModalOpen,
    setIsAIAssistantOpen,
    setIsAudioDictateOpen,
  } = useNotes();
  const { t } = useLanguage();

  // On mobile screen, if activeNote is selected and in note list view, show editor with back button
  const [mobileShowEditor, setMobileShowEditor] = useState(false);

  React.useEffect(() => {
    if (activeNote) {
      setMobileShowEditor(true);
    }
  }, [activeNote?.id]);

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-[#f8fafc] dark:bg-[#0b1120] text-slate-900 dark:text-slate-100 font-sans">
      {/* 1. Left Sidebar Navigation */}
      <Sidebar />

      {/* 2. Main Content Area */}
      <div className="flex-1 h-full flex flex-col md:flex-row overflow-hidden relative min-w-0">
        {currentView === 'dashboard' ? (
          /* Dashboard Home View */
          <Dashboard />
        ) : (
          /* 3-Column Evernote layout */
          <>
            {/* Middle Notes List (hidden on mobile if note editor is actively opened) */}
            <div
              className={`h-full flex-col md:flex ${
                mobileShowEditor ? 'hidden md:flex' : 'flex w-full md:w-auto'
              }`}
            >
              {/* Mobile Top Bar for Notes List */}
              <div className="md:hidden flex items-center justify-between p-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131d31]">
                <button
                  onClick={() => setIsMobileSidebarOpen(true)}
                  className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                >
                  <Menu size={20} />
                </button>
                <span className="font-bold text-sm text-emerald-800 dark:text-emerald-400">{t.appName}</span>
                <button
                  onClick={() => setIsSearchModalOpen(true)}
                  className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                >
                  <Search size={18} />
                </button>
              </div>

              <NotesList />
            </div>

            {/* Right Note Editor (hidden on mobile if in list view) */}
            <div
              className={`h-full flex-1 flex flex-col min-w-0 ${
                !mobileShowEditor ? 'hidden md:flex' : 'flex w-full'
              }`}
            >
              {/* Mobile Top Bar with Back Button */}
              {mobileShowEditor && (
                <div className="md:hidden flex items-center justify-between p-2.5 px-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131d31]">
                  <button
                    onClick={() => setMobileShowEditor(false)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 p-1"
                  >
                    <ArrowLeft size={16} />
                    <span>{t.allNotes}</span>
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setIsAIAssistantOpen(true)}
                      className="p-1.5 text-emerald-600 rounded-lg"
                    >
                      <Sparkles size={16} />
                    </button>
                    <button
                      onClick={() => setIsAudioDictateOpen(true)}
                      className="p-1.5 text-slate-600 rounded-lg"
                    >
                      <Mic size={16} />
                    </button>
                  </div>
                </div>
              )}

              <NoteEditor />
            </div>
          </>
        )}
      </div>

      {/* Floating Action Button for Mobile */}
      <div className="fixed bottom-6 right-6 md:hidden z-30">
        <button
          onClick={() => {
            createNote();
            setMobileShowEditor(true);
          }}
          className="w-14 h-14 rounded-full bg-emerald-600 text-white shadow-xl flex items-center justify-center hover:bg-emerald-700 active:scale-95 transition-all"
        >
          <Plus size={24} strokeWidth={2.5} />
        </button>
      </div>

      {/* Modals & Dialogs */}
      <AIAssistantModal />
      <AudioDictateModal />
      <VoiceLiveModal />
      <WorkspaceModal />
      <ShareModal />
      <NotebookModal />
      <TagModal />
      <SearchModal />
      <SettingsModal />
      <TrashModal />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <NotesProvider>
            <MainLayout />
          </NotesProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

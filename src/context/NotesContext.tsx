import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Note, Notebook, Tag, NavView, SyncStatus, ChecklistItem } from '../types';
import { api } from '../services/api';

interface NotesContextType {
  notes: Note[];
  notebooks: Notebook[];
  tags: Tag[];
  activeNote: Note | null;
  activeNotebookId: string | null;
  activeTag: string | null;
  currentView: NavView;
  searchQuery: string;
  sortBy: 'updated_desc' | 'created_desc' | 'title_asc';
  syncStatus: SyncStatus;
  loading: boolean;
  isMobileSidebarOpen: boolean;
  isSearchModalOpen: boolean;
  isNotebookModalOpen: boolean;
  isTagModalOpen: boolean;
  isShareModalOpen: boolean;
  isAIAssistantOpen: boolean;
  isAudioDictateOpen: boolean;
  isVoiceLiveOpen: boolean;
  isWorkspaceModalOpen: boolean;
  isSettingsModalOpen: boolean;
  isTrashModalOpen: boolean;
  
  // View setters
  setCurrentView: (view: NavView) => void;
  setActiveNotebookId: (id: string | null) => void;
  setActiveTag: (tag: string | null) => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (sort: 'updated_desc' | 'created_desc' | 'title_asc') => void;
  setIsMobileSidebarOpen: (open: boolean) => void;
  setIsSearchModalOpen: (open: boolean) => void;
  setIsNotebookModalOpen: (open: boolean) => void;
  setIsTagModalOpen: (open: boolean) => void;
  setIsShareModalOpen: (open: boolean) => void;
  setIsAIAssistantOpen: (open: boolean) => void;
  setIsAudioDictateOpen: (open: boolean) => void;
  setIsVoiceLiveOpen: (open: boolean) => void;
  setIsWorkspaceModalOpen: (open: boolean) => void;
  setIsSettingsModalOpen: (open: boolean) => void;
  setIsTrashModalOpen: (open: boolean) => void;

  // Actions
  selectNote: (note: Note | null) => void;
  createNote: (defaults?: Partial<Note>) => Promise<Note>;
  updateNoteContent: (id: string, updates: Partial<Note>, immediate?: boolean) => void;
  deleteNote: (id: string, permanent?: boolean) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  toggleArchive: (id: string) => Promise<void>;
  togglePin: (id: string) => Promise<void>;
  restoreNote: (id: string) => Promise<void>;
  emptyTrash: () => Promise<void>;
  
  // Notebooks & Tags Actions
  createNotebook: (name: string, description?: string, color?: string, icon?: string) => Promise<Notebook>;
  updateNotebook: (id: string, updates: Partial<Notebook>) => Promise<void>;
  deleteNotebook: (id: string) => Promise<void>;
  createTag: (name: string, color?: string) => Promise<Tag>;
  deleteTag: (id: string) => Promise<void>;
  
  // Checklists
  toggleChecklistItem: (noteId: string, itemId: string) => void;
  addChecklistItem: (noteId: string, text: string) => void;
  removeChecklistItem: (noteId: string, itemId: string) => void;

  // Manual trigger
  refreshAll: () => Promise<void>;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export const NotesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [activeNotebookId, setActiveNotebookId] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<NavView>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'updated_desc' | 'created_desc' | 'title_asc'>('updated_desc');
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('saved');
  const [loading, setLoading] = useState<boolean>(true);

  // Modal visibility states
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isNotebookModalOpen, setIsNotebookModalOpen] = useState(false);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [isAudioDictateOpen, setIsAudioDictateOpen] = useState(false);
  const [isVoiceLiveOpen, setIsVoiceLiveOpen] = useState(false);
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isTrashModalOpen, setIsTrashModalOpen] = useState(false);

  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdatesRef = useRef<{ id: string; updates: Partial<Note> } | null>(null);

  // Load initial data
  const refreshAll = useCallback(async () => {
    try {
      setLoading(true);
      const [notesRes, nbRes, tagsRes] = await Promise.all([
        api.getNotes(),
        api.getNotebooks(),
        api.getTags(),
      ]);

      if (notesRes.success) setNotes(notesRes.notes);
      if (nbRes.success) setNotebooks(nbRes.notebooks);
      if (tagsRes.success) setTags(tagsRes.tags);

      // Restore active note if needed
      if (notesRes.notes && notesRes.notes.length > 0) {
        setActiveNote(prev => {
          if (!prev) return notesRes.notes[0];
          const found = notesRes.notes.find(n => n.id === prev.id);
          return found || notesRes.notes[0];
        });
      }
    } catch (e) {
      console.error('Failed to load initial data:', e);
      setSyncStatus('offline');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Online / Offline listener
  useEffect(() => {
    const handleOnline = () => setSyncStatus('saved');
    const handleOffline = () => setSyncStatus('offline');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const selectNote = useCallback((note: Note | null) => {
    // Flush pending auto-save before switching notes
    if (pendingUpdatesRef.current && saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      const { id, updates } = pendingUpdatesRef.current;
      api.updateNote(id, updates).catch(console.error);
      pendingUpdatesRef.current = null;
    }
    setActiveNote(note);
  }, []);

  // Create Note
  const createNote = async (defaults?: Partial<Note>): Promise<Note> => {
    setSyncStatus('saving');
    const title = defaults?.title || 'தலைப்பில்லாத குறிப்பு';
    const notebook_id = defaults?.notebook_id || activeNotebookId || (notebooks[0]?.id || '');
    const tagsList = defaults?.tags || (activeTag ? [activeTag] : []);

    try {
      const res = await api.createNote({
        title,
        content: defaults?.content || '<p></p>',
        content_text: defaults?.content_text || '',
        notebook_id,
        tags: tagsList,
        checklist: defaults?.checklist || [],
        pinned: defaults?.pinned || false,
        is_favorite: defaults?.is_favorite || false,
      });

      if (res.success && res.note) {
        setNotes(prev => [res.note, ...prev]);
        setActiveNote(res.note);
        setSyncStatus('saved');
        return res.note;
      }
      throw new Error('Could not create note');
    } catch (e) {
      console.error('Create note failed:', e);
      // Fallback client note
      const fallbackNote: Note = {
        id: `note_${Date.now()}`,
        user_id: 'user_1',
        notebook_id,
        title,
        content: defaults?.content || '<p></p>',
        content_text: '',
        checklist: [],
        tags: tagsList,
        attachments: [],
        is_favorite: false,
        is_archived: false,
        is_deleted: false,
        shared_with: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setNotes(prev => [fallbackNote, ...prev]);
      setActiveNote(fallbackNote);
      setSyncStatus('offline');
      return fallbackNote;
    }
  };

  // Debounced Auto-Save
  const updateNoteContent = useCallback((id: string, updates: Partial<Note>, immediate = false) => {
    // 1. Optimistic UI update locally
    setNotes(prevNotes =>
      prevNotes.map(n => (n.id === id ? { ...n, ...updates, updated_at: new Date().toISOString() } : n))
    );

    setActiveNote(prev => (prev && prev.id === id ? { ...prev, ...updates, updated_at: new Date().toISOString() } : prev));

    setSyncStatus('saving');
    pendingUpdatesRef.current = { id, updates: { ...(pendingUpdatesRef.current?.updates || {}), ...updates } };

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    const performSave = async () => {
      if (!pendingUpdatesRef.current) return;
      const { id: targetId, updates: targetUpdates } = pendingUpdatesRef.current;
      pendingUpdatesRef.current = null;

      try {
        await api.updateNote(targetId, targetUpdates);
        setSyncStatus('saved');
      } catch (err) {
        console.error('Auto-save error:', err);
        setSyncStatus('offline');
      }
    };

    if (immediate) {
      performSave();
    } else {
      saveTimerRef.current = setTimeout(performSave, 1200);
    }
  }, []);

  // Delete note (move to trash or permanent)
  const deleteNote = async (id: string, permanent = false) => {
    try {
      await api.deleteNote(id, permanent);
      if (permanent) {
        setNotes(prev => prev.filter(n => n.id !== id));
      } else {
        setNotes(prev =>
          prev.map(n => (n.id === id ? { ...n, is_deleted: true, deleted_at: new Date().toISOString() } : n))
        );
      }

      if (activeNote?.id === id) {
        const remaining = notes.filter(n => n.id !== id && !n.is_deleted);
        setActiveNote(remaining.length > 0 ? remaining[0] : null);
      }
    } catch (e) {
      console.error('Delete note failed:', e);
    }
  };

  // Toggle favorite
  const toggleFavorite = async (id: string) => {
    const target = notes.find(n => n.id === id);
    if (!target) return;
    const newFav = !target.is_favorite;

    setNotes(prev => prev.map(n => (n.id === id ? { ...n, is_favorite: newFav } : n)));
    if (activeNote?.id === id) {
      setActiveNote(prev => (prev ? { ...prev, is_favorite: newFav } : null));
    }

    try {
      await api.toggleFavorite(id, newFav);
    } catch (e) {
      console.error('Toggle favorite failed:', e);
    }
  };

  // Toggle archive
  const toggleArchive = async (id: string) => {
    const target = notes.find(n => n.id === id);
    if (!target) return;
    const newArchived = !target.is_archived;

    setNotes(prev => prev.map(n => (n.id === id ? { ...n, is_archived: newArchived } : n)));
    if (activeNote?.id === id) {
      setActiveNote(prev => (prev ? { ...prev, is_archived: newArchived } : null));
    }

    try {
      await api.toggleArchive(id, newArchived);
    } catch (e) {
      console.error('Toggle archive failed:', e);
    }
  };

  // Toggle Pin
  const togglePin = async (id: string) => {
    const target = notes.find(n => n.id === id);
    if (!target) return;
    const newPinned = !target.pinned;
    updateNoteContent(id, { pinned: newPinned }, true);
  };

  // Restore note
  const restoreNote = async (id: string) => {
    try {
      await api.restoreNote(id);
      setNotes(prev => prev.map(n => (n.id === id ? { ...n, is_deleted: false, deleted_at: undefined } : n)));
    } catch (e) {
      console.error('Restore note failed:', e);
    }
  };

  // Empty trash
  const emptyTrash = async () => {
    try {
      await api.emptyTrash();
      setNotes(prev => prev.filter(n => !n.is_deleted));
    } catch (e) {
      console.error('Empty trash failed:', e);
    }
  };

  // Notebooks CRUD
  const createNotebook = async (name: string, description?: string, color?: string, icon?: string) => {
    const res = await api.createNotebook({ name, description, color, icon });
    if (res.success && res.notebook) {
      setNotebooks(prev => [res.notebook, ...prev]);
      return res.notebook;
    }
    throw new Error('Failed to create notebook');
  };

  const updateNotebook = async (id: string, updates: Partial<Notebook>) => {
    const res = await api.updateNotebook(id, updates);
    if (res.success && res.notebook) {
      setNotebooks(prev => prev.map(nb => (nb.id === id ? res.notebook : nb)));
    }
  };

  const deleteNotebook = async (id: string) => {
    await api.deleteNotebook(id);
    setNotebooks(prev => prev.filter(nb => nb.id !== id));
    setNotes(prev => prev.map(n => (n.notebook_id === id ? { ...n, notebook_id: '' } : n)));
    if (activeNotebookId === id) setActiveNotebookId(null);
  };

  // Tags CRUD
  const createTag = async (name: string, color?: string) => {
    const res = await api.createTag({ name, color });
    if (res.success && res.tag) {
      setTags(prev => (prev.some(t => t.name === res.tag.name) ? prev : [...prev, res.tag]));
      return res.tag;
    }
    throw new Error('Failed to create tag');
  };

  const deleteTag = async (id: string) => {
    const targetTag = tags.find(t => t.id === id);
    await api.deleteTag(id);
    setTags(prev => prev.filter(t => t.id !== id));
    if (targetTag) {
      setNotes(prev => prev.map(n => ({ ...n, tags: n.tags.filter(t => t !== targetTag.name) })));
    }
    if (activeTag === targetTag?.name) setActiveTag(null);
  };

  // Checklist Helpers
  const toggleChecklistItem = (noteId: string, itemId: string) => {
    const target = notes.find(n => n.id === noteId);
    if (!target) return;
    const newChecklist = (target.checklist || []).map(item =>
      item.id === itemId ? { ...item, checked: !item.checked } : item
    );
    updateNoteContent(noteId, { checklist: newChecklist }, true);
  };

  const addChecklistItem = (noteId: string, text: string) => {
    const target = notes.find(n => n.id === noteId);
    if (!target || !text.trim()) return;
    const newItem: ChecklistItem = {
      id: `chk_${Date.now()}`,
      text: text.trim(),
      checked: false,
    };
    const newChecklist = [...(target.checklist || []), newItem];
    updateNoteContent(noteId, { checklist: newChecklist }, true);
  };

  const removeChecklistItem = (noteId: string, itemId: string) => {
    const target = notes.find(n => n.id === noteId);
    if (!target) return;
    const newChecklist = (target.checklist || []).filter(item => item.id !== itemId);
    updateNoteContent(noteId, { checklist: newChecklist }, true);
  };

  return (
    <NotesContext.Provider
      value={{
        notes,
        notebooks,
        tags,
        activeNote,
        activeNotebookId,
        activeTag,
        currentView,
        searchQuery,
        sortBy,
        syncStatus,
        loading,
        isMobileSidebarOpen,
        isSearchModalOpen,
        isNotebookModalOpen,
        isTagModalOpen,
        isShareModalOpen,
        isAIAssistantOpen,
        isAudioDictateOpen,
        isVoiceLiveOpen,
        isWorkspaceModalOpen,
        isSettingsModalOpen,
        isTrashModalOpen,

        setCurrentView,
        setActiveNotebookId,
        setActiveTag,
        setSearchQuery,
        setSortBy,
        setIsMobileSidebarOpen,
        setIsSearchModalOpen,
        setIsNotebookModalOpen,
        setIsTagModalOpen,
        setIsShareModalOpen,
        setIsAIAssistantOpen,
        setIsAudioDictateOpen,
        setIsVoiceLiveOpen,
        setIsWorkspaceModalOpen,
        setIsSettingsModalOpen,
        setIsTrashModalOpen,

        selectNote,
        createNote,
        updateNoteContent,
        deleteNote,
        toggleFavorite,
        toggleArchive,
        togglePin,
        restoreNote,
        emptyTrash,

        createNotebook,
        updateNotebook,
        deleteNotebook,
        createTag,
        deleteTag,

        toggleChecklistItem,
        addChecklistItem,
        removeChecklistItem,
        refreshAll,
      }}
    >
      {children}
    </NotesContext.Provider>
  );
};

export const useNotes = () => {
  const context = useContext(NotesContext);
  if (!context) throw new Error('useNotes must be used within NotesProvider');
  return context;
};

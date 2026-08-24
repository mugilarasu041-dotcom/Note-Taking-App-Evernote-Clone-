import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  Link,
  Image as ImageIcon,
  Paperclip,
  RotateCcw,
  RotateCw,
  Sparkles,
  Volume2,
  VolumeX,
  Mic,
  Share2,
  Download,
  Star,
  Pin,
  Archive,
  Trash2,
  CloudCheck,
  CloudUpload,
  CloudOff,
  Plus,
  X,
  Calendar,
  Tag as TagIcon,
  ChevronDown,
  Check,
  Maximize2,
  Minimize2,
  FileText,
} from 'lucide-react';
import { useNotes } from '../context/NotesContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { ChecklistItem } from '../types';

export const NoteEditor: React.FC = () => {
  const {
    activeNote,
    notebooks,
    tags,
    syncStatus,
    updateNoteContent,
    deleteNote,
    toggleFavorite,
    toggleArchive,
    togglePin,
    toggleChecklistItem,
    addChecklistItem,
    removeChecklistItem,
    setIsShareModalOpen,
    setIsAIAssistantOpen,
    setIsAudioDictateOpen,
    setIsWorkspaceModalOpen,
  } = useNotes();

  const { t } = useLanguage();
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [newChecklistText, setNewChecklistText] = useState('');
  const [newTagInput, setNewTagInput] = useState('');
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
  const [isNotebookDropdownOpen, setIsNotebookDropdownOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Sync internal state when activeNote changes
  useEffect(() => {
    if (activeNote) {
      setTitle(activeNote.title || '');
      if (editorRef.current && editorRef.current.innerHTML !== activeNote.content) {
        editorRef.current.innerHTML = activeNote.content || '';
      }
    } else {
      setTitle('');
      if (editorRef.current) editorRef.current.innerHTML = '';
    }
  }, [activeNote?.id]);

  // Title change handler
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    if (activeNote) {
      updateNoteContent(activeNote.id, { title: val });
    }
  };

  // Editor content change handler
  const handleEditorInput = () => {
    if (!activeNote || !editorRef.current) return;
    const html = editorRef.current.innerHTML;
    const plainText = editorRef.current.innerText || '';
    updateNoteContent(activeNote.id, {
      content: html,
      content_text: plainText,
    });
  };

  // Rich Text command executor
  const executeCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
      handleEditorInput();
    }
  };

  const handleInsertLink = () => {
    const url = prompt('இணைப்பு URL உள்ளிடவும் (Enter link URL):', 'https://');
    if (url) {
      executeCommand('createLink', url);
    }
  };

  // Image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeNote) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      executeCommand('insertImage', base64);
      // Also add to attachments
      api.addAttachment({
        note_id: activeNote.id,
        name: file.name,
        url: base64,
        type: file.type,
        size: file.size,
      }).then(res => {
        if (res.success && res.note) {
          updateNoteContent(activeNote.id, { attachments: res.note.attachments }, true);
        }
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // File Attachment upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeNote) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      api.addAttachment({
        note_id: activeNote.id,
        name: file.name,
        url: base64,
        type: file.type,
        size: file.size,
      }).then(res => {
        if (res.success && res.note) {
          updateNoteContent(activeNote.id, { attachments: res.note.attachments }, true);
        }
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Delete attachment
  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!activeNote) return;
    const newAttachments = (activeNote.attachments || []).filter(a => a.id !== attachmentId);
    updateNoteContent(activeNote.id, { attachments: newAttachments }, true);
    await api.deleteAttachment(attachmentId);
  };

  // Text-To-Speech (Gemini TTS / Web Speech)
  const handleTTS = async () => {
    if (!activeNote) return;
    if (isPlayingTTS) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
      window.speechSynthesis?.cancel();
      setIsPlayingTTS(false);
      return;
    }

    const textToRead = `${activeNote.title}. ${editorRef.current?.innerText || activeNote.content_text || ''}`;
    if (!textToRead.trim()) return;

    setIsPlayingTTS(true);

    try {
      const res = await api.textToSpeech(textToRead);
      if (res.success && res.audioUrl) {
        const audio = new Audio(res.audioUrl);
        audioPlayerRef.current = audio;
        audio.onended = () => setIsPlayingTTS(false);
        audio.onerror = () => {
          fallbackBrowserSpeech(textToRead);
        };
        await audio.play();
      } else {
        fallbackBrowserSpeech(textToRead);
      }
    } catch (e) {
      fallbackBrowserSpeech(textToRead);
    }
  };

  const fallbackBrowserSpeech = (text: string) => {
    if (!window.speechSynthesis) {
      setIsPlayingTTS(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    // Find Tamil or Indian voice if available
    const voices = window.speechSynthesis.getVoices();
    const tamilVoice = voices.find(v => v.lang.includes('ta') || v.lang.includes('IN'));
    if (tamilVoice) utterance.voice = tamilVoice;
    utterance.rate = 0.95;
    utterance.onend = () => setIsPlayingTTS(false);
    utterance.onerror = () => setIsPlayingTTS(false);
    window.speechSynthesis.speak(utterance);
  };

  // Add tag to active note
  const handleAddTag = (tagName: string) => {
    if (!activeNote || !tagName.trim()) return;
    const cleanTag = tagName.trim().replace(/^#/, '');
    if (!activeNote.tags.includes(cleanTag)) {
      const newTags = [...activeNote.tags, cleanTag];
      updateNoteContent(activeNote.id, { tags: newTags }, true);
    }
    setNewTagInput('');
    setIsTagDropdownOpen(false);
  };

  const handleRemoveTag = (tagName: string) => {
    if (!activeNote) return;
    const newTags = activeNote.tags.filter(t => t !== tagName);
    updateNoteContent(activeNote.id, { tags: newTags }, true);
  };

  // Add checklist item
  const handleAddChecklist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeNote || !newChecklistText.trim()) return;
    addChecklistItem(activeNote.id, newChecklistText);
    setNewChecklistText('');
  };

  // Word count & read time calculation
  const textContent = editorRef.current?.innerText || activeNote?.content_text || '';
  const wordsCount = textContent.trim() ? textContent.trim().split(/\s+/).length : 0;
  const charsCount = textContent.length;
  const readTimeMin = Math.max(1, Math.ceil(wordsCount / 180));

  if (!activeNote) {
    return (
      <div className="flex-1 h-full flex flex-col items-center justify-center bg-[#f8fafc] dark:bg-[#0b1120] text-center p-8">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 shadow-sm">
          <FileText size={32} />
        </div>
        <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 mb-2">
          {t.noNotesTitle}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
          {t.noNotesDesc}
        </p>
      </div>
    );
  }

  const currentNotebook = notebooks.find(nb => nb.id === activeNote.notebook_id);

  return (
    <div
      className={`flex-1 h-full flex flex-col bg-[#f8fafc] dark:bg-[#0b1120] relative min-w-0 transition-all ${
        isFullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-slate-900' : ''
      }`}
    >
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={imageInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Top Action Bar */}
      <header className="h-14 px-4 sm:px-6 bg-white dark:bg-[#131d31] border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0 z-20">
        {/* Left: Breadcrumbs & Notebook Picker */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative">
            <button
              onClick={() => setIsNotebookDropdownOpen(!isNotebookDropdownOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors truncate max-w-[180px]"
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: currentNotebook?.color || '#10b981' }}
              />
              <span className="truncate">{currentNotebook ? currentNotebook.name : t.noNotebook}</span>
              <ChevronDown size={14} className="text-slate-400 shrink-0" />
            </button>

            {/* Notebook Select Dropdown */}
            {isNotebookDropdownOpen && (
              <div className="absolute left-0 top-full mt-1 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-1.5 z-30">
                <p className="px-3 py-1 text-[11px] font-semibold text-slate-400">{t.selectNotebook}</p>
                {notebooks.map(nb => (
                  <button
                    key={nb.id}
                    onClick={() => {
                      updateNoteContent(activeNote.id, { notebook_id: nb.id }, true);
                      setIsNotebookDropdownOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: nb.color }} />
                      <span className="truncate">{nb.name}</span>
                    </div>
                    {activeNote.notebook_id === nb.id && <Check size={14} className="text-emerald-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* AI Tools CTA */}
          <button
            onClick={() => setIsAIAssistantOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-semibold shadow-xs hover:opacity-95 transition-opacity"
          >
            <Sparkles size={14} />
            <span className="hidden sm:inline">{t.aiTools}</span>
          </button>

          {/* Voice Dictate */}
          <button
            onClick={() => setIsAudioDictateOpen(true)}
            title={t.audioTranscribe}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Mic size={17} />
          </button>

          {/* Text-to-Speech */}
          <button
            onClick={handleTTS}
            title={isPlayingTTS ? t.ttsPause : t.textToSpeech}
            className={`p-1.5 rounded-lg transition-colors ${
              isPlayingTTS
                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 animate-pulse'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {isPlayingTTS ? <VolumeX size={17} /> : <Volume2 size={17} />}
          </button>

          {/* Share */}
          <button
            onClick={() => setIsShareModalOpen(true)}
            title={t.shareNote}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Share2 size={17} />
          </button>

          {/* Workspace Hub */}
          <button
            onClick={() => setIsWorkspaceModalOpen(true)}
            title={t.workspace}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Download size={17} />
          </button>

          <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block" />

          {/* Favorite */}
          <button
            onClick={() => toggleFavorite(activeNote.id)}
            title={activeNote.is_favorite ? t.unstarNote : t.starNote}
            className={`p-1.5 rounded-lg transition-colors ${
              activeNote.is_favorite
                ? 'text-amber-400 fill-amber-400'
                : 'text-slate-400 hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Star size={17} className={activeNote.is_favorite ? 'fill-amber-400' : ''} />
          </button>

          {/* Pin */}
          <button
            onClick={() => togglePin(activeNote.id)}
            title={activeNote.pinned ? t.unpinNote : t.pinNote}
            className={`p-1.5 rounded-lg transition-colors ${
              activeNote.pinned
                ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40'
                : 'text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Pin size={17} />
          </button>

          {/* Archive */}
          <button
            onClick={() => toggleArchive(activeNote.id)}
            title={activeNote.is_archived ? t.unarchiveNote : t.archiveNote}
            className={`p-1.5 rounded-lg transition-colors ${
              activeNote.is_archived
                ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40'
                : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Archive size={17} />
          </button>

          {/* Delete / Trash */}
          <button
            onClick={() => deleteNote(activeNote.id)}
            title={t.deleteNote}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
          >
            <Trash2 size={17} />
          </button>

          {/* Fullscreen */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hidden md:block"
          >
            {isFullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
          </button>
        </div>
      </header>

      {/* Formatting Toolbar */}
      <div className="px-4 py-1.5 bg-white/80 dark:bg-[#131d31]/80 backdrop-blur-xs border-b border-slate-200/60 dark:border-slate-800/80 flex items-center gap-0.5 overflow-x-auto select-none no-scrollbar shrink-0">
        <ToolbarButton onClick={() => executeCommand('bold')} icon={<Bold size={15} />} title={t.bold} />
        <ToolbarButton onClick={() => executeCommand('italic')} icon={<Italic size={15} />} title={t.italic} />
        <ToolbarButton onClick={() => executeCommand('underline')} icon={<Underline size={15} />} title={t.underline} />
        <ToolbarButton onClick={() => executeCommand('strikeThrough')} icon={<Strikethrough size={15} />} title={t.strikethrough} />

        <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1 shrink-0" />

        <ToolbarButton onClick={() => executeCommand('formatBlock', '<h1>')} icon={<Heading1 size={15} />} title={t.heading1} />
        <ToolbarButton onClick={() => executeCommand('formatBlock', '<h2>')} icon={<Heading2 size={15} />} title={t.heading2} />
        <ToolbarButton onClick={() => executeCommand('formatBlock', '<h3>')} icon={<Heading3 size={15} />} title={t.heading3} />

        <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1 shrink-0" />

        <ToolbarButton onClick={() => executeCommand('insertUnorderedList')} icon={<List size={15} />} title={t.bulletList} />
        <ToolbarButton onClick={() => executeCommand('insertOrderedList')} icon={<ListOrdered size={15} />} title={t.numberList} />
        <ToolbarButton onClick={() => executeCommand('formatBlock', '<blockquote>')} icon={<Quote size={15} />} title={t.quote} />
        <ToolbarButton onClick={() => executeCommand('formatBlock', '<pre>')} icon={<Code size={15} />} title={t.codeBlock} />

        <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1 shrink-0" />

        <ToolbarButton onClick={handleInsertLink} icon={<Link size={15} />} title={t.insertLink} />
        <ToolbarButton onClick={() => imageInputRef.current?.click()} icon={<ImageIcon size={15} />} title={t.insertImage} />
        <ToolbarButton onClick={() => fileInputRef.current?.click()} icon={<Paperclip size={15} />} title={t.attachFile} />

        <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1 shrink-0" />

        <ToolbarButton onClick={() => executeCommand('undo')} icon={<RotateCcw size={15} />} title={t.undo} />
        <ToolbarButton onClick={() => executeCommand('redo')} icon={<RotateCw size={15} />} title={t.redo} />
      </div>

      {/* Main Canvas Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 md:px-16 py-6 flex justify-center">
        <div className="w-full max-w-[840px] flex flex-col min-h-full">
          {/* Note Title Input */}
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder={t.titlePlaceholder}
            className="w-full bg-transparent border-none outline-none font-bold text-2xl sm:text-3xl text-slate-900 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-600 mb-4 pb-2 border-b border-transparent focus:border-slate-200 dark:focus:border-slate-800 transition-colors"
          />

          {/* Interactive Checklist Section */}
          {activeNote.checklist && activeNote.checklist.length > 0 && (
            <div className="mb-6 bg-white dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200/80 dark:border-slate-700/60 shadow-2xs space-y-2">
              <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <CheckSquare size={14} className="text-emerald-600" />
                <span>{t.checklist}</span>
              </h4>

              <div className="space-y-1.5">
                {activeNote.checklist.map(item => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-2 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 group"
                  >
                    <label className="flex items-center gap-2.5 flex-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => toggleChecklistItem(activeNote.id, item.id)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-600 cursor-pointer"
                      />
                      <span
                        className={`text-sm ${
                          item.checked
                            ? 'line-through text-slate-400 dark:text-slate-500'
                            : 'text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        {item.text}
                      </span>
                    </label>
                    <button
                      onClick={() => removeChecklistItem(activeNote.id, item.id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 p-1 rounded transition-opacity"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add checklist item inline */}
              <form onSubmit={handleAddChecklist} className="flex items-center gap-2 pt-2">
                <input
                  type="text"
                  value={newChecklistText}
                  onChange={e => setNewChecklistText(e.target.value)}
                  placeholder={t.addChecklistItem}
                  className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  disabled={!newChecklistText.trim()}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors"
                >
                  {t.confirm}
                </button>
              </form>
            </div>
          )}

          {/* Quick checklist starter button if empty */}
          {(!activeNote.checklist || activeNote.checklist.length === 0) && (
            <button
              onClick={() => addChecklistItem(activeNote.id, 'முதல் பணி (First Task)')}
              className="self-start mb-4 text-xs text-slate-500 dark:text-slate-400 hover:text-emerald-600 flex items-center gap-1 px-2.5 py-1 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 transition-colors"
            >
              <Plus size={14} />
              <span>{t.newChecklist}</span>
            </button>
          )}

          {/* Rich Contenteditable Editor */}
          <div
            ref={editorRef}
            contentEditable
            onInput={handleEditorInput}
            data-placeholder={t.contentPlaceholder}
            className="editor-content flex-1 outline-none text-base text-slate-800 dark:text-slate-200 leading-relaxed font-normal min-h-[300px]"
          />

          {/* Attachments Section */}
          {activeNote.attachments && activeNote.attachments.length > 0 && (
            <div className="mt-8 pt-4 border-t border-slate-200/80 dark:border-slate-800">
              <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Paperclip size={14} />
                <span>இணைக்கப்பட்ட கோப்புகள் ({activeNote.attachments.length})</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activeNote.attachments.map(att => (
                  <div
                    key={att.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      {att.type.startsWith('image/') ? (
                        <img src={att.url} alt={att.name} className="w-9 h-9 rounded object-cover" />
                      ) : (
                        <div className="w-9 h-9 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
                          <Paperclip size={16} />
                        </div>
                      )}
                      <div className="truncate">
                        <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">{att.name}</p>
                        <p className="text-[10px] text-slate-400">{(att.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <a
                        href={att.url}
                        download={att.name}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 text-slate-400 hover:text-emerald-600 transition-colors"
                      >
                        <Download size={15} />
                      </a>
                      <button
                        onClick={() => handleDeleteAttachment(att.id)}
                        className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags Chips Bar at Bottom */}
          <div className="mt-8 pt-4 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center gap-2 flex-wrap">
            <TagIcon size={14} className="text-slate-400 shrink-0" />

            {activeNote.tags.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-medium border border-emerald-200/60 dark:border-emerald-800/40"
              >
                #{tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-red-500 rounded-full"
                >
                  <X size={12} />
                </button>
              </span>
            ))}

            {/* Add Tag Dropdown / Input */}
            <div className="relative">
              <button
                onClick={() => setIsTagDropdownOpen(!isTagDropdownOpen)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors border border-dashed border-slate-300 dark:border-slate-700"
              >
                <Plus size={12} />
                <span>{t.addTagsPlaceholder}</span>
              </button>

              {isTagDropdownOpen && (
                <div className="absolute left-0 bottom-full mb-1 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-2 z-30 space-y-1">
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={newTagInput}
                      onChange={e => setNewTagInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag(newTagInput);
                        }
                      }}
                      placeholder="Tag name..."
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1 text-xs text-slate-800 dark:text-slate-100 outline-none"
                    />
                    <button
                      onClick={() => handleAddTag(newTagInput)}
                      className="p-1 bg-emerald-600 text-white rounded-md text-xs"
                    >
                      <Plus size={13} />
                    </button>
                  </div>

                  <div className="max-h-32 overflow-y-auto pt-1 space-y-0.5">
                    {tags
                      .filter(t => !activeNote.tags.includes(t.name))
                      .map(t => (
                        <button
                          key={t.id}
                          onClick={() => handleAddTag(t.name)}
                          className="w-full text-left px-2 py-1 text-xs text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-slate-700 rounded"
                        >
                          #{t.name}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Editor Footer / Auto-Save Status Bar */}
      <footer className="h-10 px-6 bg-white dark:bg-[#131d31] border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 shrink-0 select-none">
        {/* Sync Status Badge */}
        <div className="flex items-center gap-2">
          {syncStatus === 'saving' && (
            <>
              <CloudUpload size={15} className="text-amber-500 animate-pulse" />
              <span className="text-amber-600 dark:text-amber-400">{t.saving}</span>
            </>
          )}
          {syncStatus === 'saved' && (
            <>
              <CloudCheck size={15} className="text-emerald-600" />
              <span className="text-slate-600 dark:text-slate-400">{t.savedJustNow}</span>
            </>
          )}
          {syncStatus === 'offline' && (
            <>
              <CloudOff size={15} className="text-orange-500" />
              <span className="text-orange-600 dark:text-orange-400">{t.offlineSaved}</span>
            </>
          )}
          {syncStatus === 'syncing' && (
            <>
              <CloudUpload size={15} className="text-blue-500 animate-spin" />
              <span className="text-blue-600 dark:text-blue-400">{t.syncing}</span>
            </>
          )}
        </div>

        {/* Word / Char Count */}
        <div className="flex items-center gap-3">
          <span>{wordsCount} {t.words}</span>
          <span>•</span>
          <span>{charsCount} {t.characters}</span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">{readTimeMin} {t.minute} {t.readTime}</span>
        </div>
      </footer>
    </div>
  );
};

interface ToolbarButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  active?: boolean;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({ onClick, icon, title, active }) => {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 ${
        active ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700' : ''
      }`}
    >
      {icon}
    </button>
  );
};

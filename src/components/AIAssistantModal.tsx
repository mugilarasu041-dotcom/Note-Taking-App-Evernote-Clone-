import React, { useState } from 'react';
import {
  Sparkles,
  X,
  FileText,
  ListOrdered,
  CheckCircle2,
  BookOpen,
  Brain,
  Globe,
  Languages,
  Send,
  Copy,
  Check,
  CornerDownLeft,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { useNotes } from '../context/NotesContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';

export const AIAssistantModal: React.FC = () => {
  const {
    activeNote,
    isAIAssistantOpen,
    setIsAIAssistantOpen,
    updateNoteContent,
  } = useNotes();

  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'tools' | 'chat'>('tools');
  const [loading, setLoading] = useState(false);
  const [resultText, setResultText] = useState('');
  const [resultSources, setResultSources] = useState<{ title: string; url: string }[] | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [copied, setCopied] = useState(false);
  const [modelUsed, setModelUsed] = useState<string>('gemini-3.5-flash');

  // Chat State
  const [chatMessages, setChatMessages] = useState<{ role: string; content: string }[]>([
    {
      role: 'assistant',
      content:
        language === 'ta'
          ? 'வணக்கம்! நான் உங்கள் பசுமை குறிப்பு உதவியாளர் (Gemini Copilot). குறிப்புகளை சுருக்க, யோசனைகளை உருவாக்க, மொழிபெயர்க்க அல்லது கேள்விகளுக்கு பதிலளிக்க நான் தயாராக உள்ளேன்.'
          : 'Hello! I am your Pasumai Note Assistant (Gemini Copilot). Ask me to summarize, analyze, translate, or brainstorm ideas based on your notes.',
    },
  ]);
  const [chatInput, setChatInput] = useState('');

  if (!isAIAssistantOpen) return null;

  const handleRunTool = async (action: string) => {
    setLoading(true);
    setResultText('');
    setResultSources(null);

    const content = activeNote?.content_text || activeNote?.content || '';
    const title = activeNote?.title || '';

    try {
      const res = await api.enhanceNote({
        action,
        content,
        title,
        customPrompt,
        language,
      });

      if (res.success) {
        setResultText(res.text);
        if (res.sources) setResultSources(res.sources);
        if (res.model) setModelUsed(res.model);
      }
    } catch (e: any) {
      setResultText(`பிழை ஏற்பட்டது: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || loading) return;

    const userMsg = { role: 'user', content: chatInput.trim() };
    const newMessages = [...chatMessages, userMsg];
    setChatMessages(newMessages);
    setChatInput('');
    setLoading(true);

    try {
      const noteContext = activeNote ? `Title: ${activeNote.title}\nContent: ${activeNote.content_text || activeNote.content}` : undefined;
      const res = await api.chatAI(newMessages, noteContext);
      if (res.success) {
        setChatMessages([...newMessages, { role: 'assistant', content: res.text }]);
      }
    } catch (e: any) {
      setChatMessages([...newMessages, { role: 'assistant', content: `மன்னிக்கவும், பிழை: ${e.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleAppendToNote = () => {
    if (!activeNote || !resultText) return;
    const formattedAppend = `<div style="margin-top: 1rem; padding: 1rem; background-color: rgba(16,185,129,0.06); border-left: 4px solid #10b981; border-radius: 0 0.5rem 0.5rem 0;">${resultText.replace(/\n/g, '<br/>')}</div>`;
    const newContent = `${activeNote.content || ''}${formattedAppend}`;
    updateNoteContent(activeNote.id, { content: newContent }, true);
    setIsAIAssistantOpen(false);
  };

  const handleReplaceContent = () => {
    if (!activeNote || !resultText) return;
    const formatted = `<div>${resultText.replace(/\n/g, '<br/>')}</div>`;
    updateNoteContent(activeNote.id, { content: formatted, content_text: resultText }, true);
    setIsAIAssistantOpen(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(resultText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#131d31] w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/15">
              <Sparkles size={20} className="animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-base">{t.aiTitle}</h3>
              <p className="text-xs text-emerald-100">Powered by Gemini 3.7 Flash</p>
            </div>
          </div>

          <button
            onClick={() => setIsAIAssistantOpen(false)}
            className="p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-6">
          <button
            onClick={() => setActiveTab('tools')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'tools'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.aiTools}
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'chat'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            AI Copilot Chat
          </button>
        </div>

        {/* Tab 1: AI Tools */}
        {activeTab === 'tools' ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Quick Action Grid */}
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">
                விரைவு AI கருவிகள் (Quick Actions)
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <ToolButton
                  icon={<FileText size={15} />}
                  label={t.aiSummarize}
                  onClick={() => handleRunTool('summarize')}
                />
                <ToolButton
                  icon={<ListOrdered size={15} />}
                  label={t.aiKeyTakeaways}
                  onClick={() => handleRunTool('key_takeaways')}
                />
                <ToolButton
                  icon={<CheckCircle2 size={15} />}
                  label={t.aiActionItems}
                  onClick={() => handleRunTool('action_items')}
                />
                <ToolButton
                  icon={<BookOpen size={15} />}
                  label={t.aiTamilPoetic}
                  onClick={() => handleRunTool('poetic_tamil')}
                />
                <ToolButton
                  icon={<Brain size={15} className="text-purple-600" />}
                  label={t.aiDeepThink}
                  badge="High"
                  onClick={() => handleRunTool('deep_think')}
                />
                <ToolButton
                  icon={<Globe size={15} className="text-blue-600" />}
                  label={t.aiSearchGrounding}
                  badge="Google"
                  onClick={() => handleRunTool('search_grounding')}
                />
                <ToolButton
                  icon={<Languages size={15} />}
                  label={t.aiTranslate}
                  onClick={() => handleRunTool('translate')}
                />
              </div>
            </div>

            {/* Custom Instruction Prompt */}
            <div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customPrompt}
                  onChange={e => setCustomPrompt(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleRunTool('custom');
                  }}
                  placeholder={t.aiPromptPlaceholder}
                  className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-500"
                />
                <button
                  onClick={() => handleRunTool('custom')}
                  disabled={loading || !customPrompt.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <span>செயல்படுத்து</span>
                  <CornerDownLeft size={13} />
                </button>
              </div>
            </div>

            {/* Result Display Canvas */}
            {loading ? (
              <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-center">
                <RefreshCw size={24} className="text-emerald-600 animate-spin mb-3" />
                <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">{t.aiThinking}</p>
                <p className="text-[11px] text-slate-400">Gemini model processing content...</p>
              </div>
            ) : resultText ? (
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                      முடிவு (Output)
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700">
                      {modelUsed}
                    </span>
                  </div>

                  <button
                    onClick={handleCopy}
                    className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                    title={t.copyText}
                  >
                    {copied ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
                  </button>
                </div>

                <div className="text-xs text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                  {resultText}
                </div>

                {/* Grounding Citations Sources if available */}
                {resultSources && resultSources.length > 0 && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1">
                    <p className="text-[11px] font-semibold text-slate-500">ஆதாரங்கள் (Google Search Sources):</p>
                    <div className="flex flex-wrap gap-1.5">
                      {resultSources.map((src, i) => (
                        <a
                          key={i}
                          href={src.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800/40 hover:underline"
                        >
                          <span>{src.title}</span>
                          <ExternalLink size={10} />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                {activeNote && (
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <button
                      onClick={handleAppendToNote}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors"
                    >
                      {t.applyToNote}
                    </button>
                    <button
                      onClick={handleReplaceContent}
                      className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-medium transition-colors"
                    >
                      {t.replaceContent}
                    </button>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        ) : (
          /* Tab 2: AI Multi-turn Chat */
          <div className="flex-1 flex flex-col h-[400px]">
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-emerald-600 text-white rounded-br-none'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-none'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-3 text-xs text-slate-500 animate-pulse">
                    AI பதிலளிக்கிறது...
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSendChat} className="p-3 border-t border-slate-200/80 dark:border-slate-800 flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="Ask about this note or brainstorm ideas..."
                className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={loading || !chatInput.trim()}
                className="p-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl transition-colors"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

interface ToolButtonProps {
  icon: React.ReactNode;
  label: string;
  badge?: string;
  onClick: () => void;
}

const ToolButton: React.FC<ToolButtonProps> = ({ icon, label, badge, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 hover:border-emerald-400 text-left transition-all flex items-center justify-between group"
    >
      <div className="flex items-center gap-2 truncate">
        <span className="text-slate-500 dark:text-slate-400 group-hover:text-emerald-600 transition-colors">
          {icon}
        </span>
        <span className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">{label}</span>
      </div>
      {badge && (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
          {badge}
        </span>
      )}
    </button>
  );
};

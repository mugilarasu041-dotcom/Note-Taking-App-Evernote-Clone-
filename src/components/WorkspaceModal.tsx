import React, { useState, useEffect } from 'react';
import {
  Cloud,
  Calendar,
  FileText,
  Users,
  X,
  ExternalLink,
  CheckCircle2,
  Sparkles,
  Download,
  Clock,
} from 'lucide-react';
import { useNotes } from '../context/NotesContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';

export const WorkspaceModal: React.FC = () => {
  const { isWorkspaceModalOpen, setIsWorkspaceModalOpen, activeNote } = useNotes();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<'drive' | 'calendar' | 'docs' | 'contacts'>('drive');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [contacts, setContacts] = useState<any[]>([]);

  // Calendar form
  const [calTitle, setCalTitle] = useState('');
  const [calDate, setCalDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (activeNote) {
      setCalTitle(activeNote.title);
    }
  }, [activeNote]);

  useEffect(() => {
    if (isWorkspaceModalOpen) {
      api.getContacts().then(res => {
        if (res.success) setContacts(res.contacts);
      });
    }
  }, [isWorkspaceModalOpen]);

  const handleExportToDrive = async () => {
    if (!activeNote) return;
    setLoading(true);
    setStatusMessage(null);
    try {
      const res = await api.exportToDrive(activeNote.id);
      if (res.success) {
        setStatusMessage({ type: 'success', text: res.message });
      }
    } catch (e: any) {
      setStatusMessage({ type: 'error', text: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCalendarEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(null);
    try {
      const res = await api.createCalendarReminder({
        title: calTitle,
        start_time: calDate,
        description: activeNote?.content_text,
      });
      if (res.success) {
        setStatusMessage({ type: 'success', text: res.message });
      }
    } catch (e: any) {
      setStatusMessage({ type: 'error', text: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleExportToDocs = async () => {
    if (!activeNote) return;
    setLoading(true);
    setStatusMessage(null);
    try {
      const res = await api.exportToDocs(activeNote.id);
      if (res.success) {
        setStatusMessage({ type: 'success', text: res.message });
      }
    } catch (e: any) {
      setStatusMessage({ type: 'error', text: e.message });
    } finally {
      setLoading(false);
    }
  };

  if (!isWorkspaceModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#131d31] w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Cloud size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                {t.workspace} (Google Workspace Hub)
              </h3>
              <p className="text-xs text-slate-500">Drive, Calendar, Docs & Contacts</p>
            </div>
          </div>

          <button
            onClick={() => {
              setIsWorkspaceModalOpen(false);
              setStatusMessage(null);
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 px-6">
          <TabButton
            active={activeTab === 'drive'}
            onClick={() => setActiveTab('drive')}
            icon={<Cloud size={15} />}
            label="Google Drive"
          />
          <TabButton
            active={activeTab === 'calendar'}
            onClick={() => setActiveTab('calendar')}
            icon={<Calendar size={15} />}
            label="Calendar"
          />
          <TabButton
            active={activeTab === 'docs'}
            onClick={() => setActiveTab('docs')}
            icon={<FileText size={15} />}
            label="Google Docs"
          />
          <TabButton
            active={activeTab === 'contacts'}
            onClick={() => setActiveTab('contacts')}
            icon={<Users size={15} />}
            label="Contacts"
          />
        </div>

        {/* Status alert message */}
        {statusMessage && (
          <div
            className={`mx-6 mt-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60'
                : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200/60'
            }`}
          >
            <CheckCircle2 size={16} />
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Tab Contents */}
        <div className="p-6">
          {activeTab === 'drive' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <h4 className="font-semibold text-xs text-slate-800 dark:text-slate-200 mb-1">
                  கூகிள் டிரைவில் காப்புப்பிரதி (Google Drive Backup)
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  நடப்பு குறிப்பை "{activeNote?.title || 'குறிப்பு'}" கூகிள் டிரைவில் தானாக சேமிக்கவும்.
                </p>
                <button
                  onClick={handleExportToDrive}
                  disabled={loading || !activeNote}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors"
                >
                  <Download size={15} />
                  <span>{loading ? 'சேமிக்கப்படுகிறது...' : t.backupToGoogleDrive}</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'calendar' && (
            <form onSubmit={handleCreateCalendarEvent} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  நிகழ்வு தலைப்பு (Event Title)
                </label>
                <input
                  type="text"
                  value={calTitle}
                  onChange={e => setCalTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  தேதி & நேரம் (Date)
                </label>
                <input
                  type="date"
                  value={calDate}
                  onChange={e => setCalDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !calTitle.trim()}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <Calendar size={15} />
                <span>{loading ? 'சேர்க்கப்படுகிறது...' : t.addToGoogleCalendar}</span>
              </button>
            </form>
          )}

          {activeTab === 'docs' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <h4 className="font-semibold text-xs text-slate-800 dark:text-slate-200 mb-1">
                  Google Docs ஏற்றுமதி
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  குறிப்பின் வடிவமைப்பு, புல்லட்கள் மற்றும் படங்களுடன் Google Docs ஆவணமாக மாற்றி பகிருங்கள்.
                </p>
                <button
                  onClick={handleExportToDocs}
                  disabled={loading || !activeNote}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors"
                >
                  <FileText size={15} />
                  <span>{loading ? 'ஏற்றுமதியாகிறது...' : t.exportToGoogleDocs}</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'contacts' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                கூகிள் தொடர்புகள் பட்டியல் (Google Contacts):
              </p>
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {contacts.map(c => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <img src={c.avatar} alt={c.name} className="w-8 h-8 rounded-full object-cover" />
                      <div className="truncate">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{c.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{c.email}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

const TabButton: React.FC<TabButtonProps> = ({ active, onClick, icon, label }) => {
  return (
    <button
      onClick={onClick}
      className={`py-3 px-3.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
        active
          ? 'border-blue-600 text-blue-600 dark:text-blue-400'
          : 'border-transparent text-slate-500 hover:text-slate-700'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
};

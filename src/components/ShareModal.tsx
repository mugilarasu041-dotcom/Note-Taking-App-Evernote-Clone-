import React, { useState, useEffect } from 'react';
import { Share2, X, Copy, Check, Users, Shield, UserPlus } from 'lucide-react';
import { useNotes } from '../context/NotesContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';

export const ShareModal: React.FC = () => {
  const { activeNote, isShareModalOpen, setIsShareModalOpen, updateNoteContent } = useNotes();
  const { t } = useLanguage();

  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<'viewer' | 'editor'>('viewer');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [showContactsPicker, setShowContactsPicker] = useState(false);

  useEffect(() => {
    if (isShareModalOpen) {
      api.getContacts().then(res => {
        if (res.success) setContacts(res.contacts);
      });
    }
  }, [isShareModalOpen]);

  if (!isShareModalOpen || !activeNote) return null;

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || loading) return;

    setLoading(true);
    try {
      const res = await api.shareNote(activeNote.id, email.trim(), permission);
      if (res.success && res.note?.shared_with) {
        updateNoteContent(activeNote.id, { shared_with: res.note.shared_with }, true);
        setEmail('');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/#note=${activeNote.id}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePickContact = (contactEmail: string) => {
    setEmail(contactEmail);
    setShowContactsPicker(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#131d31] w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col animate-in fade-in zoom-in-95 duration-150 relative">
        <button
          onClick={() => setIsShareModalOpen(false)}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
            <Share2 size={20} />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">{t.shareTitle}</h3>
            <p className="text-xs text-slate-500 truncate max-w-[260px]">"{activeNote.title}"</p>
          </div>
        </div>

        {/* Share Form */}
        <form onSubmit={handleShare} className="space-y-3 mb-5">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t.shareWithEmail}
              </label>
              {contacts.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowContactsPicker(!showContactsPicker)}
                  className="text-[11px] font-semibold text-emerald-600 hover:underline flex items-center gap-1"
                >
                  <Users size={12} />
                  <span>{t.pickContact}</span>
                </button>
              )}
            </div>

            {/* Contacts dropdown picker */}
            {showContactsPicker && (
              <div className="mb-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1 max-h-36 overflow-y-auto">
                {contacts.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handlePickContact(c.email)}
                    className="w-full text-left p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-2 text-xs"
                  >
                    <img src={c.avatar} alt="" className="w-5 h-5 rounded-full" />
                    <span className="font-medium text-slate-700 dark:text-slate-200">{c.name}</span>
                    <span className="text-slate-400 text-[10px]">({c.email})</span>
                  </button>
                ))}
              </div>
            )}

            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center justify-between gap-2">
            <select
              value={permission}
              onChange={e => setPermission(e.target.value as any)}
              className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-300 outline-none"
            >
              <option value="viewer">{t.canView}</option>
              <option value="editor">{t.canEdit}</option>
            </select>

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <UserPlus size={14} />
              <span>{t.addPerson}</span>
            </button>
          </div>
        </form>

        {/* Shared Users List */}
        {activeNote.shared_with && activeNote.shared_with.length > 0 && (
          <div className="mb-5 space-y-2">
            <p className="text-xs font-semibold text-slate-500">{t.sharedWith}:</p>
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {activeNote.shared_with.map(s => (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                >
                  <span className="text-slate-700 dark:text-slate-200 truncate">{s.email}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    {s.permission === 'editor' ? 'Editor' : 'Viewer'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Copy Public Link Bar */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            onClick={handleCopyLink}
            className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
            <span>{copied ? t.linkCopied : t.copyLink}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

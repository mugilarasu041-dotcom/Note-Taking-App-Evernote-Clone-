import React, { useState } from 'react';
import {
  Settings,
  X,
  Sun,
  Moon,
  Laptop,
  Languages,
  Type,
  Clock,
  Download,
  Upload,
  User,
  Check,
  Save,
} from 'lucide-react';
import { useNotes } from '../context/NotesContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const SettingsModal: React.FC = () => {
  const { isSettingsModalOpen, setIsSettingsModalOpen, refreshAll } = useNotes();
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { user, updateUserProfile } = useAuth();

  const [activeTab, setActiveTab] = useState<'appearance' | 'account' | 'data'>('appearance');
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [autoSaveInterval, setAutoSaveInterval] = useState(user?.autoSaveInterval || 2);
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>(user?.fontSize || 'medium');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isSettingsModalOpen) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateUserProfile({
      name,
      email,
      avatar,
      autoSaveInterval,
      fontSize,
      language,
      theme,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleExportJSON = async () => {
    const data = await api.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pasumai_notes_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const json = JSON.parse(reader.result as string);
        const res = await api.importData(json);
        if (res.success) {
          alert('தரவு வெற்றிகரமாக இறக்குமதி செய்யப்பட்டது!');
          await refreshAll();
          setIsSettingsModalOpen(false);
        }
      } catch (err) {
        alert('Invalid JSON file format.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#131d31] w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150 relative">
        <button
          onClick={() => setIsSettingsModalOpen(false)}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
            <Settings size={20} />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">{t.settings}</h3>
            <p className="text-xs text-slate-500">{t.appName} Preferences</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 px-6">
          <button
            onClick={() => setActiveTab('appearance')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'appearance'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.theme} & {t.language}
          </button>
          <button
            onClick={() => setActiveTab('account')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'account'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.accountProfile}
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'data'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.dataManagement}
          </button>
        </div>

        {/* Tab 1: Appearance */}
        <div className="p-6 flex-1 overflow-y-auto space-y-5">
          {activeTab === 'appearance' && (
            <>
              {/* Theme Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  {t.theme}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <ThemeOption
                    active={theme === 'light'}
                    icon={<Sun size={16} />}
                    label={t.lightTheme}
                    onClick={() => setTheme('light')}
                  />
                  <ThemeOption
                    active={theme === 'dark'}
                    icon={<Moon size={16} />}
                    label={t.darkTheme}
                    onClick={() => setTheme('dark')}
                  />
                  <ThemeOption
                    active={theme === 'system'}
                    icon={<Laptop size={16} />}
                    label={t.systemTheme}
                    onClick={() => setTheme('system')}
                  />
                </div>
              </div>

              {/* Language Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  {t.language}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setLanguage('ta')}
                    className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs font-semibold transition-all ${
                      language === 'ta'
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Languages size={16} />
                    <span>தமிழ் (Tamil)</span>
                  </button>
                  <button
                    onClick={() => setLanguage('en')}
                    className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs font-semibold transition-all ${
                      language === 'en'
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Languages size={16} />
                    <span>English</span>
                  </button>
                </div>
              </div>

              {/* Font Size */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  {t.fontSize}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['small', 'medium', 'large'] as const).map(size => (
                    <button
                      key={size}
                      onClick={() => setFontSize(size)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold capitalize transition-all ${
                        fontSize === size
                          ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {size === 'small' ? t.fontSmall : size === 'medium' ? t.fontMedium : t.fontLarge}
                    </button>
                  ))}
                </div>
              </div>

              {/* Auto-save timer */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.autoSaveTime} ({autoSaveInterval} {t.seconds || 'வினாடிகள்'})
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={autoSaveInterval}
                  onChange={e => setAutoSaveInterval(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>
            </>
          )}

          {activeTab === 'account' && (
            <form onSubmit={handleSaveProfile} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.userName}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.userEmail}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  சுயவிவரப் படம் URL (Avatar Image URL)
                </label>
                <input
                  type="url"
                  value={avatar}
                  onChange={e => setAvatar(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <Save size={16} />
                <span>{savedSuccess ? t.settingsSaved : t.saveSettings}</span>
              </button>
            </form>
          )}

          {activeTab === 'data' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <h4 className="font-semibold text-xs text-slate-800 dark:text-slate-200 mb-1">
                  {t.exportAllData}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  உங்கள் அனைத்து குறிப்புகள், குறிப்பேடுகள் மற்றும் குறிச்சொற்களை JSON கோப்பாக பதிவிறக்கம் செய்யுங்கள்.
                </p>
                <button
                  onClick={handleExportJSON}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors"
                >
                  <Download size={15} />
                  <span>ஏற்றுமதி செய் (Download Backup)</span>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <h4 className="font-semibold text-xs text-slate-800 dark:text-slate-200 mb-1">
                  {t.importData}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  முன்பு ஏற்றுமதி செய்த JSON காப்புப்பிரதி கோப்பை பதிவேற்றுங்கள்.
                </p>
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors">
                  <Upload size={15} />
                  <span>கோப்பைத் தேர்வுசெய்க</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportJSON}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface ThemeOptionProps {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

const ThemeOption: React.FC<ThemeOptionProps> = ({ active, icon, label, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-semibold transition-all ${
        active
          ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 shadow-2xs'
          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50'
      }`}
    >
      <span>{icon}</span>
      <span className="truncate">{label}</span>
    </button>
  );
};

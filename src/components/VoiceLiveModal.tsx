import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, X, Sparkles, Volume2, Radio, MessageSquare, Check, RefreshCw } from 'lucide-react';
import { useNotes } from '../context/NotesContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';

export const VoiceLiveModal: React.FC = () => {
  const { isVoiceLiveOpen, setIsVoiceLiveOpen, activeNote, createNote } = useNotes();
  const { t, language } = useLanguage();

  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState<{ sender: 'user' | 'gemini'; text: string }[]>([
    {
      sender: 'gemini',
      text:
        language === 'ta'
          ? 'வணக்கம்! நேரலை குரல் உரையாடல் இணைக்கப்பட்டுள்ளது (Gemini 3.1 Flash Live). நீங்கள் பேசலாம், நான் பதிலளிப்பேன்.'
          : 'Hello! Live Voice is connected (Gemini 3.1 Flash Live). Speak freely and I will converse and take voice notes for you.',
    },
  ]);
  const [currentSpeech, setCurrentSpeech] = useState('');

  useEffect(() => {
    if (!isVoiceLiveOpen) {
      setIsLiveConnected(false);
      setIsListening(false);
      window.speechSynthesis?.cancel();
    } else {
      setIsLiveConnected(true);
      setIsListening(true);
    }
  }, [isVoiceLiveOpen]);

  const speakText = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const tamilVoice = voices.find(v => v.lang.includes('ta') || v.lang.includes('IN'));
    if (tamilVoice) utterance.voice = tamilVoice;
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  const handleSimulatedLiveInput = async (spokenText: string) => {
    if (!spokenText.trim()) return;
    setLiveTranscript(prev => [...prev, { sender: 'user', text: spokenText }]);
    setCurrentSpeech('');

    try {
      const res = await api.chatAI([
        { role: 'user', content: spokenText }
      ], activeNote ? `Context note: ${activeNote.title}\n${activeNote.content_text}` : undefined);

      if (res.success && res.text) {
        setLiveTranscript(prev => [...prev, { sender: 'gemini', text: res.text }]);
        speakText(res.text);
      }
    } catch (e: any) {
      console.error(e);
    }
  };

  const handleSaveConversationAsNote = () => {
    const convoText = liveTranscript
      .map(item => `<p><strong>${item.sender === 'user' ? 'நீங்கள்' : 'Gemini AI'}:</strong> ${item.text}</p>`)
      .join('');

    createNote({
      title: `குரல் உரையாடல் குறிப்பு (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
      content: convoText,
    });
    setIsVoiceLiveOpen(false);
  };

  if (!isVoiceLiveOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#131d31] w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200 relative">
        <button
          onClick={() => setIsVoiceLiveOpen(false)}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X size={20} />
        </button>

        {/* Live Indicator Header */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold mb-6">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>Gemini 3.1 Flash Live Preview</span>
        </div>

        {/* Pulsing Voice Avatar Sphere */}
        <div className="relative mb-6">
          <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-emerald-600 via-teal-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-emerald-500/25 animate-pulse">
            <Radio size={40} className="text-white" />
          </div>
          <div className="absolute -inset-3 rounded-full border-2 border-emerald-500/20 animate-ping pointer-events-none" />
        </div>

        <h3 className="font-bold text-xl text-slate-900 dark:text-slate-100 mb-1">
          {t.liveAssistant}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-6">
          {t.liveAssistantDesc}
        </p>

        {/* Live Conversation Transcript Stream */}
        <div className="w-full h-44 bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-800 text-left overflow-y-auto space-y-2 text-xs mb-5">
          {liveTranscript.map((msg, i) => (
            <div
              key={i}
              className={`p-2.5 rounded-xl ${
                msg.sender === 'user'
                  ? 'bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 ml-6'
                  : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 mr-6 shadow-2xs'
              }`}
            >
              <span className="font-semibold block text-[10px] text-slate-400 mb-0.5">
                {msg.sender === 'user' ? 'நீங்கள் (You)' : 'Gemini Live'}
              </span>
              <span>{msg.text}</span>
            </div>
          ))}
        </div>

        {/* Quick Sample Voice Prompts */}
        <div className="flex flex-wrap gap-1.5 justify-center mb-5">
          <button
            onClick={() => handleSimulatedLiveInput('இந்த குறிப்பின் முக்கிய குறிப்புகளை விவரி')}
            className="px-2.5 py-1 rounded-full text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 hover:text-emerald-700"
          >
            "முக்கிய குறிப்புகளை விவரி"
          </button>
          <button
            onClick={() => handleSimulatedLiveInput('இன்றைய கூட்டத்திற்கான 3 செயல் திட்டங்களை கொடு')}
            className="px-2.5 py-1 rounded-full text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 hover:text-emerald-700"
          >
            "3 செயல் திட்டங்களை கொடு"
          </button>
        </div>

        {/* Action Controls */}
        <div className="w-full flex items-center gap-3">
          <button
            onClick={handleSaveConversationAsNote}
            className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs"
          >
            <Check size={16} />
            <span>உரையாடலை குறிப்பாக சேமி (Save to Note)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

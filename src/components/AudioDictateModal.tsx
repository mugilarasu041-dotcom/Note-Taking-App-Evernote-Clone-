import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, X, RefreshCw, Check, Sparkles, AlertCircle } from 'lucide-react';
import { useNotes } from '../context/NotesContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';

export const AudioDictateModal: React.FC = () => {
  const {
    activeNote,
    isAudioDictateOpen,
    setIsAudioDictateOpen,
    updateNoteContent,
    createNote,
  } = useNotes();

  const { t } = useLanguage();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [transcribing, setTranscribing] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    if (!isAudioDictateOpen) {
      stopRecording();
      setTranscribedText('');
      setError(null);
    }
  }, [isAudioDictateOpen]);

  // Start audio recording
  const startRecording = async () => {
    setError(null);
    setTranscribedText('');
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      // Setup Web Audio Analyser for visualizer
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      drawWaveform();

      mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await handleAudioProcess(audioBlob);
        // Stop stream tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Microphone error:', err);
      setError('மைக்ரோஃபோன் அணுகல் அனுமதி கிடைக்கவில்லை (Microphone permission denied).');
    }
  };

  // Stop audio recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (audioContextRef.current) audioContextRef.current.close();
    setIsRecording(false);
  };

  // Waveform Visualizer
  const drawWaveform = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animationFrameRef.current = requestAnimationFrame(render);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = (canvas.width / bufferLength) * 2;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.85;
        ctx.fillStyle = '#10b981';
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
        x += barWidth;
      }
    };

    render();
  };

  // Send audio to Gemini 3.5 Flash for speech-to-text
  const handleAudioProcess = async (blob: Blob) => {
    setTranscribing(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;
        const res = await api.transcribeAudio(base64Audio, blob.type);
        if (res.success && res.text) {
          setTranscribedText(res.text);
        } else {
          setError(res.error || 'குரலை எழுத்தாக்க முடியவில்லை.');
        }
        setTranscribing(false);
      };
      reader.readAsDataURL(blob);
    } catch (e: any) {
      setError(e.message);
      setTranscribing(false);
    }
  };

  // Insert to note
  const handleApplyToCurrentNote = () => {
    if (!transcribedText) return;
    if (activeNote) {
      const formatted = `<p>${transcribedText.replace(/\n/g, '<br/>')}</p>`;
      const newContent = `${activeNote.content || ''}${formatted}`;
      updateNoteContent(activeNote.id, { content: newContent }, true);
    } else {
      createNote({
        title: `குரல் குறிப்பு (${new Date().toLocaleDateString()})`,
        content: `<p>${transcribedText.replace(/\n/g, '<br/>')}</p>`,
      });
    }
    setIsAudioDictateOpen(false);
  };

  // Format seconds
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isAudioDictateOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#131d31] w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-150 relative">
        <button
          onClick={() => setIsAudioDictateOpen(false)}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
        >
          <X size={18} />
        </button>

        <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
          <Mic size={28} className={isRecording ? 'animate-bounce' : ''} />
        </div>

        <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-1">
          {t.audioTranscribe}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
          {t.speakInTamilOrEnglish}
        </p>

        {/* Audio Wave Visualizer Canvas */}
        <div className="w-full h-16 bg-slate-100 dark:bg-slate-900 rounded-xl mb-4 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-800 relative">
          <canvas ref={canvasRef} width={300} height={60} className="w-full h-full" />
          {!isRecording && !transcribing && (
            <span className="text-xs text-slate-400 absolute">
              மைக்ரோஃபோனைத் தொடங்க கீழே அழுத்தவும்
            </span>
          )}
        </div>

        {/* Recording Timer */}
        {isRecording && (
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <span className="font-mono text-sm font-semibold text-red-600 dark:text-red-400">
              {formatTime(recordingDuration)}
            </span>
          </div>
        )}

        {/* Record Control Button */}
        <div className="mb-4">
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-2xl font-semibold text-xs flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all"
            >
              <Mic size={16} />
              <span>பதிவு செய்ய தொடங்கு (Start Recording)</span>
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-2xl font-semibold text-xs flex items-center gap-2 shadow-md shadow-red-600/20 transition-all animate-pulse"
            >
              <Square size={16} />
              <span>{t.stopRecording}</span>
            </button>
          )}
        </div>

        {/* Processing Spinner */}
        {transcribing && (
          <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium py-2">
            <RefreshCw size={14} className="animate-spin" />
            <span>{t.transcribingAudio}</span>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 p-2.5 rounded-xl mb-3">
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}

        {/* Transcription Output */}
        {transcribedText && (
          <div className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-3.5 border border-slate-200 dark:border-slate-700 text-left space-y-2 mb-4">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              எழுத்து வடிவம் (Transcribed Text):
            </p>
            <p className="text-xs text-slate-800 dark:text-slate-100 leading-relaxed max-h-32 overflow-y-auto">
              {transcribedText}
            </p>
          </div>
        )}

        {/* Apply CTA */}
        {transcribedText && (
          <div className="w-full flex items-center gap-2">
            <button
              onClick={handleApplyToCurrentNote}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Check size={16} />
              <span>{t.applyToNote}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

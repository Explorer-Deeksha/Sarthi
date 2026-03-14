import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, Square, Volume2, VolumeX, Sparkles, AlertCircle } from 'lucide-react';
import { transcribeAudio, generateVoiceChatResponse, textToSpeech } from '../services/aiService';

type Status = 'idle' | 'recording' | 'transcribing' | 'thinking' | 'speaking' | 'error';

// Helper: convert a Blob to base64 string
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      // Strip the "data:audio/...;base64," prefix
      const base64 = dataUrl.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Pick the best supported MIME type
function getSupportedMimeType(): string {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/ogg',
    'audio/mp4',
  ];
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return '';
}

export default function Voice() {
  const [status, setStatus] = useState<Status>('idle');
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [voice, setVoice] = useState<'Kore' | 'Fenrir' | 'Zephyr'>('Kore');
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const voiceRef = useRef(voice);
  voiceRef.current = voice;

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  };

  const startRecording = useCallback(async () => {
    setErrorMsg('');
    setTranscript('');
    setAiResponse('');
    stopAudio();

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    } catch (err: any) {
      const msg = err.name === 'NotAllowedError'
        ? 'Microphone access denied. Please allow microphone access in your browser settings and refresh.'
        : `Could not access microphone: ${err.message}`;
      setErrorMsg(msg);
      setStatus('error');
      return;
    }

    const mimeType = getSupportedMimeType();
    if (!mimeType) {
      setErrorMsg('Your browser does not support audio recording. Please use Chrome or Edge.');
      setStatus('error');
      stream.getTracks().forEach(t => t.stop());
      return;
    }

    audioChunksRef.current = [];
    const recorder = new MediaRecorder(stream, { mimeType });
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      // Stop all mic tracks
      stream.getTracks().forEach(t => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
      setRecordingSeconds(0);

      const chunks = audioChunksRef.current;
      if (!chunks.length) {
        setErrorMsg("No audio was captured. Please try again.");
        setStatus('error');
        return;
      }

      const blob = new Blob(chunks, { type: mimeType });
      processAudio(blob, mimeType.split(';')[0]); // strip codecs part for Gemini mime
    };

    recorder.start(200); // collect in 200ms chunks
    setStatus('recording');
    setRecordingSeconds(0);
    timerRef.current = setInterval(() => setRecordingSeconds(s => s + 1), 1000);
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setStatus('transcribing');
  }, []);

  const processAudio = async (blob: Blob, mimeType: string) => {
    try {
      // Step 1: Transcribe audio with Gemini
      setStatus('transcribing');
      const base64 = await blobToBase64(blob);
      const transcribed = await transcribeAudio(base64, mimeType);

      if (!transcribed) {
        setErrorMsg("I couldn't make out what you said. Please try speaking more clearly.");
        setStatus('error');
        return;
      }

      setTranscript(transcribed);

      // Step 2: Generate AI reply
      setStatus('thinking');
      const reply = await generateVoiceChatResponse(transcribed);
      const replyText = typeof reply === 'string' ? reply : String(reply || '');

      if (!replyText) {
        setErrorMsg('No response from Sarthi. Please try again.');
        setStatus('error');
        return;
      }

      setAiResponse(replyText);

      // Step 3: Text-to-Speech (optional — app still works even if this fails)
      setStatus('speaking');
      try {
        const audioData = await textToSpeech(replyText, voiceRef.current);
        if (audioData) {
          stopAudio();
          const audio = new Audio(`data:audio/wav;base64,${audioData}`);
          audioRef.current = audio;
          audio.onended = () => setStatus('idle');
          audio.onerror = () => setStatus('idle');
          await audio.play();
        } else {
          setStatus('idle');
        }
      } catch (ttsErr) {
        console.warn('TTS failed (non-fatal):', ttsErr);
        setStatus('idle');
      }
    } catch (err: any) {
      console.error('Voice processing error:', err);
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
      setStatus('error');
    }
  };

  const handleMicClick = () => {
    if (status === 'recording') {
      stopRecording();
    } else if (status === 'speaking') {
      stopAudio();
      setStatus('idle');
    } else if (status === 'idle' || status === 'error') {
      startRecording();
    }
  };

  const statusConfig: Record<Status, { label: string; color: string; btnGradient: string }> = {
    idle: { label: 'Tap the mic to start', color: 'text-text-muted', btnGradient: 'from-primary to-primary-light' },
    recording: { label: `Recording... ${recordingSeconds}s — tap to stop`, color: 'text-rose-500', btnGradient: 'from-rose-500 to-red-500' },
    transcribing: { label: '🔍 Transcribing your message...', color: 'text-primary', btnGradient: 'from-amber-400 to-orange-400' },
    thinking: { label: '✨ Sarthi is thinking...', color: 'text-primary', btnGradient: 'from-amber-400 to-orange-400' },
    speaking: { label: '🔊 Speaking — tap to stop', color: 'text-secondary', btnGradient: 'from-secondary to-accent-warm' },
    error: { label: 'Something went wrong. Try again.', color: 'text-red-500', btnGradient: 'from-primary to-primary-light' },
  };

  const isProcessing = status === 'transcribing' || status === 'thinking';
  const isActive = status === 'recording' || status === 'speaking' || isProcessing;

  return (
    <div className="h-[calc(100vh-180px)] md:h-[calc(100vh-140px)] flex flex-col items-center justify-center gap-8 pb-10">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-text-main" style={{ fontFamily: 'Outfit' }}>
          <span className="text-gradient">Voice</span> Talk
        </h1>
        <p className="text-text-muted text-base">Speak your heart out. Sarthi is listening.</p>
      </div>

      {/* Status Label */}
      <motion.p
        key={status}
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className={`text-sm font-semibold px-4 py-1.5 rounded-full ${isActive ? 'bg-primary/8 ' : ''
          } ${statusConfig[status].color}`}
      >
        {statusConfig[status].label}
      </motion.p>

      {/* Mic Button + Rings */}
      <div className="relative flex items-center justify-center">
        {/* Ripple rings when active */}
        <AnimatePresence>
          {isActive && [0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className={`absolute rounded-full border ${status === 'recording' ? 'border-rose-400/25' : 'border-primary/15'
                }`}
              style={{ width: 128, height: 128 }}
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 2.5 + i * 0.6, opacity: 0 }}
              transition={{ duration: 2, delay: i * 0.5, repeat: Infinity, ease: 'easeOut' }}
            />
          ))}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          onClick={handleMicClick}
          disabled={isProcessing}
          className={`relative z-10 w-28 h-28 rounded-full flex items-center justify-center shadow-2xl transition-all disabled:opacity-70 bg-gradient-to-br ${statusConfig[status].btnGradient}`}
          style={{ boxShadow: isActive ? undefined : '0 12px 40px rgba(108,92,231,0.25)' }}
        >
          {status === 'recording' ? (
            <Square size={40} className="text-white fill-white" />
          ) : isProcessing ? (
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.4, ease: 'linear' }}>
              <Sparkles size={40} className="text-white" />
            </motion.div>
          ) : status === 'speaking' ? (
            <VolumeX size={40} className="text-white" />
          ) : (
            <Mic size={40} className="text-white" />
          )}
        </motion.button>
      </div>

      {/* Error Banner */}
      <AnimatePresence>
        {status === 'error' && errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="max-w-sm w-full px-4"
          >
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm p-4 rounded-2xl flex items-start gap-2">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <p>{errorMsg}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transcript + Response */}
      <div className="max-w-md w-full space-y-3 px-4">
        <AnimatePresence>
          {transcript && (
            <motion.div
              key="transcript"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass p-4 rounded-2xl"
            >
              <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted/60 mb-1">You said</p>
              <p className="text-sm text-text-muted italic">"{transcript}"</p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {aiResponse && (
            <motion.div
              key="response"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-strong p-5 rounded-3xl"
            >
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary/60 mb-2">Sarthi says</p>
              <p className="text-base text-text-main leading-relaxed font-medium">{aiResponse}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Voice Selector */}
      <div className="glass flex items-center gap-1 p-1.5 rounded-2xl">
        {(['Kore', 'Fenrir', 'Zephyr'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setVoice(v)}
            disabled={isProcessing || status === 'recording'}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 ${voice === v
                ? 'btn-primary shadow-md'
                : 'text-text-muted hover:text-primary hover:bg-primary/5'
              }`}
          >
            {v === 'Kore' ? '🎙 Calm Female' : v === 'Fenrir' ? '🎙 Calm Male' : '🎙 Companion'}
          </button>
        ))}
      </div>

      {/* Instruction hint */}
      {status === 'idle' && !transcript && (
        <p className="text-xs text-text-muted/60 text-center max-w-xs">
          Uses your microphone — speak normally, then tap the button again to send.
        </p>
      )}
    </div>
  );
}

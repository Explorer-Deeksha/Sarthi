import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc, setDoc, collection, addDoc } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import {
  Smile, Frown, Meh, CloudRain, Zap, Sun,
  CheckCircle2, Calendar, MessageSquare, Sparkles, Wind, Book
} from 'lucide-react';
import { Mood } from '../types';
import { detectMood } from '../services/aiService';

const REFLECTION_QUESTIONS = [
  "How are you feeling today?",
  "What made you smile today?",
  "What drained your energy today?",
  "Did something stress you today?",
  "What are you grateful for today?",
  "Did you feel connected with someone today?",
  "What do you need right now?"
];

export default function Dashboard({ setMood }: { setMood: (mood: Mood) => void }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserName(docSnap.data().full_name || user.email?.split('@')[0] || 'Friend');
          } else {
            setUserName(user.email?.split('@')[0] || 'Friend');
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
        }
      }
    };
    fetchProfile();
  }, []);

  const handleAnswer = (val: string) => {
    setAnswers({ ...answers, [REFLECTION_QUESTIONS[currentStep]]: val });
    if (currentStep < REFLECTION_QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      submitReflection();
    }
  };

  const submitReflection = async () => {
    setLoading(true);
    const combinedText = Object.values(answers).join(' ');
    const mood = await detectMood(combinedText);
    setMood(mood);

    const user = auth.currentUser;
    if (user) {
      try {
        await addDoc(collection(db, 'daily_reflections'), {
          user_id: user.uid,
          answers,
          mood,
          date: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'daily_reflections');
      }

      try {
        await addDoc(collection(db, 'mood_history'), {
          user_id: user.uid,
          mood,
          source: 'reflection',
          score: mood === 'happy' ? 1 : mood === 'sad' ? 0.2 : 0.5,
          created_at: new Date().toISOString()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'mood_history');
      }
    }

    setIsCompleted(true);
    setLoading(false);
  };

  const moodOptions = [
    { icon: Smile, label: 'Happy', mood: 'happy', gradient: 'from-amber-400 to-orange-400' },
    { icon: Meh, label: 'Neutral', mood: 'neutral', gradient: 'from-primary to-primary-light' },
    { icon: Frown, label: 'Sad', mood: 'sad', gradient: 'from-blue-400 to-indigo-400' },
    { icon: CloudRain, label: 'Lonely', mood: 'lonely', gradient: 'from-slate-400 to-slate-500' },
    { icon: Zap, label: 'Stressed', mood: 'stressed', gradient: 'from-rose-400 to-red-400' },
    { icon: Sun, label: 'Anxious', mood: 'anxious', gradient: 'from-emerald-400 to-teal-400' },
  ];

  return (
    <div className="space-y-8 pb-10">
      {/* Welcome Header */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-text-main" style={{ fontFamily: 'Outfit' }}>
            Hello, <span className="text-gradient">{userName}</span>
          </h1>
          <p className="text-text-muted mt-1 text-lg">How is your heart feeling today?</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card flex items-center gap-3 p-3 rounded-2xl"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-primary-light flex items-center justify-center shadow-md">
            <Calendar size={18} className="text-white" />
          </div>
          <div className="pr-3">
            <p className="text-[10px] uppercase font-bold text-text-muted tracking-widest">Today</p>
            <p className="text-sm font-bold text-text-main">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
          </div>
        </motion.div>
      </section>

      {/* Daily Reflection Card */}
      <section>
        {!isCompleted ? (
          <motion.div
            layout
            className="glass-strong p-8 md:p-10 rounded-[2rem] relative overflow-hidden"
          >
            {/* Decorative gradients */}
            <div className="absolute -top-24 -right-24 w-60 h-60 orb orb-purple opacity-40" />
            <div className="absolute -bottom-20 -left-20 w-48 h-48 orb orb-pink opacity-30" />

            <div className="relative z-10">
              {/* Progress Bar */}
              <div className="flex items-center gap-3 mb-8">
                <div className="h-2 w-full bg-primary/8 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentStep + 1) / REFLECTION_QUESTIONS.length) * 100}%` }}
                    className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full"
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
                <span className="text-xs font-bold text-text-muted whitespace-nowrap">
                  {currentStep + 1} / {REFLECTION_QUESTIONS.length}
                </span>
              </div>

              <h2 className="text-2xl md:text-3xl font-bold mb-8 min-h-[3.5rem] text-text-main" style={{ fontFamily: 'Outfit' }}>
                {REFLECTION_QUESTIONS[currentStep]}
              </h2>

              <div className="space-y-4">
                {currentStep === 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    {moodOptions.map((m) => (
                      <motion.button
                        key={m.mood}
                        whileHover={{ scale: 1.06 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleAnswer(m.mood)}
                        className="glass-card flex flex-col items-center gap-2 p-4 rounded-2xl group cursor-pointer"
                      >
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${m.gradient} flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow`}>
                          <m.icon className="text-white" size={20} />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted group-hover:text-primary transition-colors">{m.label}</span>
                      </motion.button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    <textarea
                      autoFocus
                      placeholder="Type your reflection here..."
                      className="glass-input w-full p-4 rounded-2xl min-h-[120px] resize-none text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (e.currentTarget.value.trim()) {
                            handleAnswer(e.currentTarget.value);
                            e.currentTarget.value = '';
                          }
                        }
                      }}
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={(e) => {
                          const textarea = e.currentTarget.parentElement?.previousElementSibling as HTMLTextAreaElement;
                          if (textarea.value.trim()) {
                            handleAnswer(textarea.value);
                            textarea.value = '';
                          }
                        }}
                        className="btn-primary px-8 py-3 rounded-xl font-semibold text-sm"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-strong p-12 rounded-[2rem] text-center space-y-6 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/3 via-transparent to-secondary/3 pointer-events-none rounded-[2rem]" />
            <div className="relative z-10">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-400/20">
                <CheckCircle2 size={36} className="text-white" />
              </div>
              <h2 className="text-3xl font-bold mt-6 text-text-main" style={{ fontFamily: 'Outfit' }}>Reflection Complete</h2>
              <p className="text-text-muted max-w-md mx-auto">
                Thank you for sharing your feelings today. Your emotional journal is growing, and Sarthi is here to support you.
              </p>
              <div className="flex flex-wrap justify-center gap-4 pt-4">
                <Link to="/insights" className="btn-primary px-8 py-4 rounded-2xl font-bold">
                  View Insights
                </Link>
                <Link to="/chat" className="btn-ghost px-8 py-4 rounded-2xl font-bold">
                  Go to Chat
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </section>

      {/* Quick Actions */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { to: '/chat', icon: MessageSquare, title: 'Talk to Sarthi', desc: 'Need someone to listen?', gradient: 'from-primary to-primary-light' },
          { to: '/journal', icon: Book, title: 'My Journal', desc: 'View your past reflections.', gradient: 'from-secondary to-accent-warm' },
          { to: '/relaxation', icon: Wind, title: 'Relaxation', desc: 'Breathe and reset.', gradient: 'from-accent to-primary-light' },
        ].map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="glass-card p-6 rounded-3xl flex items-center gap-4 group cursor-pointer"
          >
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all`}>
              <item.icon size={22} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base text-text-main" style={{ fontFamily: 'Outfit' }}>{item.title}</h3>
              <p className="text-sm text-text-muted">{item.desc}</p>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { Sparkles, ArrowRight, MessageSquare, Heart, Globe, User } from 'lucide-react';

const QUESTIONS = [
  {
    id: 'communication_style',
    question: "How do you usually communicate with friends?",
    options: [
      { label: 'Casual', value: 'casual' },
      { label: 'Deep conversations', value: 'deep' },
      { label: 'Humorous', value: 'humorous' },
      { label: 'Short replies', value: 'short' }
    ]
  },
  {
    id: 'coping_mechanism',
    question: "When you feel upset, what helps most?",
    options: [
      { label: 'Talking', value: 'talking' },
      { label: 'Listening', value: 'listening' },
      { label: 'Advice', value: 'advice' },
      { label: 'Quiet support', value: 'quiet' }
    ]
  },
  {
    id: 'preferred_language',
    question: "Preferred language for conversation?",
    options: [
      { label: 'English', value: 'english' },
      { label: 'Hindi', value: 'hindi' },
      { label: 'Hinglish', value: 'hinglish' }
    ]
  },
  {
    id: 'age_group',
    question: "Which age group do you belong to?",
    options: [
      { label: '13–17', value: '13-17' },
      { label: '18–25', value: '18-25' },
      { label: '26–40', value: '26-40' },
      { label: '40+', value: '40+' }
    ]
  }
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSelect = async (value: string) => {
    const newAnswers = { ...answers, [QUESTIONS[currentStep].id]: value };
    setAnswers(newAnswers);

    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setLoading(true);
      try {
        const user = auth.currentUser;
        if (user) {
          try {
            await setDoc(doc(db, 'personality_onboarding', user.uid), {
              user_id: user.uid,
              ...newAnswers,
              created_at: new Date().toISOString()
            });
          } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, `personality_onboarding/${user.uid}`);
          }

          try {
            await updateDoc(doc(db, 'users', user.uid), { onboarded: true });
          } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
          }
          navigate('/');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div
        layout
        className="glass-strong w-full max-w-xl p-10 rounded-[2.5rem] relative overflow-hidden"
      >
        {/* Decorative elements */}
        <div className="absolute -top-24 -right-24 w-60 h-60 orb orb-purple opacity-30" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 orb orb-pink opacity-20" />

        <div className="relative z-10">
          {/* Progress Bar */}
          <div className="flex items-center gap-2 mb-8">
            {QUESTIONS.map((_, i) => (
              <div
                key={i}
                className={`h-2 flex-1 rounded-full transition-all duration-500 ${i <= currentStep
                    ? 'bg-gradient-to-r from-primary to-primary-light'
                    : 'bg-primary/8'
                  }`}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-widest text-primary">
                  Step {currentStep + 1} of {QUESTIONS.length}
                </span>
                <h2 className="text-2xl md:text-3xl font-bold leading-tight text-text-main" style={{ fontFamily: 'Outfit' }}>
                  {QUESTIONS[currentStep].question}
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {QUESTIONS[currentStep].options.map((opt) => (
                  <motion.button
                    key={opt.value}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelect(opt.value)}
                    className="glass-card p-5 text-left rounded-2xl group flex items-center justify-between cursor-pointer"
                  >
                    <span className="font-semibold text-text-muted group-hover:text-text-main transition-colors">{opt.label}</span>
                    <ArrowRight size={16} className="text-text-muted/30 group-hover:text-primary opacity-0 group-hover:opacity-100 transition-all" />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {loading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-50 rounded-[2.5rem]">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full"
            />
          </div>
        )}
      </motion.div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wind, Play, Pause, RefreshCw, Sparkles, Heart, X, Circle } from 'lucide-react';

interface Bubble {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
}

export default function Relaxation() {
  const [activeTab, setActiveTab] = useState<'breathing' | 'bubbles' | 'colors'>('breathing');
  const [isBreathing, setIsBreathing] = useState(false);
  const [phase, setPhase] = useState<'Inhale' | 'Hold' | 'Exhale' | 'Wait'>('Wait');

  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [score, setScore] = useState(0);

  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isBreathing) {
      let count = 0;
      const phases: ('Inhale' | 'Hold' | 'Exhale' | 'Hold')[] = ['Inhale', 'Hold', 'Exhale', 'Hold'];
      setPhase(phases[0] as any);

      interval = setInterval(() => {
        count++;
        setPhase(phases[count % 4] as any);
      }, 4000);
    } else {
      setPhase('Wait');
    }
    return () => clearInterval(interval);
  }, [isBreathing]);

  useEffect(() => {
    if (activeTab !== 'bubbles') return;

    const interval = setInterval(() => {
      if (bubbles.length < 15) {
        const newBubble: Bubble = {
          id: Date.now(),
          x: Math.random() * 80 + 10,
          y: Math.random() * 80 + 10,
          size: Math.random() * 40 + 40,
          color: [
            'bg-gradient-to-br from-primary/20 to-primary-light/15',
            'bg-gradient-to-br from-secondary/20 to-accent-warm/15',
            'bg-gradient-to-br from-accent/20 to-primary-light/15',
            'bg-gradient-to-br from-primary-light/20 to-secondary/15'
          ][Math.floor(Math.random() * 4)]
        };
        setBubbles(prev => [...prev, newBubble]);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [activeTab, bubbles.length]);

  const popBubble = (id: number) => {
    setBubbles(prev => prev.filter(b => b.id !== id));
    setScore(prev => prev + 1);
  };

  const tabs = [
    { key: 'breathing' as const, label: 'Breathing', icon: Wind },
    { key: 'bubbles' as const, label: 'Bubbles', icon: Sparkles },
    { key: 'colors' as const, label: 'Colors', icon: Heart },
  ];

  return (
    <div className="space-y-8 pb-10">
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-text-main" style={{ fontFamily: 'Outfit' }}>
            <span className="text-gradient">Relaxation</span> Space
          </h1>
          <p className="text-text-muted mt-1 text-lg">Take a breath. Reset your rhythm.</p>
        </div>
        <div className="flex glass p-1 rounded-2xl">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all ${activeTab === tab.key
                  ? 'btn-primary shadow-md'
                  : 'text-text-muted hover:text-primary'
                }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      <AnimatePresence mode="wait">
        {activeTab === 'breathing' && (
          <motion.section
            key="breathing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-strong p-12 rounded-[3rem] flex flex-col items-center text-center space-y-12 relative overflow-hidden min-h-[500px] justify-center"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-primary/3 via-transparent to-secondary/3 pointer-events-none rounded-[3rem]" />

            <div className="relative w-72 h-72 flex items-center justify-center">
              <motion.div
                animate={isBreathing ? {
                  scale: phase === 'Inhale' ? 1.8 : phase === 'Exhale' ? 1 : 1.8,
                  opacity: phase === 'Hold' ? 0.08 : 0.05
                } : { scale: 1, opacity: 0.03 }}
                transition={{ duration: 4, ease: "easeInOut" }}
                className={`absolute w-48 h-48 rounded-full blur-3xl ${phase === 'Inhale' ? 'bg-primary' : phase === 'Exhale' ? 'bg-secondary' : 'bg-accent'
                  }`}
              />

              <motion.div
                animate={isBreathing ? {
                  scale: phase === 'Inhale' ? 1.4 : phase === 'Exhale' ? 1 : 1.4
                } : { scale: 1 }}
                transition={{ duration: 4, ease: "easeInOut" }}
                className="w-56 h-56 border border-primary/15 rounded-full flex items-center justify-center relative"
              >
                <div className="w-40 h-40 bg-white/80 backdrop-blur-sm rounded-full shadow-xl shadow-primary/8 flex flex-col items-center justify-center border border-primary/10">
                  <span className="text-2xl font-bold text-primary" style={{ fontFamily: 'Outfit' }}>
                    {isBreathing ? phase : 'Ready?'}
                  </span>
                  {isBreathing && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '60%' }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                      className="h-0.5 bg-gradient-to-r from-primary to-secondary mt-3 rounded-full"
                    />
                  )}
                </div>
              </motion.div>
            </div>

            <div className="space-y-6 max-w-sm relative z-10">
              <h2 className="text-3xl font-bold text-text-main" style={{ fontFamily: 'Outfit' }}>Guided Breathing</h2>
              <p className="text-text-muted text-lg">
                Inhale peace, exhale tension. Let the rhythm guide your heart back to center.
              </p>
              <button
                onClick={() => setIsBreathing(!isBreathing)}
                className={`px-12 py-4 rounded-full font-bold text-lg transition-all flex items-center gap-3 mx-auto ${isBreathing ? 'btn-ghost' : 'btn-primary'
                  }`}
              >
                {isBreathing ? <Pause size={22} /> : <Play size={22} />}
                {isBreathing ? 'Stop' : 'Begin Session'}
              </button>
            </div>
          </motion.section>
        )}

        {activeTab === 'bubbles' && (
          <motion.section
            key="bubbles"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-strong p-8 rounded-[3rem] relative overflow-hidden min-h-[500px] cursor-crosshair"
          >
            <div className="absolute top-6 left-8 flex items-center gap-4 z-10">
              <div className="glass px-4 py-3 rounded-2xl">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Zen Score</span>
                <p className="text-2xl font-bold text-primary" style={{ fontFamily: 'Outfit' }}>{score}</p>
              </div>
              <p className="text-text-muted">Pop the bubbles gently...</p>
            </div>

            <button
              onClick={() => { setBubbles([]); setScore(0); }}
              className="absolute top-6 right-8 p-3 glass rounded-2xl text-text-muted hover:text-primary transition-colors z-10"
            >
              <RefreshCw size={18} />
            </button>

            {bubbles.map((bubble) => (
              <motion.button
                key={bubble.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                onClick={() => popBubble(bubble.id)}
                style={{ left: `${bubble.x}%`, top: `${bubble.y}%`, width: bubble.size, height: bubble.size }}
                className={`absolute rounded-full backdrop-blur-sm border border-white/50 shadow-lg shadow-primary/5 transition-transform hover:scale-110 ${bubble.color}`}
              />
            ))}

            {bubbles.length === 0 && score > 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-center">
                <div className="space-y-4">
                  <h3 className="text-4xl font-bold text-gradient" style={{ fontFamily: 'Outfit' }}>Well Done</h3>
                  <p className="text-text-muted text-xl">Your mind is becoming clearer.</p>
                </div>
              </div>
            )}
          </motion.section>
        )}

        {activeTab === 'colors' && (
          <motion.section
            key="colors"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setMousePos({
                x: ((e.clientX - rect.left) / rect.width) * 100,
                y: ((e.clientY - rect.top) / rect.height) * 100
              });
            }}
            className="glass-strong p-8 rounded-[3rem] relative overflow-hidden min-h-[500px] flex items-center justify-center cursor-pointer"
            style={{
              background: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(108,92,231,0.08) 0%, rgba(225,123,237,0.04) 30%, rgba(248,247,255,0.95) 100%)`
            }}
          >
            <div className="text-center space-y-6 relative z-10">
              <Heart size={64} className="mx-auto text-secondary animate-pulse" />
              <h2 className="text-4xl font-bold text-text-main" style={{ fontFamily: 'Outfit' }}>Color Therapy</h2>
              <p className="text-text-muted text-lg max-w-md mx-auto">
                Move your cursor to paint the atmosphere with calm. Let the colors wash over your thoughts.
              </p>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: 'Box Breathing', desc: '4-4-4-4 technique for instant calm.', icon: Wind, tab: 'breathing', gradient: 'from-primary to-primary-light' },
          { title: 'Zen Bubbles', desc: 'Gentle focus to quiet the mind.', icon: Sparkles, tab: 'bubbles', gradient: 'from-secondary to-accent-warm' },
          { title: 'Color Flow', desc: 'Express emotions through motion.', icon: Heart, tab: 'colors', gradient: 'from-accent to-primary-light' },
        ].map((a, i) => (
          <motion.div
            key={i}
            whileHover={{ y: -4 }}
            onClick={() => setActiveTab(a.tab as any)}
            className={`p-8 rounded-[2rem] transition-all cursor-pointer ${activeTab === a.tab
                ? 'glass-strong border border-primary/15 shadow-lg shadow-primary/8'
                : 'glass-card'
              }`}
          >
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${a.gradient} flex items-center justify-center mb-6 shadow-md ${activeTab === a.tab ? 'shadow-lg scale-110' : ''
              } transition-all`}>
              <a.icon size={24} className="text-white" />
            </div>
            <h3 className="font-bold text-lg mb-2 text-text-main" style={{ fontFamily: 'Outfit' }}>{a.title}</h3>
            <p className="text-sm text-text-muted">{a.desc}</p>
          </motion.div>
        ))}
      </section>
    </div>
  );
}

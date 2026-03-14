import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Heart, Shield, MessageCircle, BarChart2, Globe, Users, ArrowRight, Sparkles, Leaf, Brain } from 'lucide-react';

export default function Landing() {
  const features = [
    { icon: MessageCircle, title: 'AI Emotional Companion', desc: 'A supportive friend who listens without judgment, anytime you need.', color: 'from-primary to-primary-light' },
    { icon: BarChart2, title: 'Mood Pattern Insights', desc: 'Understand your emotional cycles and track your inner growth.', color: 'from-secondary to-accent-warm' },
    { icon: Globe, title: 'Multilingual Support', desc: 'Talk naturally in English, Hindi, or Hinglish.', color: 'from-accent to-primary-light' },
    { icon: Users, title: 'Safe Community', desc: 'Share and connect anonymously with others who care.', color: 'from-accent-warm to-secondary' },
    { icon: Shield, title: 'Privacy First', desc: 'Your data is encrypted and your identity is always safe.', color: 'from-primary-light to-accent' },
    { icon: Heart, title: 'Gentle Guidance', desc: 'Daily reflections to help you grow stronger every day.', color: 'from-secondary to-primary' },
  ];

  return (
    <div className="min-h-screen bg-serene overflow-x-hidden relative">
      {/* Floating Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div
          animate={{ y: [0, -40, 0], x: [0, 20, 0] }}
          transition={{ repeat: Infinity, duration: 12, ease: "easeInOut" }}
          className="orb orb-purple w-[500px] h-[500px] -top-48 -left-48"
        />
        <motion.div
          animate={{ y: [0, 30, 0], x: [0, -20, 0] }}
          transition={{ repeat: Infinity, duration: 15, ease: "easeInOut" }}
          className="orb orb-pink w-[400px] h-[400px] top-1/4 -right-48"
        />
        <motion.div
          animate={{ y: [0, -20, 0] }}
          transition={{ repeat: Infinity, duration: 10, ease: "easeInOut" }}
          className="orb orb-cyan w-[350px] h-[350px] bottom-20 left-1/3"
        />
      </div>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-primary/8" style={{
        background: 'rgba(248, 247, 255, 0.8)',
        backdropFilter: 'blur(20px)',
      }}>
        <div className="max-w-6xl mx-auto px-4 md:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center shadow-md shadow-primary/15">
              <Heart className="text-white w-[18px] h-[18px]" />
            </div>
            <span className="font-bold text-lg text-text-main tracking-tight" style={{ fontFamily: 'Outfit' }}>Sarthi</span>
          </div>
          <Link
            to="/auth"
            className="btn-primary px-5 py-2 rounded-full text-sm font-semibold flex items-center gap-2"
          >
            <Sparkles size={14} />
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-28 px-4 overflow-hidden">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/60 backdrop-blur-sm border border-primary/10 text-primary font-semibold text-sm mb-10 shadow-sm"
          >
            <Sparkles size={14} className="animate-pulse" />
            <span>Your journey to inner peace begins here</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.7 }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8 leading-[1.1] text-text-main"
            style={{ fontFamily: 'Outfit' }}
          >
            Sarthi – Your AI{' '}
            <br className="hidden sm:block" />
            <span className="text-gradient">Emotional Companion</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.7 }}
            className="text-lg md:text-xl text-text-muted max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            A safe, warm space to reflect, understand your emotions, and rediscover your strength every single day.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              to="/auth"
              className="btn-primary w-full sm:w-auto px-10 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3"
            >
              Start Your Journey
              <ArrowRight size={20} />
            </Link>
            <button
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="btn-ghost w-full sm:w-auto px-10 py-4 rounded-2xl font-semibold text-lg"
            >
              How it works
            </button>
          </motion.div>
        </div>

        {/* Decorative floating icons */}
        <motion.div
          animate={{ y: [0, -12, 0], rotate: [0, 5, 0] }}
          transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
          className="hidden lg:flex absolute top-32 left-16 w-14 h-14 rounded-2xl bg-white/70 backdrop-blur-sm border border-primary/10 shadow-lg shadow-primary/8 items-center justify-center text-secondary"
        >
          <Leaf size={22} />
        </motion.div>
        <motion.div
          animate={{ y: [0, 12, 0], rotate: [0, -4, 0] }}
          transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
          className="hidden lg:flex absolute bottom-32 right-16 w-14 h-14 rounded-2xl bg-white/70 backdrop-blur-sm border border-primary/10 shadow-lg shadow-primary/8 items-center justify-center text-accent"
        >
          <Brain size={22} />
        </motion.div>
      </section>

      {/* Features Grid */}
      <section id="features" className="relative py-24 px-4 z-10">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-text-main" style={{ fontFamily: 'Outfit' }}>
              Designed for your <span className="text-gradient">wellbeing</span>
            </h2>
            <p className="text-text-muted text-lg">Simple tools to help you navigate your emotional landscape.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="glass-card p-7 rounded-3xl group cursor-default"
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-5 shadow-md group-hover:scale-110 transition-transform duration-300`}>
                  <f.icon size={20} className="text-white" />
                </div>
                <h3 className="text-lg font-bold mb-2 text-text-main" style={{ fontFamily: 'Outfit' }}>{f.title}</h3>
                <p className="text-text-muted text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 px-4 z-10">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-strong p-12 md:p-16 rounded-[2.5rem] relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none rounded-[2.5rem]" />
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center mx-auto mb-8 shadow-lg shadow-primary/20 animate-pulse-glow">
                <Heart size={28} className="text-white" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-text-main" style={{ fontFamily: 'Outfit' }}>
                Ready to start your <span className="text-gradient">healing journey</span>?
              </h2>
              <p className="text-text-muted text-lg mb-8 max-w-lg mx-auto">
                Join thousands who are finding peace, one reflection at a time.
              </p>
              <Link
                to="/auth"
                className="btn-primary inline-flex items-center gap-3 px-10 py-4 rounded-2xl font-bold text-lg"
              >
                Begin Now
                <ArrowRight size={20} />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-10 px-4 border-t border-primary/8 text-center text-text-muted text-sm z-10">
        <div className="flex items-center justify-center gap-2">
          <Heart size={14} className="text-secondary" />
          <p>© 2026 Sarthi. Built with empathy.</p>
        </div>
      </footer>
    </div>
  );
}

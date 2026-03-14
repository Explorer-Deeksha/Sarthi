import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Home, MessageCircle, Mic, Wind, Users, BarChart2, User,
  LogOut, Menu, X, Heart, Book, Sparkles
} from 'lucide-react';
import { auth } from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Voice from './pages/Voice';
import Relaxation from './pages/Relaxation';
import Community from './pages/Community';
import Insights from './pages/Insights';
import Journal from './pages/Journal';
import { Mood } from './types';

const Layout = ({ children, user, mood }: {
  children: React.ReactNode,
  user: any,
  mood: Mood,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/chat', icon: MessageCircle, label: 'Chat' },
    { path: '/voice', icon: Mic, label: 'Voice' },
    { path: '/relaxation', icon: Wind, label: 'Relax' },
    { path: '/community', icon: Users, label: 'Community' },
    { path: '/insights', icon: BarChart2, label: 'Insights' },
    { path: '/journal', icon: Book, label: 'Journal' },
  ];

  const moodClass = `theme-${mood}`;

  return (
    <div className={`min-h-screen flex flex-col bg-serene ${moodClass}`}>
      {/* Soft Floating Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="orb orb-purple w-[400px] h-[400px] -top-40 -right-40 animate-float-slow" />
        <div className="orb orb-pink w-[350px] h-[350px] top-1/2 -left-40 animate-float" style={{ animationDelay: '3s' }} />
        <div className="orb orb-cyan w-[300px] h-[300px] -bottom-32 right-1/4 animate-float-slow" style={{ animationDelay: '5s' }} />
      </div>

      {/* ===== HEADER / NAVBAR ===== */}
      <header className="sticky top-0 z-50 border-b border-primary/8" style={{
        background: 'rgba(248, 247, 255, 0.8)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}>
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center shadow-md shadow-primary/15 group-hover:shadow-lg group-hover:shadow-primary/25 transition-shadow duration-300">
                <Heart className="text-white w-[18px] h-[18px]" />
              </div>
              <span className="font-bold text-lg text-text-main tracking-tight" style={{ fontFamily: 'Outfit' }}>
                Sarthi
              </span>
            </Link>

            {/* Desktop Navigation */}
            {user && (
              <nav className="hidden md:flex items-center gap-1 bg-white/50 backdrop-blur-sm rounded-full px-2 py-1.5 border border-primary/6">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13px] font-medium transition-all duration-300 ${isActive
                          ? 'text-white'
                          : 'text-text-muted hover:text-primary hover:bg-primary/5'
                        }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="navPill"
                          className="absolute inset-0 bg-gradient-to-r from-primary to-primary-light rounded-full shadow-md shadow-primary/20"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                        />
                      )}
                      <span className="relative z-10 flex items-center gap-1.5">
                        <item.icon size={15} />
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </nav>
            )}

            {/* Right side actions */}
            <div className="flex items-center gap-2">
              {user ? (
                <>
                  <button
                    onClick={() => signOut(auth)}
                    className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-text-muted hover:text-red-500 hover:bg-red-50 transition-all duration-200"
                    title="Sign Out"
                  >
                    <LogOut size={16} />
                    <span className="text-xs font-medium">Sign Out</span>
                  </button>
                  <button
                    className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center hover:bg-primary/5 text-text-muted transition-colors"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                  >
                    {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
                  </button>
                </>
              ) : (
                <Link to="/auth" className="btn-primary px-5 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                  <Sparkles size={14} />
                  Get Started
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 bg-black/10 backdrop-blur-sm z-40"
              onClick={() => setIsMenuOpen(false)}
            />
            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed top-[65px] left-3 right-3 z-50 p-2 rounded-2xl overflow-hidden"
              style={{
                background: 'rgba(255, 255, 255, 0.92)',
                backdropFilter: 'blur(24px)',
                border: '1px solid rgba(108, 92, 231, 0.1)',
                boxShadow: '0 16px 48px rgba(108, 92, 231, 0.12)',
              }}
            >
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${location.pathname === item.path
                      ? 'bg-gradient-to-r from-primary to-primary-light text-white shadow-sm'
                      : 'text-text-muted hover:bg-primary/5 hover:text-primary'
                    }`}
                >
                  <item.icon size={18} />
                  <span className="font-medium text-sm">{item.label}</span>
                </Link>
              ))}
              <div className="mt-1 pt-2 border-t border-primary/8">
                <button
                  onClick={() => { signOut(auth); setIsMenuOpen(false); }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-50 transition-all w-full"
                >
                  <LogOut size={18} />
                  <span className="font-medium text-sm">Sign Out</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-6 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Nav (Mobile Only) */}
      {user && (
        <nav className="md:hidden sticky bottom-0 z-50 border-t border-primary/8" style={{
          background: 'rgba(248, 247, 255, 0.9)',
          backdropFilter: 'blur(20px)',
        }}>
          <div className="flex justify-around items-center px-2 py-2">
            {navItems.slice(0, 5).map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${isActive ? 'text-primary' : 'text-text-muted'
                    }`}
                >
                  <div className={`p-1 rounded-lg transition-all ${isActive ? 'bg-primary/10' : ''}`}>
                    <item.icon size={20} />
                  </div>
                  <span className="text-[10px] font-semibold">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentMood, setCurrentMood] = useState<Mood>('neutral');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (sessionUser) => {
      setUser(sessionUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background bg-serene">
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="orb orb-purple w-[300px] h-[300px] top-1/4 left-1/4 animate-float" />
          <div className="orb orb-pink w-[250px] h-[250px] bottom-1/4 right-1/4 animate-float-slow" />
        </div>
        <div className="flex flex-col items-center gap-5 relative z-10">
          <motion.div
            animate={{ scale: [1, 1.12, 1] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center shadow-lg shadow-primary/20"
          >
            <Heart className="text-white w-7 h-7" />
          </motion.div>
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ repeat: Infinity, duration: 1.5, delay: 0 }}
              className="w-1.5 h-1.5 rounded-full bg-primary"
            />
            <motion.div
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
              className="w-1.5 h-1.5 rounded-full bg-secondary"
            />
            <motion.div
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }}
              className="w-1.5 h-1.5 rounded-full bg-accent"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/landing" element={user ? <Navigate to="/" /> : <Landing />} />
        <Route path="/auth" element={user ? <Navigate to="/" /> : <Auth />} />

        <Route path="/*" element={
          user ? (
            <Layout user={user} mood={currentMood}>
              <Routes>
                <Route path="/" element={<Dashboard setMood={setCurrentMood} />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/chat" element={<Chat setMood={setCurrentMood} />} />
                <Route path="/voice" element={<Voice />} />
                <Route path="/relaxation" element={<Relaxation />} />
                <Route path="/community" element={<Community />} />
                <Route path="/insights" element={<Insights />} />
                <Route path="/journal" element={<Journal />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </Layout>
          ) : (
            <Navigate to="/landing" />
          )
        } />
      </Routes>
    </Router>
  );
}

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { Book, Calendar, ChevronRight, Heart, Sparkles, Search } from 'lucide-react';

export default function Journal() {
  const [reflections, setReflections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchJournal = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const q = query(
            collection(db, 'daily_reflections'),
            where('user_id', '==', user.uid),
            orderBy('created_at', 'desc')
          );
          const snap = await getDocs(q);
          const data: any[] = [];
          snap.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
          setReflections(data);
        } catch (error) {
          handleFirestoreError(error, OperationType.LIST, 'daily_reflections');
        }
      }
      setLoading(false);
    };
    fetchJournal();
  }, []);

  const filteredReflections = reflections.filter(r =>
    Object.values(r.answers).some((val: any) =>
      val.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const moodColors: Record<string, string> = {
    happy: 'bg-amber-100 text-amber-600 border-amber-200',
    sad: 'bg-blue-100 text-blue-600 border-blue-200',
    neutral: 'bg-purple-100 text-purple-600 border-purple-200',
    anxious: 'bg-emerald-100 text-emerald-600 border-emerald-200',
    stressed: 'bg-rose-100 text-rose-600 border-rose-200',
    lonely: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  return (
    <div className="space-y-8 pb-10">
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-text-main" style={{ fontFamily: 'Outfit' }}>
            <span className="text-gradient">Emotional</span> Journal
          </h1>
          <p className="text-text-muted mt-1">A timeline of your inner growth and reflections.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
          <input
            type="text"
            placeholder="Search reflections..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="glass-input pl-10 pr-4 py-2.5 rounded-xl text-sm w-full md:w-64"
          />
        </div>
      </section>

      {loading ? (
        <div className="flex justify-center py-20">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full"
          />
        </div>
      ) : filteredReflections.length > 0 ? (
        <div className="space-y-4">
          {filteredReflections.map((ref, idx) => (
            <motion.div
              key={ref.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="glass-card p-6 rounded-3xl group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center shadow-md">
                    <Calendar size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-text-main" style={{ fontFamily: 'Outfit' }}>
                      {new Date(ref.created_at).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${moodColors[ref.mood] || moodColors.neutral
                        }`}>
                        {ref.mood}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight size={20} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-5">
                {Object.entries(ref.answers).slice(0, 4).map(([q, a]: [string, any], i) => (
                  <div key={i} className="glass p-4 rounded-2xl">
                    <p className="text-[10px] font-bold text-text-muted uppercase mb-1 tracking-wider">{q}</p>
                    <p className="text-sm text-text-main line-clamp-2">"{a}"</p>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 space-y-5">
          <div className="w-20 h-20 glass rounded-3xl flex items-center justify-center mx-auto text-text-muted">
            <Book size={32} />
          </div>
          <h3 className="text-xl font-bold text-text-muted" style={{ fontFamily: 'Outfit' }}>No reflections found</h3>
          <p className="text-text-muted text-sm">Start your daily reflection on the dashboard to see your journal grow.</p>
        </div>
      )}
    </div>
  );
}

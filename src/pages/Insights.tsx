import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { BarChart2, TrendingUp, AlertCircle, Calendar, Sparkles } from 'lucide-react';
import { generateWeeklySummary, analyzeTriggers } from '../services/aiService';

export default function Insights() {
  const [moodData, setMoodData] = useState<any[]>([]);
  const [summary, setSummary] = useState('');
  const [triggers, setTriggers] = useState<any[]>([]);
  const [recommendation, setRecommendation] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const moodQ = query(
            collection(db, 'mood_history'),
            where('user_id', '==', user.uid),
            orderBy('created_at', 'asc'),
            limit(30)
          );

          const moodSnap = await getDocs(moodQ);
          const moodHistory: any[] = [];
          moodSnap.forEach((doc) => {
            moodHistory.push({ id: doc.id, ...doc.data() });
          });

          if (moodHistory.length > 0) {
            const formatted = moodHistory.map(d => ({
              date: new Date(d.created_at).toLocaleDateString('en-US', { weekday: 'short' }),
              score: (d.score || 0.5) * 100,
              mood: d.mood
            }));
            setMoodData(formatted);

            const moods = moodHistory.slice(-7).map(d => d.mood);
            const aiSummary = await generateWeeklySummary(moods);
            setSummary(aiSummary);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.LIST, 'mood_history');
        }

        try {
          const refQ = query(
            collection(db, 'daily_reflections'),
            where('user_id', '==', user.uid),
            orderBy('created_at', 'desc'),
            limit(10)
          );
          const refSnap = await getDocs(refQ);
          const reflections: any[] = [];
          refSnap.forEach(doc => reflections.push(doc.data()));

          if (reflections.length > 0) {
            try {
              const analysis = await analyzeTriggers(reflections);
              setTriggers(analysis.triggers || []);
              setRecommendation(analysis.recommendation || '');
            } catch (err) {
              console.error('Trigger analysis error:', err);
            }
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.LIST, 'daily_reflections');
        }
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-8 pb-10">
      <section>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-text-main" style={{ fontFamily: 'Outfit' }}>
          <span className="text-gradient">Mood</span> Insights
        </h1>
        <p className="text-text-muted mt-1 text-lg">Visualize your emotional journey and find patterns.</p>
      </section>

      {/* Summary Card */}
      <section className="p-8 rounded-[2rem] relative overflow-hidden" style={{
        background: 'linear-gradient(135deg, rgba(108,92,231,0.9) 0%, rgba(162,155,254,0.85) 50%, rgba(225,123,237,0.8) 100%)'
      }}>
        <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-white/5 blur-3xl" />
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-white/80" />
            <span className="text-xs font-bold uppercase tracking-widest text-white/70">Weekly Reflection</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white" style={{ fontFamily: 'Outfit' }}>Sarthi's Insight</h2>
          <p className="text-lg leading-relaxed text-white/85">
            {loading ? 'Analyzing your patterns...' : summary || 'Start tracking your mood to see insights here.'}
          </p>
        </div>
      </section>

      {/* Chart Section */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-strong p-8 rounded-[2rem]">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-xl text-text-main" style={{ fontFamily: 'Outfit' }}>Emotional Timeline</h3>
            <div className="flex items-center gap-2 text-xs font-bold text-text-muted uppercase tracking-widest">
              <Calendar size={14} />
              Last 7 Days
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={moodData.slice(-7)}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6C5CE7" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6C5CE7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(108,92,231,0.08)" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#7C7499', fontFamily: 'Outfit' }}
                />
                <YAxis hide domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '16px',
                    border: '1px solid rgba(108,92,231,0.1)',
                    boxShadow: '0 20px 25px -5px rgba(108,92,231,0.1)',
                    background: 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(20px)',
                    color: '#2D2844',
                    fontFamily: 'Outfit'
                  }}
                  labelStyle={{ fontWeight: 'bold', color: '#6C5CE7' }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#6C5CE7"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorScore)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass-card p-6 rounded-3xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary to-accent-warm flex items-center justify-center shadow-md">
                <BarChart2 size={18} className="text-white" />
              </div>
              <h4 className="font-bold text-text-main" style={{ fontFamily: 'Outfit' }}>Top Triggers</h4>
            </div>
            <ul className="space-y-3">
              {triggers.length > 0 ? triggers.map((t, i) => (
                <li key={i} className="flex items-center justify-between text-sm">
                  <span className="text-text-muted">{t.label}</span>
                  <span className="font-bold text-primary">{t.percentage}%</span>
                </li>
              )) : (
                <li className="text-sm text-text-muted">Complete more reflections to see triggers.</li>
              )}
            </ul>
          </div>

          <div className="glass-card p-6 rounded-3xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-primary-light flex items-center justify-center shadow-md">
                <AlertCircle size={18} className="text-white" />
              </div>
              <h4 className="font-bold text-text-main" style={{ fontFamily: 'Outfit' }}>Recommendation</h4>
            </div>
            <p className="text-sm text-text-muted leading-relaxed">
              {recommendation || "Sarthi will provide personalized recommendations once you share more about your day."}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

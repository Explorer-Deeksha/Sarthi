import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Sparkles, User, Heart, Mic, Volume2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, orderBy, limit, getDocs, addDoc } from 'firebase/firestore';
import { generateChatResponseStream, detectMood, RateLimitError } from '../services/aiService';
import { Mood, ChatMessage } from '../types';
import { GenerateContentResponse } from "@google/genai";

export default function Chat({ setMood }: { setMood: (mood: Mood) => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const q = query(
            collection(db, 'chat_history'),
            where('user_id', '==', user.uid),
            orderBy('created_at', 'asc'),
            limit(50)
          );

          const querySnapshot = await getDocs(q);
          const history: ChatMessage[] = [];
          querySnapshot.forEach((doc) => {
            history.push({ id: doc.id, ...doc.data() } as ChatMessage);
          });

          setMessages(history);
        } catch (error) {
          handleFirestoreError(error, OperationType.LIST, 'chat_history');
        }
      }
    };
    fetchHistory();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      const user = auth.currentUser;

      const detectedMood = await detectMood(currentInput);
      setMood(detectedMood);

      if (user) {
        try {
          await addDoc(collection(db, 'chat_history'), {
            user_id: user.uid,
            role: 'user',
            content: currentInput,
            mood: detectedMood,
            created_at: new Date().toISOString()
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, 'chat_history');
        }

        try {
          await addDoc(collection(db, 'mood_history'), {
            user_id: user.uid,
            mood: detectedMood,
            source: 'chat',
            score: 0.5,
            created_at: new Date().toISOString()
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, 'mood_history');
        }
      }

      const history = messages.slice(-10).map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

      const stream = await generateChatResponseStream(currentInput, history);
      if (!stream) throw new Error('No stream returned');

      const aiMsgId = (Date.now() + 1).toString();
      let fullContent = '';

      const aiMsg: ChatMessage = {
        id: aiMsgId,
        role: 'assistant',
        content: '',
        created_at: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMsg]);
      setIsLoading(false);

      for await (const chunk of stream) {
        const c = chunk as GenerateContentResponse;
        const text = c.text;
        if (text) {
          fullContent += text;
          setMessages(prev => prev.map(m =>
            m.id === aiMsgId ? { ...m, content: fullContent } : m
          ));
        }
      }

      if (user) {
        try {
          await addDoc(collection(db, 'chat_history'), {
            user_id: user.uid,
            role: 'assistant',
            content: fullContent,
            created_at: new Date().toISOString()
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, 'chat_history');
        }
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      setIsLoading(false);

      // Show a friendly in-chat error message
      const errorText = error instanceof RateLimitError
        ? `⏳ I'm getting a lot of requests right now. Please wait about ${error.waitSeconds} seconds and try again.`
        : '⚠️ Something went wrong. Please try again in a moment.';

      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: errorText,
        created_at: new Date().toISOString()
      }]);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] md:h-[calc(100vh-140px)]">
      {/* Chat Header */}
      <div className="glass-card flex items-center justify-between p-4 rounded-2xl mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center shadow-md shadow-primary/15">
            <Heart size={18} className="text-white" />
          </div>
          <div>
            <h2 className="font-bold text-text-main text-sm" style={{ fontFamily: 'Outfit' }}>Sarthi</h2>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-[10px] text-text-muted uppercase font-semibold tracking-wider">Always here for you</span>
            </div>
          </div>
        </div>
        <button className="p-2 rounded-xl text-text-muted hover:text-primary hover:bg-primary/5 transition-all">
          <Volume2 size={18} />
        </button>
      </div>

      {/* Messages Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto pr-2 space-y-5 scroll-smooth"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-5">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center border border-primary/8">
              <Sparkles size={32} className="text-primary" />
            </div>
            <h3 className="text-xl font-bold text-text-main" style={{ fontFamily: 'Outfit' }}>How are you feeling, truly?</h3>
            <p className="text-text-muted max-w-xs text-sm">
              I'm here to listen, reflect, and support you. You can share anything that's on your mind.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex gap-2.5 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center ${msg.role === 'user'
                ? 'bg-gradient-to-br from-primary to-primary-light shadow-sm shadow-primary/15'
                : 'bg-white border border-primary/10 shadow-sm'
                }`}>
                {msg.role === 'user'
                  ? <User size={14} className="text-white" />
                  : <Heart size={14} className="text-primary" />
                }
              </div>
              <div className={`p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                ? 'bg-gradient-to-br from-primary to-primary-dark text-white rounded-tr-sm shadow-md shadow-primary/15'
                : 'glass rounded-tl-sm'
                }`}>
                <div className={msg.role === 'user' ? 'prose-user' : 'prose-chat'}>
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
                <span className={`text-[10px] mt-2 block ${msg.role === 'user' ? 'text-right text-white/50' : 'text-left text-text-muted/60'
                  }`}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </motion.div>
        ))}

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="flex gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white border border-primary/10 shadow-sm flex items-center justify-center">
                <Heart size={14} className="text-primary" />
              </div>
              <div className="glass p-4 rounded-2xl rounded-tl-sm flex gap-1.5 items-center">
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="mt-4 relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Share your thoughts..."
          className="glass-input w-full pl-5 pr-24 py-4 rounded-2xl text-sm shadow-sm"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <button
            type="button"
            className="p-2 text-text-muted hover:text-primary transition-colors rounded-lg hover:bg-primary/5"
          >
            <Mic size={18} />
          </button>
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="btn-primary p-3 rounded-xl disabled:opacity-30"
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}

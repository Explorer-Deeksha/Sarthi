import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc } from 'firebase/firestore';
import { MessageSquare, Heart, Send, User, Shield, AlertCircle } from 'lucide-react';
import { CommunityPost } from '../types';

export default function Community() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [input, setInput] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'community_posts'), orderBy('created_at', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData: CommunityPost[] = [];
      snapshot.forEach((doc) => {
        postsData.push({ id: doc.id, ...doc.data() } as CommunityPost);
      });
      setPosts(postsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'community_posts');
    });
    return () => unsubscribe();
  }, []);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    setLoading(true);
    try {
      const user = auth.currentUser;
      await addDoc(collection(db, 'community_posts'), {
        user_id: user?.uid || null,
        content: input,
        is_anonymous: isAnonymous,
        author_name: isAnonymous ? 'Anonymous Soul' : (user?.displayName || 'Community Member'),
        created_at: new Date().toISOString()
      });
      setInput('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'community_posts');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-text-main" style={{ fontFamily: 'Outfit' }}>
            <span className="text-gradient">Community</span> Space
          </h1>
          <p className="text-text-muted mt-1">A safe, anonymous place to share and support.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-secondary/10 rounded-full text-xs font-bold uppercase tracking-wider text-secondary">
          <Shield size={14} />
          Moderated Space
        </div>
      </section>

      {/* Post Input */}
      <section className="glass-strong p-6 rounded-3xl">
        <form onSubmit={handlePost} className="space-y-4">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="What's on your mind? Share anonymously..."
            className="glass-input w-full p-4 rounded-2xl min-h-[100px] resize-none text-sm"
          />
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIsAnonymous(!isAnonymous)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${isAnonymous
                  ? 'bg-primary/10 text-primary border border-primary/15'
                  : 'bg-gray-100 text-text-muted'
                }`}
            >
              <User size={14} />
              {isAnonymous ? 'Posting Anonymously' : 'Posting Publicly'}
            </button>
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="btn-primary px-6 py-3 rounded-xl font-semibold text-sm flex items-center gap-2 disabled:opacity-30"
            >
              {loading ? 'Posting...' : 'Share Post'}
              <Send size={16} />
            </button>
          </div>
        </form>
      </section>

      {/* Posts Feed */}
      <section className="space-y-4">
        <AnimatePresence>
          {posts.map((post) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6 rounded-3xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/15 to-secondary/15 flex items-center justify-center text-primary">
                    <User size={16} />
                  </div>
                  <span className="text-sm font-semibold text-text-main">
                    {post.is_anonymous ? 'Anonymous Soul' : 'Community Member'}
                  </span>
                </div>
                <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">
                  {new Date(post.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-text-muted leading-relaxed mb-6 text-sm">
                {post.content}
              </p>
              <div className="flex items-center gap-4 pt-4 border-t border-primary/6">
                <button className="flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-accent-warm transition-colors">
                  <Heart size={14} />
                  Support
                </button>
                <button className="flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-primary transition-colors">
                  <MessageSquare size={14} />
                  Reply
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </section>

      {/* Safety Note */}
      <div className="glass p-4 rounded-2xl flex items-start gap-3">
        <AlertCircle size={18} className="flex-shrink-0 mt-0.5 text-accent" />
        <p className="text-xs leading-relaxed text-text-muted">
          <strong className="text-accent">Community Guidelines:</strong> Please be kind and respectful. This is a safe space for everyone to express themselves. Harassment or hate speech will result in an immediate ban.
        </p>
      </div>
    </div>
  );
}

export type Mood = 'happy' | 'sad' | 'anxious' | 'lonely' | 'stressed' | 'neutral';

export interface UserProfile {
  id: string;
  full_name: string;
  avatar_url?: string;
  onboarded: boolean;
}

export interface PersonalityOnboarding {
  communication_style: string;
  coping_mechanism: string;
  preferred_language: string;
  age_group: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  mood?: Mood;
  created_at: string;
}

export interface DailyReflection {
  id: string;
  date: string;
  answers: Record<string, string>;
  mood: Mood;
}

export interface CommunityPost {
  id: string;
  content: string;
  is_anonymous: boolean;
  created_at: string;
  user_id?: string;
}

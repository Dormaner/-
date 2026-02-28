import { supabase } from './supabase';

export interface UserToken {
  username: string;
}

export interface ScoreRecord {
  score: number;
  date: string; // ISO string
}

export const registerUser = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('snake_users')
      .insert([{ username, password }]);

    if (error) {
      if (error.code === '23505') { // Unique violation
        return { success: false, error: 'User already exists' };
      }
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
};

export const loginUser = async (username: string, password: string): Promise<{ success: boolean; token?: UserToken; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('snake_users')
      .select('password')
      .eq('username', username)
      .single();

    if (error || !data) {
      return { success: false, error: 'User not found' };
    }

    if (data.password !== password) {
      return { success: false, error: 'Incorrect password' };
    }

    return { success: true, token: { username } };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
};

export const saveScore = async (username: string, score: number): Promise<void> => {
  try {
    const { error } = await supabase
      .from('snake_scores')
      .insert([{ username, score }]);

    if (error) console.error("Error saving score to Supabase", error);
  } catch (err) {
    console.error("Exception saving score to Supabase", err);
  }
};

export const getUserScores = async (username: string): Promise<ScoreRecord[]> => {
  try {
    const { data, error } = await supabase
      .from('snake_scores')
      .select('score, created_at')
      .eq('username', username)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching user scores", error);
      return [];
    }

    return (data || []).map(record => ({
      score: record.score,
      date: record.created_at
    }));
  } catch (err) {
    console.error("Exception fetching user scores", err);
    return [];
  }
};

export const getGlobalHighScores = async (): Promise<{ username: string; score: number }[]> => {
  try {
    const { data, error } = await supabase
      .from('snake_scores')
      .select('username, score')
      .order('score', { ascending: false })
      .limit(10);

    if (error) {
      console.error("Error fetching global high scores", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("Exception fetching global high scores", err);
    return [];
  }
};

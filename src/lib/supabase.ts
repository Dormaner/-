import { createClient } from '@supabase/supabase-js';

// Get keys from environment variables or hardcode them (for learning purposes)
const supabaseUrl = 'https://lhnhezzayackcgvwxgoz.supabase.co';
const supabaseKey = 'sb_publishable_Qd1Ap61mzaM28GqypPhpQQ_RgvYFXEo'; // Publishable key provided by user screen

export const supabase = createClient(supabaseUrl, supabaseKey);

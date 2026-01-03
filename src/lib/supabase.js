import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rccwlaxwbwaoyjvunftk.supabase.co';
const supabaseAnonKey = 'sb_publishable_UDfAWvs4L5CeLsXc1jldDQ_YR9ktjKH';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

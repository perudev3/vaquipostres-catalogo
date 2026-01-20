import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xseiakfnbcjspcsdfqrb.supabase.co';
const supabaseAnonKey = 'sb_publishable_yZu6p4mr9S2ulOooHJQxGg_n4GHgWZY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

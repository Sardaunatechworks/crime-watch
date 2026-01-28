import { createClient } from '@supabase/supabase-js';

// Get environment variables from .env.local
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ CRITICAL: Supabase credentials not configured!');
  console.error('Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local');
  console.error('Supabase URL:', SUPABASE_URL ? '✓ Found' : '✗ Missing');
  console.error('Supabase Key:', SUPABASE_ANON_KEY ? '✓ Found' : '✗ Missing');
} else {
  console.log('✓ Supabase credentials loaded successfully');
  console.log('✓ Connecting to:', SUPABASE_URL.split('.')[0] + '...');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

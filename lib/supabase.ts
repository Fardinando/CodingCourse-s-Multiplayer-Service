import { createClient } from '@supabase/supabase-js';

// INSTÂNCIA A: Login (CodingCourse)
const authUrl = process.env.NEXT_PUBLIC_AUTH_SUPABASE_URL || 'https://placeholder.supabase.co';
const authKey = process.env.NEXT_PUBLIC_AUTH_SUPABASE_ANON_KEY || 'placeholder';

export const authSupabase = createClient(authUrl, authKey);

// INSTÂNCIA B: Armas/Jogos (Storage)
const gameUrl = process.env.NEXT_PUBLIC_GAME_SUPABASE_URL || 'https://placeholder.supabase.co';
const gameKey = process.env.NEXT_PUBLIC_GAME_SUPABASE_ANON_KEY || 'placeholder';

export const gameSupabase = createClient(gameUrl, gameKey);

// Admin bypass para Vercel
const serviceKey = process.env.GAME_SUPABASE_SERVICE_ROLE_KEY || 'placeholder';
export const gameAdmin = createClient(gameUrl, serviceKey);

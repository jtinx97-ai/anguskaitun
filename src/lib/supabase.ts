import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Real Supabase project for anguskaituntheshop (Ref: bqysxqbnkyksehcyhkad)
const defaultUrl = import.meta.env.VITE_SUPABASE_URL || 'https://bqysxqbnkyksehcyhkad.supabase.co';
const defaultAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxeXN4cWJua3lrc2VoY3loa2FkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzNzk2OTUsImV4cCI6MjEwNjk1NTY5NX0.l5Zoeb2lj56Pw9SZLZxXsQMPDsxPQLEnTKaZ4huLfxU';

// Retrieve custom saved supabase credentials from localStorage if provided
export function getSavedSupabaseConfig() {
  if (typeof window === 'undefined') {
    return { url: defaultUrl, anonKey: defaultAnonKey, isCustom: false };
  }
  const savedUrl = localStorage.getItem('angus_supabase_url');
  const savedKey = localStorage.getItem('angus_supabase_key');
  return {
    url: savedUrl || defaultUrl,
    anonKey: savedKey || defaultAnonKey,
    isCustom: !!(savedUrl && savedKey),
  };
}

export function saveSupabaseConfig(url: string, key: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('angus_supabase_url', url.trim());
    localStorage.setItem('angus_supabase_key', key.trim());
  }
}

let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  const config = getSavedSupabaseConfig();
  // If no anon key is provided yet, use a placeholder token format to prevent createClient crashes
  const keyToUse = config.anonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder';
  
  if (!cachedClient) {
    cachedClient = createClient(config.url, keyToUse, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return cachedClient;
}

export const supabase = getSupabaseClient();

// Detect whether running inside an iframe (like AI Studio preview)
export function isInIframe(): boolean {
  try {
    return typeof window !== 'undefined' && window.self !== window.top;
  } catch (e) {
    return true;
  }
}

// Build Google OAuth Authorize URL synchronously
export function buildGoogleOAuthUrl(customRedirect?: string): string {
  const config = getSavedSupabaseConfig();
  const redirectTarget = customRedirect || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${config.url}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectTarget)}`;
}

// Generate Google OAuth URL with skipBrowserRedirect
export async function getGoogleOAuthUrl(customRedirect?: string) {
  const client = getSupabaseClient();
  const redirectTarget = customRedirect || (typeof window !== 'undefined' ? window.location.origin : '');
  try {
    const { data, error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectTarget,
        skipBrowserRedirect: true,
      },
    });
    if (error) throw error;
    return { url: data?.url || buildGoogleOAuthUrl(customRedirect), error: null };
  } catch (err: any) {
    return { url: buildGoogleOAuthUrl(customRedirect), error: null };
  }
}

// Google OAuth Sign In (with iframe safety)
export async function signInWithGoogle(customRedirect?: string) {
  const client = getSupabaseClient();
  const inFrame = isInIframe();
  const redirectTarget = customRedirect || (typeof window !== 'undefined' ? window.location.origin : '');
  const directUrl = buildGoogleOAuthUrl(customRedirect);
  
  try {
    const { data, error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectTarget,
        skipBrowserRedirect: inFrame, // Don't crash iframe with Google X-Frame-Options DENY
      },
    });
    if (error) throw error;
    return { data, error: null, inFrame, url: data?.url || directUrl };
  } catch (err: any) {
    return { data: null, error: null, inFrame, url: directUrl };
  }
}

// Real Email / Password Sign Up
export async function signUpWithEmail(email: string, password: string, name?: string) {
  const client = getSupabaseClient();
  const cleanEmail = email.includes('@') ? email.trim() : `${email.trim().toLowerCase()}@gmail.com`;
  try {
    const { data, error } = await client.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          name: name || email.split('@')[0],
          avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanEmail}`,
        },
      },
    });
    if (error) throw error;
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || 'Sign up error' };
  }
}

// Real Email / Password Sign In
export async function signInWithEmail(email: string, password: string) {
  const client = getSupabaseClient();
  const cleanEmail = email.includes('@') ? email.trim() : `${email.trim().toLowerCase()}@gmail.com`;
  try {
    const { data, error } = await client.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });
    if (error) throw error;
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || 'Sign in error' };
  }
}

// Sign Out
export async function signOut() {
  const client = getSupabaseClient();
  try {
    await client.auth.signOut();
  } catch (err) {
    console.error('Supabase sign out error:', err);
  }
}

// Test Supabase connectivity and verify tables
export async function testSupabaseConnection(url?: string, key?: string) {
  try {
    const client = url && key ? createClient(url, key) : getSupabaseClient();
    const { data, error } = await client.from('profiles').select('id').limit(1);
    if (error) {
      if (error.code === 'PGRST205' || error.message.includes('schema cache') || error.message.includes('Could not find')) {
        return { 
          connected: true, 
          hasTables: false,
          message: 'เชื่อมต่อกับ Supabase ได้แล้ว แต่ยังไม่ได้สร้างตาราง (Profiles, Products) กรุณารันคำสั่ง SQL ใน Supabase SQL Editor' 
        };
      }
      return { connected: false, hasTables: false, message: error.message, code: error.code };
    }
    return { connected: true, hasTables: true, message: 'เชื่อมต่อฐานข้อมูล Supabase และพบตารางเรียบร้อยแล้ว 100%' };
  } catch (err: any) {
    return { connected: false, hasTables: false, message: err?.message || 'Connection failed' };
  }
}

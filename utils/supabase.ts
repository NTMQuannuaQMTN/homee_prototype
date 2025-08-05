import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Your Supabase credentials
const supabaseUrl = "https://qzscwitzosfsxajwcdwu.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6c2N3aXR6b3Nmc3hhandjZHd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwMTc1OTIsImV4cCI6MjA2OTU5MzU5Mn0.NKNRGq6s3lSefOsvCQ_QY50cSzE3nrABdU2fa9luHAo";

// Create a single Supabase client for use throughout your app
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
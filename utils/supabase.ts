import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Your Supabase credentials
const supabaseUrl = "https://vljucxtqozauseouhzud.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsanVjeHRxb3phdXNlb3VoenVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExNTM3MzEsImV4cCI6MjA2NjcyOTczMX0.hjACakd7Ndr-l5ZuUvcjI7_1pAE9RIhxcHG1ydM5j94";

// Create a single Supabase client for use throughout your app
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
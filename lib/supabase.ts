import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Get environment variables from Expo Constants for better compatibility
const supabaseUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Validation function that returns error messages instead of throwing
function validateSupabaseConfig(): string | null {
  if (!supabaseUrl || !supabaseAnonKey) {
    return 'Missing Supabase environment variables. Please check your .env file.';
  }

  // Validate URL format
  try {
    new URL(supabaseUrl);
  } catch (error) {
    return 'Invalid Supabase URL format. Please check your EXPO_PUBLIC_SUPABASE_URL in .env file.';
  }

  // Validate that the anon key is not a placeholder
  if (supabaseAnonKey.includes('your-') || supabaseAnonKey === '') {
    return 'Invalid Supabase anon key. Please check your EXPO_PUBLIC_SUPABASE_ANON_KEY in .env file.';
  }

  return null;
}

// Validate configuration
const configError = validateSupabaseConfig();

// Declare supabase variable at top level
let supabase: any;

if (configError) {
  console.warn('Supabase Configuration Warning:', configError);
  // Create a mock client that returns resolved promises with null data and error messages
  supabase = {
    auth: {
      signUp: () => Promise.resolve({ data: { user: null, session: null }, error: { message: configError } }),
      signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: { message: configError } }),
      signOut: () => Promise.resolve({ error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: { message: configError } }),
      onAuthStateChange: (callback: any) => {
        // Call callback immediately with null session
        callback('SIGNED_OUT', null);
        return { 
          data: { 
            subscription: { 
              unsubscribe: () => {} 
            } 
          }, 
          error: null 
        };
      },
    },
    from: () => ({
      select: () => Promise.resolve({ data: null, error: { message: configError } }),
      insert: () => Promise.resolve({ data: null, error: { message: configError } }),
      update: () => Promise.resolve({ data: null, error: { message: configError } }),
      delete: () => Promise.resolve({ data: null, error: { message: configError } }),
      upsert: () => Promise.resolve({ data: null, error: { message: configError } }),
    }),
    rpc: () => Promise.resolve({ data: null, error: { message: configError } }),
  };
} else {
  supabase = createClient<Database>(supabaseUrl!, supabaseAnonKey!);
}

// Export at top level
export { supabase };

// Export validation function for use in components if needed
export const getSupabaseConfigError = () => configError;

// Add global error handler for unhandled promise rejections
// Only add event listener if we're in a browser environment and addEventListener exists
if (Platform.OS === 'web' && typeof window !== 'undefined' && window.addEventListener) {
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    // Prevent the default behavior (which would crash the app)
    event.preventDefault();
  });
}

// For Node.js environments (like during build)
if (typeof process !== 'undefined' && process.on) {
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't exit the process, just log the error
  });
}
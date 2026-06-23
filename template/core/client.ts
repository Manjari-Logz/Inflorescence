// @ts-nocheck
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-url-polyfill/auto';
import { SupabaseConfig } from './types';
import { OfflineQueryBuilder } from './OfflineQueryBuilder';

// Initialize global offline mode variable
if (typeof (global as any).isOfflineMode === 'undefined') {
  (global as any).isOfflineMode = false;
}

class OfflineSupabaseClient {
  from(table: string) {
    return new OfflineQueryBuilder(table);
  }
  auth = {
    onAuthStateChange: (callback: any) => {
      // Set up simple callback if there's a user, otherwise return mock unsubscribable
      return { data: { subscription: { unsubscribe: () => {} } } };
    },
    getSession: async () => {
      try {
        const saved = await AsyncStorage.getItem('@offline_user');
        if (saved) {
          const user = JSON.parse(saved);
          return { data: { session: { user } }, error: null };
        }
      } catch (e) {}
      return { data: { session: null }, error: null };
    },
    signInWithOtp: async () => ({ error: null }),
    verifyOtp: async (params: any) => {
      const mockUser = {
        id: 'offline-user',
        email: params.email || 'offline@inflorescence.app',
        username: params.email ? params.email.split('@')[0] : 'Offline User',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      await AsyncStorage.setItem('@offline_user', JSON.stringify(mockUser));
      return { data: { user: mockUser, session: { user: mockUser } }, error: null };
    },
    signUp: async (params: any) => {
      const mockUser = {
        id: 'offline-user',
        email: params.email || 'offline@inflorescence.app',
        username: params.email ? params.email.split('@')[0] : 'Offline User',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      await AsyncStorage.setItem('@offline_user', JSON.stringify(mockUser));
      return { data: { user: mockUser, session: { user: mockUser } }, error: null };
    },
    signInWithPassword: async (params: any) => {
      const mockUser = {
        id: 'offline-user',
        email: params.email || 'offline@inflorescence.app',
        username: params.email ? params.email.split('@')[0] : 'Offline User',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      await AsyncStorage.setItem('@offline_user', JSON.stringify(mockUser));
      return { data: { user: mockUser, session: { user: mockUser } }, error: null };
    },
    signOut: async () => {
      await AsyncStorage.removeItem('@offline_user');
      return { error: null };
    },
    refreshSession: async () => ({ error: null }),
    resetPasswordForEmail: async () => ({ error: null }),
  };
  storage = {
    from: () => ({
      upload: async () => ({ data: null, error: new Error('Offline') }),
      getPublicUrl: () => ({ data: { publicUrl: '' } }),
    }),
  };
}

class SupabaseManager {
  private static instance: SupabaseClient | null = null;
  private static creating = false;
  private static creationCount = 0;

  static getClient(): SupabaseClient {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey || (global as any).isOfflineMode) {
      if (!(global as any).isOfflineMode) {
        console.warn('[Template:Client] Supabase credentials missing. Switching to Offline Mode.');
        (global as any).isOfflineMode = true;
      }
      return new OfflineSupabaseClient() as any;
    }

    if (this.instance) {
      return this.instance;
    }

    if (this.creating) {
      console.warn('[Template:Client] Client is currently being created, returning a fallback proxy');
      return new OfflineSupabaseClient() as any;
    }

    this.creating = true;
    this.creationCount++;
    
    try {
      console.log(`[Template:Client] Creating Supabase client instance #${this.creationCount}`);
      
      this.instance = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          storage: this.createStorageAdapter(),
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: Platform.OS === 'web',
          flowType: 'pkce',
        },
      });
      
      console.log('[Template:Client] Supabase client created successfully');
      return this.instance;
      
    } catch (e) {
      console.error('[Template:Client] Failed to construct Supabase client, falling back offline:', e);
      (global as any).isOfflineMode = true;
      return new OfflineSupabaseClient() as any;
    } finally {
      this.creating = false;
    }
  }

  private static createStorageAdapter = () => {
    if (Platform.OS === 'web') {
      return {
        getItem: (key: string) => {
          if (typeof window !== 'undefined' && window.localStorage) {
            return Promise.resolve(window.localStorage.getItem(key));
          }
          return Promise.resolve(null);
        },
        setItem: (key: string, value: string) => {
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem(key, value);
            return Promise.resolve();
          }
          return Promise.resolve();
        },
        removeItem: (key: string) => {
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.removeItem(key);
            return Promise.resolve();
          }
          return Promise.resolve();
        },
      };
    } else {
      return AsyncStorage;
    }
  }
}

export const getSharedSupabaseClient = (): SupabaseClient => {
  return SupabaseManager.getClient();
};

export const safeSupabaseOperation = async <T>(
  operation: (client: SupabaseClient) => Promise<T>
): Promise<T> => {
  try {
    const client = getSharedSupabaseClient();
    return await operation(client);
  } catch (error) {
    console.warn('[Template:Client] safeSupabaseOperation failed, switching to offline mode:', error);
    (global as any).isOfflineMode = true;
    const offlineClient = getSharedSupabaseClient();
    return await operation(offlineClient);
  }
};



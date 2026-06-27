import { useContext, createContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import supabase from '@/lib/supabase';

interface AuthUser {
  id: string;
  email?: string;
  username?: string;
  user_metadata?: any;
}

interface AuthContextType {
  user: AuthUser | null;
  error: string | null;
  needsEmailConfirmation: boolean;
  loading: boolean;
  operationLoading: boolean;
  initialized: boolean;
  setOperationLoading: (loading: boolean) => void;
  signInWithPassword: (email: string, password: string) => Promise<{ error?: string; user: AuthUser | null }>;
  signUpWithPassword: (email: string, password: string, metadata?: Record<string, any>) => Promise<{ error?: string; user: AuthUser | null; needsEmailConfirmation?: boolean }>;
  sendOTP: (email: string) => Promise<{ error?: string }>;
  verifyOTPAndLogin: (email: string, token: string) => Promise<{ error?: string; user: AuthUser | null }>;
  resendOTP: (email: string) => Promise<{ error?: string }>;
  logout: () => Promise<{ error?: string }>;
  refreshSession: () => Promise<void>;
  updateProfile: (metadata: Record<string, any>) => Promise<{ error?: string }>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('[AuthContext] Session loaded:', session ? 'Session exists' : 'No session');
        
        if (mounted) {
          if (session?.user) {
            setUser({
              id: session.user.id,
              email: session.user.email,
              user_metadata: session.user.user_metadata,
            });
            console.log('[AuthContext] User set from session:', session.user.email);
          }
          setLoading(false);
          setInitialized(true);
        }
      } catch (error) {
        console.error('[AuthContext] Error loading session:', error);
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    }

    loadSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      console.log('[AuthContext] onAuthStateChange:', event, session ? 'Session exists' : 'No session');
      if (mounted) {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email,
            user_metadata: session.user.user_metadata,
          });
          console.log('[AuthContext] User updated from auth state change:', session.user.email);
          setError(null);
          setNeedsEmailConfirmation(false);
        } else {
          setUser(null);
          console.log('[AuthContext] User cleared from auth state change');
        }
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithPassword = async (email: string, password: string) => {
    console.log('[AuthContext] Calling signInWithPassword for:', email);
    setOperationLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      console.log('[AuthContext] signInWithPassword result:', { hasData: !!data, error: error?.message });
      
      if (error) {
        setError(error.message);
        console.log('[AuthContext] Login failed:', error.message);
        return { error: error.message, user: null };
      }
      
      if (data.user && data.session) {
        console.log('[AuthContext] Login success for:', data.user.email);
        console.log('[AuthContext] Session created successfully');
        return { user: { id: data.user.id, email: data.user.email, user_metadata: data.user.user_metadata } };
      }
      
      return { user: null };
    } catch (error) {
      console.log('[AuthContext] signInWithPassword error:', error);
      setError('Login failed');
      return { error: 'Login failed', user: null };
    } finally {
      setOperationLoading(false);
    }
  };

  const signUpWithPassword = async (email: string, password: string, metadata?: Record<string, any>) => {
    console.log('[AuthContext] Calling signUpWithPassword for:', email);
    setOperationLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });
      console.log('[AuthContext] signUpWithPassword result:', { hasData: !!data, error: error?.message, hasSession: !!data?.session });
      
      if (error) {
        setError(error.message);
        console.log('[AuthContext] Signup failed:', error.message);
        return { error: error.message, user: null };
      }
      
      if (data.user) {
        const needsConfirmation = !data.session;
        setNeedsEmailConfirmation(needsConfirmation);
        if (needsConfirmation) {
          console.log('[AuthContext] Signup success - email confirmation required');
        } else {
          console.log('[AuthContext] Signup success - auto-login enabled (no email confirmation)');
          console.log('[AuthContext] Session created automatically');
        }
        return { user: { id: data.user.id, email: data.user.email, user_metadata: data.user.user_metadata }, needsEmailConfirmation: needsConfirmation };
      }
      
      return { user: null };
    } catch (error) {
      console.log('[AuthContext] signUpWithPassword error:', error);
      setError('Registration failed');
      return { error: 'Registration failed', user: null };
    } finally {
      setOperationLoading(false);
    }
  };

  const logout = async () => {
    setOperationLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        return { error: error.message };
      }
      return {};
    } catch (error) {
      return { error: 'Logout failed' };
    } finally {
      setOperationLoading(false);
    }
  };

  const sendOTP = async (email: string) => {
    console.log('[AuthContext] Calling sendOTP for:', email);
    setOperationLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({ email });
      console.log('[AuthContext] sendOTP result:', { error: error?.message });
      if (error) {
        setError(error.message);
        return { error: error.message };
      }
      console.log('[AuthContext] OTP sent successfully');
      return {};
    } catch (error) {
      console.log('[AuthContext] sendOTP error:', error);
      setError('Failed to send OTP');
      return { error: 'Failed to send OTP' };
    } finally {
      setOperationLoading(false);
    }
  };

  const verifyOTPAndLogin = async (email: string, token: string) => {
    console.log('[AuthContext] Calling verifyOTPAndLogin for:', email);
    setOperationLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      });
      console.log('[AuthContext] verifyOTPAndLogin result:', { hasData: !!data, error: error?.message });
      
      if (error) {
        setError(error.message);
        console.log('[AuthContext] OTP verification failed:', error.message);
        return { error: error.message, user: null };
      }
      
      if (data.user && data.session) {
        console.log('[AuthContext] OTP verification success for:', data.user.email);
        console.log('[AuthContext] Session created successfully');
        return { user: { id: data.user.id, email: data.user.email, user_metadata: data.user.user_metadata } };
      }
      
      return { user: null };
    } catch (error) {
      console.log('[AuthContext] verifyOTPAndLogin error:', error);
      setError('OTP verification failed');
      return { error: 'OTP verification failed', user: null };
    } finally {
      setOperationLoading(false);
    }
  };

  const resendOTP = async (email: string) => {
    console.log('[AuthContext] Calling resendOTP for:', email);
    setOperationLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({ email });
      console.log('[AuthContext] resendOTP result:', { error: error?.message });
      if (error) {
        setError(error.message);
        return { error: error.message };
      }
      console.log('[AuthContext] OTP resent successfully');
      return {};
    } catch (error) {
      console.log('[AuthContext] resendOTP error:', error);
      setError('Failed to resend OTP');
      return { error: 'Failed to resend OTP' };
    } finally {
      setOperationLoading(false);
    }
  };

  const refreshSession = async () => {
    try {
      await supabase.auth.refreshSession();
    } catch (error) {
      console.error('[AuthContext] Error refreshing session:', error);
    }
  };

  const updateProfile = async (metadata: Record<string, any>) => {
    try {
      setOperationLoading(true);
      const { error } = await supabase.auth.updateUser({
        data: metadata,
      });
      if (error) {
        console.error('[AuthContext] updateProfile error:', error);
        return { error: error.message };
      }
      // Refresh user data after update
      const { data: { user: updatedUser } } = await supabase.auth.getUser();
      if (updatedUser) {
        setUser({
          id: updatedUser.id,
          email: updatedUser.email,
          username: updatedUser.user_metadata?.username,
          user_metadata: updatedUser.user_metadata,
        });
      }
      console.log('[AuthContext] Profile updated successfully');
      return {};
    } catch (error) {
      console.error('[AuthContext] updateProfile error:', error);
      return { error: 'Failed to update profile' };
    } finally {
      setOperationLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setOperationLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) {
        console.error('[AuthContext] resetPassword error:', error);
        return { error: error.message };
      }
      console.log('[AuthContext] Password reset email sent successfully');
      return {};
    } catch (error) {
      console.error('[AuthContext] resetPassword error:', error);
      return { error: 'Failed to send password reset email' };
    } finally {
      setOperationLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        error,
        needsEmailConfirmation,
        loading,
        operationLoading,
        initialized,
        setOperationLoading,
        signInWithPassword,
        signUpWithPassword,
        sendOTP,
        verifyOTPAndLogin,
        resendOTP,
        logout,
        refreshSession,
        updateProfile,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

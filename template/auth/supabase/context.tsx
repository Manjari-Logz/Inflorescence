// @ts-nocheck
import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthUser } from '../types';
import { authService } from './service';

interface AuthContextState {
  user: AuthUser | null;
  loading: boolean;
  operationLoading: boolean;
  initialized: boolean;
}

interface AuthContextActions {
  setOperationLoading: (loading: boolean) => void;
}

type AuthContextType = AuthContextState & AuthContextActions;

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthContextState>({
    user: null,
    loading: true,
    operationLoading: false,
    initialized: false,
  });

  const updateState = (updates: Partial<AuthContextState>) => {
    setState(prevState => {
      const newState = { ...prevState, ...updates };
      return newState;
    });
  };

  const setOperationLoading = (loading: boolean) => {
    updateState({ operationLoading: loading });
  };

  useEffect(() => {
    let isMounted = true;
    let authSubscription: any = null;

    const initializeAuth = async () => {
      let resolved = false;
      const safetyTimeout = setTimeout(async () => {
        if (!resolved && isMounted) {
          console.warn('[Template:AuthProvider] Auth initialization timed out. Proceeding offline.');
          (global as any).isOfflineMode = true;
          let offlineUser = null;
          try {
            const cached = await AsyncStorage.getItem('@offline_user');
            offlineUser = cached ? JSON.parse(cached) : {
              id: 'offline-user',
              email: 'offline@inflorescence.app',
              username: 'Offline User',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            await AsyncStorage.setItem('@offline_user', JSON.stringify(offlineUser));
          } catch (e) {
            offlineUser = {
              id: 'offline-user',
              email: 'offline@inflorescence.app',
              username: 'Offline User',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
          }
          updateState({ 
            user: offlineUser, 
            loading: false, 
            initialized: true 
          });
        }
      }, 3000);

      try {
        const currentUser = await authService.getCurrentUser();
        resolved = true;
        clearTimeout(safetyTimeout);
        
        if (isMounted) {
          updateState({ 
            user: currentUser, 
            loading: false, 
            initialized: true 
          });
        }

        authSubscription = authService.onAuthStateChange((authUser) => {
          if (isMounted) {
            updateState({ user: authUser });
          }
        });

      } catch (error) {
        resolved = true;
        clearTimeout(safetyTimeout);
        console.warn('[Template:AuthProvider] Auth initialization failed, falling back offline:', error);
        (global as any).isOfflineMode = true;
        let offlineUser = null;
        try {
          const cached = await AsyncStorage.getItem('@offline_user');
          offlineUser = cached ? JSON.parse(cached) : {
            id: 'offline-user',
            email: 'offline@inflorescence.app',
            username: 'Offline User',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          await AsyncStorage.setItem('@offline_user', JSON.stringify(offlineUser));
        } catch (e) {
          offlineUser = {
            id: 'offline-user',
            email: 'offline@inflorescence.app',
            username: 'Offline User',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
        }
        if (isMounted) {
          updateState({ 
            user: offlineUser, 
            loading: false, 
            initialized: true 
          });
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
      if (authSubscription?.unsubscribe) {
        authSubscription.unsubscribe();
      }
    };
  }, []); // Empty dependency array ensures single execution
  const contextValue: AuthContextType = {
    ...state,
    setOperationLoading,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// useAuthContext Hook - internal use
export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  
  return context;
}
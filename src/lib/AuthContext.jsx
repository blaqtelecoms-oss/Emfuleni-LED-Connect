import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Build a merged user object from the Supabase auth user + app_users record.
  const buildUser = async (authUser) => {
    if (!authUser) return null;

    // Derive account_type: admin role → officer, otherwise check app_users
    const role = authUser.user_metadata?.base44_role || 'user';
    const base44UserId = authUser.user_metadata?.base44_user_id;
    const fullName = authUser.user_metadata?.full_name || authUser.email;

    // Try to look up the app_users record for extended profile data
    let appUserRecord = null;
    if (supabase) {
      const { data } = await supabase
        .from('app_users')
        .select('*')
        .eq('supabase_auth_id', authUser.id)
        .maybeSingle();
      appUserRecord = data;
    }

    // account_type: prefer app_users, then derive from role
    const accountType =
      appUserRecord?.account_type ||
      authUser.user_metadata?.account_type ||
      (role === 'admin' ? 'officer' : null);

    return {
      id: base44UserId || appUserRecord?.id || authUser.id,
      supabase_id: authUser.id,
      email: authUser.email,
      full_name: appUserRecord?.full_name || fullName,
      role,
      account_type: accountType,
      phone: appUserRecord?.phone,
      area: appUserRecord?.area,
      officer_role: appUserRecord?.officer_role,
      ...appUserRecord, // spread any remaining fields
      // Re-set the computed fields in case the spread overwrote them
      id: base44UserId || appUserRecord?.id || authUser.id,
      supabase_id: authUser.id,
      email: authUser.email,
      role,
      account_type: accountType,
    };
  };

  const checkAppState = async () => {
    // No Base44 public settings to fetch — mark loaded immediately
    setIsLoadingPublicSettings(false);

    try {
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const authUser = session.user;
          const mergedUser = await buildUser(authUser);
          setUser(mergedUser);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth state check failed:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  };

  const checkUserAuth = async () => {
    try {
      setIsLoadingAuth(true);
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const mergedUser = await buildUser(session.user);
          setUser(mergedUser);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      }
    } catch (error) {
      console.error('User auth check failed:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  };

  useEffect(() => {
    checkAppState();

    // Listen for auth state changes (login, logout, token refresh)
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
          if (session) {
            const mergedUser = await buildUser(session.user);
            setUser(mergedUser);
            setIsAuthenticated(true);
          } else {
            setUser(null);
            setIsAuthenticated(false);
          }
          setIsLoadingAuth(false);
          setAuthChecked(true);
        }
      );
      return () => subscription.unsubscribe();
    }
  }, []);

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    if (supabase) {
      supabase.auth.signOut();
    }
    if (shouldRedirect) {
      window.location.href = '/';
    }
  };

  const navigateToLogin = () => {
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      authChecked,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

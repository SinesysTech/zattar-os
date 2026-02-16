/**
 * Hook para gerenciar autenticação e detectar expiração de sessão
 * 
 * Faz logout automático quando detecta que a sessão expirou e
 * redireciona para a página de login.
 */

'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface UseAuthResult {
  user: User | null;
  sessionToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  checkSession: () => Promise<boolean>;
}

/**
 * Hook para verificar autenticação e gerenciar logout automático
 */
export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<User | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  // Memoizar cliente Supabase para evitar recriação a cada render
  const supabase = useMemo(() => createClient(), []);
  const logoutInProgressRef = useRef(false);

  /**
   * Verifica se a sessão está válida
   */
  const checkSession = useCallback(async (): Promise<boolean> => {
    try {
      const [userResult, sessionResult] = await Promise.all([
        supabase.auth.getUser(),
        supabase.auth.getSession(),
      ]);

      const { data: { user: currentUser }, error } = userResult;
      const { data: { session } } = sessionResult;

      if (error || !currentUser) {
        setUser(null);
        setSessionToken(null);
        return false;
      }

      setUser(currentUser);
      setSessionToken(session?.access_token ?? null);
      return true;
    } catch (error) {
      console.error('Erro ao verificar sessão:', error);
      setUser(null);
      setSessionToken(null);
      return false;
    }
  }, [supabase]);

  /**
   * Faz logout limpando sessão e cookies
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      // Tentar logout via Supabase (pode falhar se sessão já expirou)
      try {
        await supabase.auth.signOut();
      } catch {
        // Ignorar erros de signOut quando a sessão já expirou
        console.log('Sessão já expirada, limpando cookies via API');
      }

      // Sempre chamar API de logout para limpar cookies mesmo sem sessão válida
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        console.warn('Erro ao fazer logout via API, mas continuando...');
      }

      // Limpar localStorage criptografado
      if (typeof window !== 'undefined') {
        const keysToRemove = [
          'chat-notifications',
          'chat-unread-counts',
          'call-layout'
        ];
        keysToRemove.forEach(key => localStorage.removeItem(key));
      }

      setUser(null);
      setSessionToken(null);
      router.push('/app/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      // Mesmo com erro, redirecionar para login
      setUser(null);
      setSessionToken(null);
      router.push('/app/login');
    }
  }, [supabase, router]);

  useEffect(() => {
    let mounted = true;
    let intervalId: NodeJS.Timeout | null = null;

    /**
     * Verifica sessão periodicamente
     */
    const verifySession = async () => {
      if (!mounted || logoutInProgressRef.current) return;

      const isValid = await checkSession();
      setIsLoading(false);

      // Se sessão não é válida e estamos em uma rota protegida, fazer logout
      if (!isValid) {
        // Verificar se estamos em uma rota protegida
        const currentPath = window.location.pathname;
        const publicRoutes = ['/app/login', '/app/sign-up', '/app/confirm', '/app/forgot-password', '/app/update-password'];
        const isPublicRoute = publicRoutes.some((route) => currentPath.startsWith(route));

        if (!isPublicRoute && !logoutInProgressRef.current) {
          console.log('Sessão expirada detectada, fazendo logout automático');
          logoutInProgressRef.current = true;
          await logout();
        }
      }
    };

    // Verificar sessão imediatamente
    verifySession();

    // Verificar sessão a cada 5 minutos (300000ms)
    intervalId = setInterval(verifySession, 300000);

    // Escutar mudanças de autenticação do Supabase
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted || logoutInProgressRef.current) return;

      if (session?.user) {
        setUser(session.user);
        setSessionToken(session.access_token);
        setIsLoading(false);
        logoutInProgressRef.current = false; // Reset flag se login aconteceu
      } else {
        // Sessão expirou ou foi removida
        setUser(null);
        setSessionToken(null);
        setIsLoading(false);

        // Se estamos em uma rota protegida, fazer logout
        const currentPath = window.location.pathname;
        const publicRoutes = ['/app/login', '/app/sign-up', '/app/confirm', '/app/forgot-password', '/app/update-password'];
        const isPublicRoute = publicRoutes.some((route) => currentPath.startsWith(route));

        if (!isPublicRoute && !logoutInProgressRef.current) {
          console.log('Mudança de estado de auth detectada (sessão expirada), fazendo logout');
          logoutInProgressRef.current = true;
          logout();
        }
      }
    });

    return () => {
      mounted = false;
      logoutInProgressRef.current = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
      subscription.unsubscribe();
    };
  }, [checkSession, logout, supabase]);

  return {
    user,
    sessionToken,
    isLoading,
    isAuthenticated: !!user,
    logout,
    checkSession,
  };
}

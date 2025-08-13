import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

interface AppUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'corretor' | 'gestor' | 'dono';
  status: 'ativo' | 'inativo' | 'pendente';
  company_id?: string;
  is_super_admin?: boolean;
}

interface AuthContextType {
  user: AppUser | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  loading: boolean;
  updateProfile: (data: Partial<AppUser>) => Promise<{ success: boolean; error?: string }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Limpar qualquer cache local ao inicializar
    localStorage.removeItem('crm_user');
    sessionStorage.clear();
    
    // Setup auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        
        if (session?.user) {
          // Defer Supabase calls with setTimeout
          setTimeout(async () => {
            await fetchUserProfile(session.user.id);
          }, 0);
        } else {
          setUser(null);
          localStorage.removeItem('crm_user');
        }
      }
    );

    // Then check for existing session - sempre buscar dados atualizados do servidor
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar perfil do usuário:', error);
        setLoading(false);
        return;
      }

      if (userData) {
        const appUser: AppUser = {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          role: userData.role,
          status: userData.status,
          company_id: userData.company_id,
          is_super_admin: userData.company_id === null && userData.role === 'admin'
        };

        setUser(appUser);
        localStorage.setItem('crm_user', JSON.stringify(appUser));
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        setLoading(false);
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Buscar dados do usuário na tabela public.users
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle();

        if (userError || !userData) {
          setLoading(false);
          return { success: false, error: 'Erro ao carregar dados do usuário' };
        }

        const appUser: AppUser = {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          role: userData.role,
          status: userData.status,
          company_id: userData.company_id,
          is_super_admin: userData.company_id === null && userData.role === 'admin'
        };

        setUser(appUser);
        localStorage.setItem('crm_user', JSON.stringify(appUser));
        
        setLoading(false);
        return { success: true };
      }

      setLoading(false);
      return { success: false, error: 'Erro durante autenticação' };
    } catch (error) {
      setLoading(false);
      return { success: false, error: 'Erro interno do servidor' };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    localStorage.removeItem('crm_user');
  };

  const updateProfile = async (data: Partial<AppUser>) => {
    if (!user) return { success: false, error: 'Usuário não logado' };

    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: data.name,
          email: data.email
        })
        .eq('id', user.id);

      if (error) {
        return { success: false, error: 'Erro ao atualizar perfil' };
      }

      const updatedUser = { ...user, ...data } as AppUser;
      setUser(updatedUser);
      localStorage.setItem('crm_user', JSON.stringify(updatedUser));

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Erro interno do servidor' };
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!user) return { success: false, error: 'Usuário não logado' };

    try {
      // Usar a API nativa do Supabase Auth para alterar senha
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Erro interno do servidor' };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      login,
      logout,
      loading,
      updateProfile,
      changePassword
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
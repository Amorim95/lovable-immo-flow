import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'corretor';
  status: 'ativo' | 'inativo' | 'pendente';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  loading: boolean;
  updateProfile: (data: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar se há um usuário logado armazenado
    const storedUser = localStorage.getItem('crm_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase())
        .eq('status', 'ativo')
        .single();

      if (error || !data) {
        return { success: false, error: 'Email ou senha incorretos' };
      }

      // Verificar senha usando a função do banco
      const { data: passwordCheck } = await supabase
        .rpc('verify_password', {
          password: password,
          hash: data.password_hash
        });

      if (!passwordCheck) {
        return { success: false, error: 'Email ou senha incorretos' };
      }

      const userData: User = {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        status: data.status
      };

      setUser(userData);
      localStorage.setItem('crm_user', JSON.stringify(userData));
      
      return { success: true };
    } catch (error) {
      console.error('Erro no login:', error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('crm_user');
  };

  const updateProfile = async (data: Partial<User>) => {
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

      const updatedUser = { ...user, ...data };
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
      // Verificar senha atual
      const { data: currentUser } = await supabase
        .from('users')
        .select('password_hash')
        .eq('id', user.id)
        .single();

      if (!currentUser) {
        return { success: false, error: 'Usuário não encontrado' };
      }

      const { data: passwordCheck } = await supabase
        .rpc('verify_password', {
          password: currentPassword,
          hash: currentUser.password_hash
        });

      if (!passwordCheck) {
        return { success: false, error: 'Senha atual incorreta' };
      }

      // Gerar hash da nova senha
      const { data: newHash } = await supabase
        .rpc('crypt_password', { password: newPassword });

      if (!newHash) {
        return { success: false, error: 'Erro ao processar nova senha' };
      }

      // Atualizar senha
      const { error } = await supabase
        .from('users')
        .update({ password_hash: newHash })
        .eq('id', user.id);

      if (error) {
        return { success: false, error: 'Erro ao atualizar senha' };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Erro interno do servidor' };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
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
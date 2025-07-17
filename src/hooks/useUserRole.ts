
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UserRole {
  isAdmin: boolean;
  isGestor: boolean;
  isCorretor: boolean;
  loading: boolean;
  equipeId?: string;
}

export function useUserRole(): UserRole {
  const { user } = useAuth();
  const [roleInfo, setRoleInfo] = useState<UserRole>({
    isAdmin: false,
    isGestor: false,
    isCorretor: false,
    loading: true
  });

  useEffect(() => {
    if (!user) {
      setRoleInfo({
        isAdmin: false,
        isGestor: false,
        isCorretor: false,
        loading: false
      });
      return;
    }

    loadUserRole();
  }, [user]);

  const loadUserRole = async () => {
    if (!user) return;

    try {
      // Se o usuário tem um ID temporário (para desenvolvimento), assumir como admin
      if (user.id === 'temp-admin-id' || !user.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        console.log('Using temporary admin user for development');
        setRoleInfo({
          isAdmin: true,
          isGestor: false,
          isCorretor: false,
          loading: false
        });
        return;
      }

      // Buscar informações do usuário no banco
      const { data: userData, error } = await supabase
        .from('users')
        .select('role, equipe_id')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error loading user role:', error);
        // Em caso de erro, assumir como corretor para não bloquear a interface
        setRoleInfo({
          isAdmin: false,
          isGestor: false,
          isCorretor: true,
          loading: false
        });
        return;
      }

      setRoleInfo({
        isAdmin: userData?.role === 'admin',
        isGestor: userData?.role === 'gestor',
        isCorretor: userData?.role === 'corretor',
        equipeId: userData?.equipe_id,
        loading: false
      });

    } catch (error) {
      console.error('Error loading user role:', error);
      // Em caso de erro, assumir como corretor para não bloquear a interface
      setRoleInfo({
        isAdmin: false,
        isGestor: false,
        isCorretor: true,
        loading: false
      });
    }
  };

  return roleInfo;
}

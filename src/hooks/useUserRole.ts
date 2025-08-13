
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UserRole {
  isAdmin: boolean;
  isGestor: boolean;
  isCorretor: boolean;
  isDono: boolean;
  loading: boolean;
  equipeId?: string;
}

export function useUserRole(): UserRole {
  const { user } = useAuth();
  const [roleInfo, setRoleInfo] = useState<UserRole>({
    isAdmin: false,
    isGestor: false,
    isCorretor: false,
    isDono: false,
    loading: true,
    equipeId: undefined
  });

  useEffect(() => {
    if (!user) {
      setRoleInfo({
        isAdmin: false,
        isGestor: false,
        isCorretor: false,
        isDono: false,
        loading: false,
        equipeId: undefined
      });
      return;
    }

    // Como os dados do usuário já vêm do AuthContext, podemos usar diretamente
    setRoleInfo({
      isAdmin: user.role === 'admin',
      isGestor: user.role === 'gestor', 
      isCorretor: user.role === 'corretor',
      isDono: user.role === 'dono',
      loading: false,
      equipeId: undefined // Pode ser expandido se necessário
    });
  }, [user]);

  return roleInfo;
}

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UserPermissions {
  canViewAllLeads: boolean;
  canInviteUsers: boolean;
  isAdmin: boolean;
  loading: boolean;
}

export function usePermissions(): UserPermissions {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<UserPermissions>({
    canViewAllLeads: false,
    canInviteUsers: false,
    isAdmin: false,
    loading: true
  });

  useEffect(() => {
    if (!user) {
      setPermissions({
        canViewAllLeads: false,
        canInviteUsers: false,
        isAdmin: false,
        loading: false
      });
      return;
    }

    loadPermissions();
  }, [user]);

  const loadPermissions = async () => {
    if (!user) return;

    try {
      // Verificar se é admin
      const isAdmin = user.role === 'admin';

      if (isAdmin) {
        setPermissions({
          canViewAllLeads: true,
          canInviteUsers: true,
          isAdmin: true,
          loading: false
        });
        return;
      }

      // Buscar permissões específicas do corretor
      const { data: userPermissions, error } = await supabase
        .from('permissions')
        .select('can_view_all_leads, can_invite_users')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error loading permissions:', error);
      }

      setPermissions({
        canViewAllLeads: userPermissions?.can_view_all_leads || false,
        canInviteUsers: userPermissions?.can_invite_users || false,
        isAdmin: false,
        loading: false
      });

    } catch (error) {
      console.error('Error loading permissions:', error);
      setPermissions({
        canViewAllLeads: false,
        canInviteUsers: false,
        isAdmin: false,
        loading: false
      });
    }
  };

  return permissions;
}
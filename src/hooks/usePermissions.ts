import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UserPermissions {
  canInviteUsers: boolean;
  canManageLeads: boolean;
  canViewReports: boolean;
  canManageTeams: boolean;
  canAccessConfigurations: boolean;
  isAdmin: boolean;
  loading: boolean;
}

export function usePermissions(): UserPermissions {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<UserPermissions>({
    canInviteUsers: false,
    canManageLeads: false,
    canViewReports: false,
    canManageTeams: false,
    canAccessConfigurations: false,
    isAdmin: false,
    loading: true
  });

  useEffect(() => {
    if (!user) {
      setPermissions({
        canInviteUsers: false,
        canManageLeads: false,
        canViewReports: false,
        canManageTeams: false,
        canAccessConfigurations: false,
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
          canInviteUsers: true,
          canManageLeads: true,
          canViewReports: true,
          canManageTeams: true,
          canAccessConfigurations: true,
          isAdmin: true,
          loading: false
        });
        return;
      }

      // Buscar permissões específicas do corretor
      const { data: userPermissions, error } = await supabase
        .from('permissions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error loading permissions:', error);
      }

      setPermissions({
        canInviteUsers: userPermissions?.can_invite_users || false,
        canManageLeads: userPermissions?.can_manage_leads || false,
        canViewReports: userPermissions?.can_view_reports || false,
        canManageTeams: userPermissions?.can_manage_teams || false,
        canAccessConfigurations: userPermissions?.can_access_configurations || false,
        isAdmin: false,
        loading: false
      });

    } catch (error) {
      console.error('Error loading permissions:', error);
      setPermissions({
        canInviteUsers: false,
        canManageLeads: false,
        canViewReports: false,
        canManageTeams: false,
        canAccessConfigurations: false,
        isAdmin: false,
        loading: false
      });
    }
  };

  return permissions;
}
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UserPermissions {
  canViewAllLeads: boolean;
  canInviteUsers: boolean;
  canManageLeads: boolean;
  canViewReports: boolean;
  canManageProperties: boolean;
  canManageTeams: boolean;
  canAccessConfigurations: boolean;
  isAdmin: boolean;
  loading: boolean;
}

export function usePermissions(): UserPermissions {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<UserPermissions>({
    canViewAllLeads: false,
    canInviteUsers: false,
    canManageLeads: false,
    canViewReports: false,
    canManageProperties: false,
    canManageTeams: false,
    canAccessConfigurations: false,
    isAdmin: false,
    loading: true
  });

  useEffect(() => {
    if (!user) {
      setPermissions({
        canViewAllLeads: false,
        canInviteUsers: false,
        canManageLeads: false,
        canViewReports: false,
        canManageProperties: false,
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
          canViewAllLeads: true,
          canInviteUsers: true,
          canManageLeads: true,
          canViewReports: true,
          canManageProperties: true,
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
        canViewAllLeads: userPermissions?.can_view_all_leads || false,
        canInviteUsers: userPermissions?.can_invite_users || false,
        canManageLeads: userPermissions?.can_manage_leads || false,
        canViewReports: userPermissions?.can_view_reports || false,
        canManageProperties: userPermissions?.can_manage_properties || false,
        canManageTeams: userPermissions?.can_manage_teams || false,
        canAccessConfigurations: userPermissions?.can_access_configurations || false,
        isAdmin: false,
        loading: false
      });

    } catch (error) {
      console.error('Error loading permissions:', error);
      setPermissions({
        canViewAllLeads: false,
        canInviteUsers: false,
        canManageLeads: false,
        canViewReports: false,
        canManageProperties: false,
        canManageTeams: false,
        canAccessConfigurations: false,
        isAdmin: false,
        loading: false
      });
    }
  };

  return permissions;
}
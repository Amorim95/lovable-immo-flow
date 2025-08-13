
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
  isSuperAdmin: boolean;
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
    isSuperAdmin: false,
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
        isSuperAdmin: false,
        loading: false
      });
      return;
    }

    loadPermissions();
  }, [user?.id]); // Mudança aqui: dependência específica do user.id

  const loadPermissions = async () => {
    if (!user) return;

    try {
      // Se for usuário temporário ou não UUID válido, assumir como admin para desenvolvimento
      if (user.id === 'temp-admin-id' || !user.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        setPermissions({
          canInviteUsers: true,
          canManageLeads: true,
          canViewReports: true,
          canManageTeams: true,
          canAccessConfigurations: true,
          isAdmin: true,
          isSuperAdmin: true,
          loading: false
        });
        return;
      }

      // Verificar se é admin através da role do usuário
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (userError) {
        console.error('Error loading user role:', userError);
        // Assumir permissões básicas em caso de erro
        setPermissions({
          canInviteUsers: false,
          canManageLeads: true,
          canViewReports: false,
          canManageTeams: false,
          canAccessConfigurations: false,
          isAdmin: false,
          isSuperAdmin: false,
          loading: false
        });
        return;
      }

      const isAdmin = userData?.role === 'admin' || userData?.role === 'dono';

      // Buscar permissões específicas do usuário (para todos os usuários, incluindo admins)
      const { data: userPermissions, error } = await supabase
        .from('permissions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error loading permissions:', error);
      }

      if (isAdmin) {
        setPermissions({
          canInviteUsers: true,
          canManageLeads: true,
          canViewReports: true,
          canManageTeams: true,
          canAccessConfigurations: true,
          isAdmin: true,
          isSuperAdmin: userPermissions?.is_super_admin || false, // Verificar permissão específica
          loading: false
        });
        return;
      }

      // Para não-admins, usar as permissões específicas
      setPermissions({
        canInviteUsers: userPermissions?.can_invite_users || false,
        canManageLeads: userPermissions?.can_manage_leads || true, // Permitir por padrão
        canViewReports: userPermissions?.can_view_reports || false,
        canManageTeams: userPermissions?.can_manage_teams || false,
        canAccessConfigurations: userPermissions?.can_access_configurations || false,
        isAdmin: false,
        isSuperAdmin: userPermissions?.is_super_admin || false,
        loading: false
      });

    } catch (error) {
      console.error('Error loading permissions:', error);
      // Assumir permissões básicas em caso de erro
      setPermissions({
        canInviteUsers: false,
        canManageLeads: true,
        canViewReports: false,
        canManageTeams: false,
        canAccessConfigurations: false,
        isAdmin: false,
        isSuperAdmin: false,
        loading: false
      });
    }
  };

  return permissions;
}

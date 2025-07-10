import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';

interface AccessControlProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireViewAllLeads?: boolean;
  requireInviteUsers?: boolean;
  fallback?: React.ReactNode;
}

export function AccessControl({ 
  children, 
  requireAdmin = false,
  requireViewAllLeads = false,
  requireInviteUsers = false,
  fallback = null
}: AccessControlProps) {
  const { isAdmin, canViewAllLeads, canInviteUsers, loading } = usePermissions();

  if (loading) {
    return <div>Carregando...</div>;
  }

  // Verificar se tem as permissões necessárias
  const hasAccess = 
    (!requireAdmin || isAdmin) &&
    (!requireViewAllLeads || (isAdmin || canViewAllLeads)) &&
    (!requireInviteUsers || (isAdmin || canInviteUsers));

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
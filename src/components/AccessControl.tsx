import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';

interface AccessControlProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireInviteUsers?: boolean;
  fallback?: React.ReactNode;
}

export function AccessControl({ 
  children, 
  requireAdmin = false,
  requireInviteUsers = false,
  fallback = null
}: AccessControlProps) {
  const { isAdmin, canInviteUsers, loading } = usePermissions();

  if (loading) {
    return <div>Carregando...</div>;
  }

  // Verificar se tem as permissões necessárias
  const hasAccess = 
    (!requireAdmin || isAdmin) &&
    (!requireInviteUsers || (isAdmin || canInviteUsers));

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
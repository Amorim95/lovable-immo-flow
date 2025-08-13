
import React from 'react';
import { useUserRole } from '@/hooks/useUserRole';

interface AccessControlWrapperProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireGestor?: boolean;
  requireCorretor?: boolean;
  allowAdmin?: boolean;
  allowGestor?: boolean;
  allowCorretor?: boolean;
  fallback?: React.ReactNode;
}

export function AccessControlWrapper({ 
  children, 
  requireAdmin = false,
  requireGestor = false,
  requireCorretor = false,
  allowAdmin = true,
  allowGestor = true,
  allowCorretor = true,
  fallback = null
}: AccessControlWrapperProps) {
  const { isAdmin, isGestor, isCorretor, isDono, loading } = useUserRole();

  // Durante o carregamento, mostrar o conteúdo para evitar layout shift
  if (loading) {
    return <>{children}</>;
  }

  // Verificar requisitos específicos (Dono tem acesso como Admin)
  if (requireAdmin && !isAdmin && !isDono) {
    return <>{fallback}</>;
  }

  if (requireGestor && !isGestor) {
    return <>{fallback}</>;
  }

  if (requireCorretor && !isCorretor) {
    return <>{fallback}</>;
  }

  // Verificar permissões gerais (Dono tem acesso total como Admin)
  const hasAccess = 
    (allowAdmin && (isAdmin || isDono)) ||
    (allowGestor && isGestor) ||
    (allowCorretor && isCorretor);

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

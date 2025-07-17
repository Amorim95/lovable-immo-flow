
import React from 'react';
import { useUserRole } from '@/hooks/useUserRole';
import { Card, CardContent } from '@/components/ui/card';

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
  const { isAdmin, isGestor, isCorretor, loading } = useUserRole();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Verificar requisitos específicos
  if (requireAdmin && !isAdmin) {
    return fallback || (
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-600 text-center">
            Apenas administradores podem acessar esta funcionalidade.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (requireGestor && !isGestor) {
    return fallback || (
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-600 text-center">
            Apenas gestores podem acessar esta funcionalidade.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (requireCorretor && !isCorretor) {
    return fallback || (
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-600 text-center">
            Apenas corretores podem acessar esta funcionalidade.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Verificar permissões gerais
  const hasAccess = 
    (allowAdmin && isAdmin) ||
    (allowGestor && isGestor) ||
    (allowCorretor && isCorretor);

  if (!hasAccess) {
    return fallback || (
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-600 text-center">
            Você não tem permissão para acessar esta funcionalidade.
          </p>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}

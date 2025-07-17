
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { useUserRole } from '@/hooks/useUserRole';
import { Crown, Users, User } from 'lucide-react';

interface UserRoleBadgeProps {
  showIcon?: boolean;
  variant?: 'default' | 'outline' | 'secondary';
}

export function UserRoleBadge({ showIcon = true, variant = 'default' }: UserRoleBadgeProps) {
  const { isAdmin, isGestor, isCorretor, loading } = useUserRole();

  if (loading) {
    return (
      <Badge variant="outline">
        <span>Carregando...</span>
      </Badge>
    );
  }

  let roleText = '';
  let roleIcon = null;
  let badgeClass = '';

  if (isAdmin) {
    roleText = 'Administrador';
    roleIcon = <Crown className="w-3 h-3" />;
    badgeClass = 'bg-purple-100 text-purple-800 border-purple-200';
  } else if (isGestor) {
    roleText = 'Gestor';
    roleIcon = <Users className="w-3 h-3" />;
    badgeClass = 'bg-blue-100 text-blue-800 border-blue-200';
  } else if (isCorretor) {
    roleText = 'Corretor';
    roleIcon = <User className="w-3 h-3" />;
    badgeClass = 'bg-green-100 text-green-800 border-green-200';
  } else {
    roleText = 'Usuário';
    roleIcon = <User className="w-3 h-3" />;
    badgeClass = 'bg-gray-100 text-gray-800 border-gray-200';
  }

  return (
    <Badge variant={variant} className={variant === 'default' ? badgeClass : ''}>
      {showIcon && roleIcon}
      <span className={showIcon ? 'ml-1' : ''}>{roleText}</span>
    </Badge>
  );
}

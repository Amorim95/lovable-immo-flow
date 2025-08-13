
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { useUserRole } from '@/hooks/useUserRole';
import { Crown, Users, User } from 'lucide-react';

interface UserRoleBadgeProps {
  showIcon?: boolean;
  variant?: 'default' | 'outline' | 'secondary';
  role?: 'admin' | 'gestor' | 'corretor' | 'dono';
}

export function UserRoleBadge({ showIcon = true, variant = 'default', role }: UserRoleBadgeProps) {
  const { isAdmin, isGestor, isCorretor, loading } = useUserRole();

  if (!role && loading) {
    return (
      <Badge variant="outline">
        <span>Carregando...</span>
      </Badge>
    );
  }

  let roleText = '';
  let roleIcon = null;
  let badgeClass = '';

  // Use the provided role prop, or fall back to user's own role
  const currentRole = role || (isAdmin ? 'admin' : isGestor ? 'gestor' : isCorretor ? 'corretor' : 'corretor');

  if (currentRole === 'admin') {
    roleText = 'Administrador';
    roleIcon = <Crown className="w-3 h-3" />;
    badgeClass = 'bg-purple-100 text-purple-800 border-purple-200';
  } else if (currentRole === 'gestor') {
    roleText = 'Gestor';
    roleIcon = <Users className="w-3 h-3" />;
    badgeClass = 'bg-blue-100 text-blue-800 border-blue-200';
  } else if (currentRole === 'corretor') {
    roleText = 'Corretor';
    roleIcon = <User className="w-3 h-3" />;
    badgeClass = 'bg-green-100 text-green-800 border-green-200';
  } else if (currentRole === 'dono') {
    roleText = 'Dono';
    roleIcon = <Crown className="w-3 h-3" />;
    badgeClass = 'bg-yellow-100 text-yellow-800 border-yellow-200';
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

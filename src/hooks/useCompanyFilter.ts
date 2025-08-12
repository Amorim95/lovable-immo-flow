import { useAuth } from '@/contexts/AuthContext';

export function useCompanyFilter() {
  const { user } = useAuth();

  const addCompanyFilter = (query: any) => {
    // Se não for super admin e tiver company_id, filtrar por empresa
    if (!user?.is_super_admin && user?.company_id) {
      return query.eq('company_id', user.company_id);
    }
    return query;
  };

  const getCompanyId = () => {
    return user?.company_id || null;
  };

  const isSuperAdmin = () => {
    return user?.is_super_admin || false;
  };

  return {
    addCompanyFilter,
    getCompanyId,
    isSuperAdmin,
    user
  };
}
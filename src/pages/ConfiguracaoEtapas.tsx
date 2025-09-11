import { LeadStagesManager } from '@/components/LeadStagesManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePermissions } from '@/hooks/usePermissions';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function ConfiguracaoEtapas() {
  const { isAdmin, loading } = usePermissions();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/');
    }
  }, [isAdmin, loading, navigate]);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <p>Carregando...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuração de Etapas</h1>
        <p className="text-muted-foreground">
          Gerencie as etapas personalizadas dos leads para sua empresa
        </p>
      </div>

      <LeadStagesManager />
    </div>
  );
}
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

      <Card>
        <CardHeader>
          <CardTitle>Como funciona</CardTitle>
          <CardDescription>
            As etapas dos leads são personalizáveis por empresa. Você pode:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li>Criar novas etapas com nomes personalizados</li>
            <li>Definir cores específicas para cada etapa</li>
            <li>Reordenar as etapas arrastando e soltando</li>
            <li>Editar nomes e cores das etapas existentes</li>
            <li>Remover etapas que não são mais necessárias</li>
          </ul>
          <p className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
            <strong>Importante:</strong> As alterações feitas aqui afetam apenas sua empresa. 
            Outras empresas mantêm suas próprias configurações de etapas.
          </p>
        </CardContent>
      </Card>

      <LeadStagesManager />
    </div>
  );
}
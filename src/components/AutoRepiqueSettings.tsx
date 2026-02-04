import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyFilter } from '@/hooks/useCompanyFilter';
import { toast } from 'sonner';
interface AutoRepiqueSettingsProps {
  className?: string;
}
export function AutoRepiqueSettings({
  className
}: AutoRepiqueSettingsProps) {
  const {
    getCompanyId
  } = useCompanyFilter();
  const [isEnabled, setIsEnabled] = useState(false);
  const [minutes, setMinutes] = useState(5);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [initialValues, setInitialValues] = useState({
    enabled: false,
    minutes: 5
  });
  useEffect(() => {
    loadSettings();
  }, []);
  const loadSettings = async () => {
    try {
      setLoading(true);
      const companyId = await getCompanyId();
      if (!companyId) {
        console.log('Nenhum company_id encontrado');
        setLoading(false);
        return;
      }
      const {
        data,
        error
      } = await supabase.from('company_settings').select('auto_repique_enabled, auto_repique_minutes').eq('company_id', companyId).maybeSingle();
      if (error) {
        console.error('Erro ao carregar configurações:', error);
        toast.error('Erro ao carregar configurações de repique');
        return;
      }
      if (data) {
        const enabled = data.auto_repique_enabled ?? false;
        const mins = data.auto_repique_minutes ?? 5;
        setIsEnabled(enabled);
        setMinutes(mins);
        setInitialValues({
          enabled,
          minutes: mins
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleEnabledChange = (checked: boolean) => {
    setIsEnabled(checked);
    setHasChanges(checked !== initialValues.enabled || minutes !== initialValues.minutes);
  };
  const handleMinutesChange = (value: string) => {
    const numValue = parseInt(value) || 1;
    const clampedValue = Math.min(Math.max(numValue, 1), 30);
    setMinutes(clampedValue);
    setHasChanges(isEnabled !== initialValues.enabled || clampedValue !== initialValues.minutes);
  };
  const saveSettings = async () => {
    try {
      setSaving(true);
      const companyId = await getCompanyId();
      if (!companyId) {
        toast.error('Empresa não encontrada');
        return;
      }
      const {
        error
      } = await supabase.from('company_settings').update({
        auto_repique_enabled: isEnabled,
        auto_repique_minutes: minutes
      }).eq('company_id', companyId);
      if (error) {
        console.error('Erro ao salvar:', error);
        toast.error('Erro ao salvar configurações');
        return;
      }
      setInitialValues({
        enabled: isEnabled,
        minutes
      });
      setHasChanges(false);
      toast.success(isEnabled ? `Repique automático ativado (${minutes} minutos)` : 'Repique automático desativado');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };
  if (loading) {
    return <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse flex items-center gap-4">
            <div className="h-10 w-10 bg-muted rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-1/3"></div>
              <div className="h-3 bg-muted rounded w-2/3"></div>
            </div>
          </div>
        </CardContent>
      </Card>;
  }
  return <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Fallback Automático de Leads</CardTitle>
              <CardDescription>Redistribuição Automática de Leads por Inatividade</CardDescription>
            </div>
          </div>
          <Badge variant={isEnabled ? 'default' : 'secondary'}>
            {isEnabled ? 'Ativado' : 'Desativado'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="auto-repique-toggle">Ativar repique automático</Label>
            <p className="text-sm text-muted-foreground">Leads sem contato serão redistribuídos</p>
          </div>
          <Switch id="auto-repique-toggle" checked={isEnabled} onCheckedChange={handleEnabledChange} />
        </div>

        {isEnabled && <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <Label htmlFor="repique-minutes">Tempo limite (minutos)</Label>
            </div>
            <div className="flex items-center gap-3">
              <Input id="repique-minutes" type="number" min={1} max={30} value={minutes} onChange={e => handleMinutesChange(e.target.value)} className="w-24" />
              <span className="text-sm text-muted-foreground">
                minutos sem contato
              </span>
            </div>
            
            <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <div className="text-muted-foreground">
                
                <p className="mt-1">Limite máximo: 3 redistriições por lead.</p>
              </div>
            </div>
          </div>}

        {hasChanges && <div className="pt-3 border-t">
            <Button onClick={saveSettings} disabled={saving} className="w-full">
              {saving ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </div>}
      </CardContent>
    </Card>;
}
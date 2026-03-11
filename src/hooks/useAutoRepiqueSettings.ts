import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AutoRepiqueSettings {
  enabled: boolean;
  minutes: number;
}

export function useAutoRepiqueSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AutoRepiqueSettings>({ enabled: false, minutes: 5 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchSettings = async () => {
      try {
        const { data: userData } = await supabase
          .from('users')
          .select('company_id')
          .eq('id', user.id)
          .maybeSingle();

        if (!userData?.company_id) return;

        const { data } = await supabase
          .from('company_settings')
          .select('auto_repique_enabled, auto_repique_minutes')
          .eq('company_id', userData.company_id)
          .maybeSingle();

        if (data) {
          setSettings({
            enabled: data.auto_repique_enabled ?? false,
            minutes: data.auto_repique_minutes ?? 5
          });
        }
      } catch (err) {
        console.error('Erro ao buscar configurações de repique:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [user]);

  return { ...settings, loading };
}

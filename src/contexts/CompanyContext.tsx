import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CompanySettings {
  name: string;
  logo: string | null;
  theme: string;
  isDarkMode: boolean;
  site_title?: string;
  site_description?: string;
  site_phone?: string;
  site_email?: string;
  site_address?: string;
  site_whatsapp?: string;
  site_facebook?: string;
  site_instagram?: string;
}

interface CompanyContextType {
  settings: CompanySettings;
  updateSettings: (newSettings: Partial<CompanySettings>) => Promise<void>;
  refreshSettings: () => void;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<CompanySettings>({
    name: 'Click Imóveis',
    logo: null,
    theme: 'blue',
    isDarkMode: false
  });

  useEffect(() => {
    loadCompanySettings();
  }, []);

  const loadCompanySettings = async () => {
    try {
      const { data } = await supabase
        .from('company_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (data) {
        setSettings(prev => ({
          ...prev,
          name: data.name || 'Click Imóveis',
          logo: data.logo || null,
          site_title: data.site_title || data.name || 'Click Imóveis',
          site_description: data.site_description || 'Encontre o imóvel dos seus sonhos',
          site_phone: data.site_phone || '(11) 9999-9999',
          site_email: data.site_email || 'contato@imobiliaria.com.br',
          site_address: data.site_address || 'São Paulo, SP',
          site_whatsapp: data.site_whatsapp || '5511999999999',
          site_facebook: data.site_facebook || '',
          site_instagram: data.site_instagram || '',
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar configurações da empresa:', error);
    }
  };

  const updateSettings = async (newSettings: Partial<CompanySettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    
    // Se foi atualizada a logo ou nome, também atualizar no banco
    if (newSettings.logo !== undefined || newSettings.name !== undefined) {
      try {
        const { data: existingData } = await supabase
          .from('company_settings')
          .select('*')
          .limit(1)
          .maybeSingle();

        if (existingData) {
          await supabase
            .from('company_settings')
            .update({
              name: newSettings.name || existingData.name,
              logo: newSettings.logo || existingData.logo
            })
            .eq('id', existingData.id);
        } else {
          await supabase
            .from('company_settings')
            .insert({
              name: newSettings.name || 'Click Imóveis',
              logo: newSettings.logo || null
            });
        }
      } catch (error) {
        console.error('Erro ao atualizar configurações da empresa:', error);
      }
    }
  };

  const refreshSettings = () => {
    loadCompanySettings();
  };

  // Apply dark mode to document
  useEffect(() => {
    if (settings.isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.isDarkMode]);

  return (
    <CompanyContext.Provider value={{ settings, updateSettings, refreshSettings }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
}
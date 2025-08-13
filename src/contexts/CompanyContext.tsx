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
  site_about?: string;
  site_horario_semana?: string;
  site_horario_sabado?: string;
  site_horario_domingo?: string;
  site_observacoes_horario?: string;
}

interface CompanyContextType {
  settings: CompanySettings;
  updateSettings: (newSettings: Partial<CompanySettings>) => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<CompanySettings>({
    name: '', // Vazio por padrão para onboarding
    logo: null,
    theme: 'blue',
    isDarkMode: false
  });

  useEffect(() => {
    loadCompanySettings();
  }, []);

  const loadCompanySettings = async () => {
    try {
      console.log('Carregando configurações da empresa...');
      
      // Obter o usuário atual para pegar o company_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('Usuário não autenticado');
        return;
      }

      // Buscar dados do usuário para obter company_id
      const { data: userData } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!userData?.company_id) {
        console.log('Usuário sem company_id definido');
        return;
      }

      // Buscar dados da empresa na tabela companies
      const { data: companyData } = await supabase
        .from('companies')
        .select('name, logo_url')
        .eq('id', userData.company_id)
        .single();

      // Buscar configurações do site na tabela company_settings
      const { data: settingsData } = await supabase
        .from('company_settings')
        .select('*')
        .eq('company_id', userData.company_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      console.log('Dados da empresa:', companyData);
      console.log('Configurações do site:', settingsData);

      // Aplicar configurações combinadas
      setSettings(prev => ({
        ...prev,
        name: companyData?.name || '',
        logo: companyData?.logo_url || null,
        site_title: settingsData?.site_title || companyData?.name || '',
        site_description: settingsData?.site_description || '',
        site_phone: settingsData?.site_phone || '',
        site_email: settingsData?.site_email || '',
        site_address: settingsData?.site_address || '',
        site_whatsapp: settingsData?.site_whatsapp || '',
        site_facebook: settingsData?.site_facebook || '',
        site_instagram: settingsData?.site_instagram || '',
        site_about: settingsData?.site_about || '',
        site_horario_semana: settingsData?.site_horario_semana || '8:00 às 18:00',
        site_horario_sabado: settingsData?.site_horario_sabado || '8:00 às 14:00',
        site_horario_domingo: settingsData?.site_horario_domingo || 'Fechado',
        site_observacoes_horario: settingsData?.site_observacoes_horario || '*Atendimento via WhatsApp 24 horas',
      }));
    } catch (error) {
      console.error('Erro ao carregar configurações da empresa:', error);
    }
  };

  const updateSettings = async (newSettings: Partial<CompanySettings>) => {
    console.log('updateSettings chamado com:', newSettings);
    setSettings(prev => ({ ...prev, ...newSettings }));
    
    // Atualizar no banco sempre que houver mudanças
    try {
      // Obter o usuário atual
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        throw new Error('Usuário não autenticado');
      }

      const userId = authData.user.id;
      console.log('UserId:', userId);

      // Buscar company_id primeiro na tabela users
      const userQuery = await supabase
        .from('users')
        .select('company_id, role')
        .eq('id', userId)
        .single();

      console.log('UserQuery result:', userQuery);

      let companyId: string | null = userQuery.data?.company_id;

      // Se não tiver company_id, não deve criar empresa automaticamente
      // Isso previne a criação de empresas duplicadas
      if (!companyId) {
        console.error('Usuário não está associado a nenhuma empresa');
        throw new Error('Usuário deve estar associado a uma empresa para fazer atualizações');
      }

      // Marcar onboarding como completo se for dono
      if (userQuery.data?.role === 'dono') {
        await supabase
          .from('users')
          .update({ has_completed_onboarding: true })
          .eq('id', userId);
      }

      // Atualizar informações da empresa existente APENAS SE DADOS FOREM FORNECIDOS
      const companyUpdateData: any = {};
      
      if (newSettings.name !== undefined) {
        companyUpdateData.name = newSettings.name;
      }
      
      if (newSettings.logo !== undefined) {
        companyUpdateData.logo_url = newSettings.logo;
      }

      // Só fazer update se houver dados para atualizar
      if (Object.keys(companyUpdateData).length > 0) {
        const { error: companyUpdateError } = await supabase
          .from('companies')
          .update(companyUpdateData)
          .eq('id', companyId);

        if (companyUpdateError) {
          console.error('Erro ao atualizar empresa:', companyUpdateError);
          throw new Error('Erro ao atualizar empresa');
        }
        
        console.log('Empresa atualizada:', companyUpdateData);
      }

      // Atualizar company_settings para informações do site
      const existingSettingsQuery = await supabase
        .from('company_settings')
        .select('*')
        .eq('company_id', companyId)
        .limit(1)
        .maybeSingle();

      const settingsData = {
        company_id: companyId,
        name: newSettings.name || '',
        logo: newSettings.logo,
        site_title: newSettings.site_title,
        site_description: newSettings.site_description,
        site_phone: newSettings.site_phone,
        site_email: newSettings.site_email,
        site_address: newSettings.site_address,
        site_whatsapp: newSettings.site_whatsapp,
        site_facebook: newSettings.site_facebook,
        site_instagram: newSettings.site_instagram,
        site_about: newSettings.site_about,
        site_horario_semana: newSettings.site_horario_semana,
        site_horario_sabado: newSettings.site_horario_sabado,
        site_horario_domingo: newSettings.site_horario_domingo,
        site_observacoes_horario: newSettings.site_observacoes_horario,
      };

      if (existingSettingsQuery.data) {
        const { error } = await supabase
          .from('company_settings')
          .update(settingsData)
          .eq('id', existingSettingsQuery.data.id);
        
        if (error) {
          console.error('Erro ao atualizar settings:', error);
          throw error;
        }
      } else {
        const { error } = await supabase
          .from('company_settings')
          .insert(settingsData);
        
        if (error) {
          console.error('Erro ao inserir settings:', error);
          throw error;
        }
      }

      console.log('Empresa e configurações atualizadas com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar configurações da empresa:', error);
      throw error;
    }
  };

  const refreshSettings = async () => {
    await loadCompanySettings();
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
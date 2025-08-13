import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CompanySettings {
  name: string;
  logo: string | null;
  theme: string;
  isDarkMode: boolean;
  siteTitle?: string;
  siteDescription?: string;
  sitePhone?: string;
  siteEmail?: string;
  siteAddress?: string;
  siteWhatsapp?: string;
  siteFacebook?: string;
  siteInstagram?: string;
  siteAbout?: string;
  siteHorarioSemana?: string;
  siteHorarioSabado?: string;
  siteHorarioDomingo?: string;
  siteObservacoesHorario?: string;
  custom_domain?: string;
  domain_status?: string;
  ssl_status?: string;
  domain_verified_at?: string;
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

    // Recarregar quando autenticação mudar (evita estado "preso" da empresa anterior)
    const { data: subscription } = supabase.auth.onAuthStateChange(() => {
      loadCompanySettings();
    });
    return () => subscription.subscription?.unsubscribe();
  }, []);

  const loadCompanySettings = async () => {
    try {
      console.log('Carregando configurações da empresa...');
      
      // Obter o usuário atual para pegar o company_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('Usuário não autenticado');
        // Reset para estado neutro
        setSettings((prev) => ({ ...prev, name: '', logo: null }));
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
        // Resetar para estado neutro (evita "herdar" dados de outra empresa)
        setSettings((prev) => ({ ...prev, name: '', logo: null }));
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

      // Usar sempre dados da tabela companies para name e logo (são atualizados pelo admin)
      setSettings(prev => ({
        ...prev,
        name: companyData?.name || '',
        logo: companyData?.logo_url || null,
        siteTitle: settingsData?.site_title || companyData?.name || '',
        siteDescription: settingsData?.site_description || '',
        sitePhone: settingsData?.site_phone || '',
        siteEmail: settingsData?.site_email || '',
        siteAddress: settingsData?.site_address || '',
        siteWhatsapp: settingsData?.site_whatsapp || '',
        siteFacebook: settingsData?.site_facebook || '',
        siteInstagram: settingsData?.site_instagram || '',
        siteAbout: settingsData?.site_about || '',
        siteHorarioSemana: settingsData?.site_horario_semana || '8:00 às 18:00',
        siteHorarioSabado: settingsData?.site_horario_sabado || '8:00 às 14:00',
        siteHorarioDomingo: settingsData?.site_horario_domingo || 'Fechado',
        siteObservacoesHorario: settingsData?.site_observacoes_horario || '*Atendimento via WhatsApp 24 horas',
        custom_domain: settingsData?.custom_domain || '',
        domain_status: settingsData?.domain_status || 'pendente',
        ssl_status: settingsData?.ssl_status || 'pendente',
        domain_verified_at: settingsData?.domain_verified_at || '',
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

      // Marcar onboarding como completo
      await supabase
        .from('users')
        .update({ has_completed_onboarding: true })
        .eq('id', userId);

      // SEMPRE atualizar na tabela companies para name e logo
      if (newSettings.name !== undefined || newSettings.logo !== undefined) {
        const companyUpdateData: any = {};
        if (newSettings.name !== undefined) companyUpdateData.name = newSettings.name;
        if (newSettings.logo !== undefined) companyUpdateData.logo_url = newSettings.logo;
        
        console.log('Atualizando tabela companies com:', companyUpdateData);
        console.log('Company ID:', companyId);
        
        if (Object.keys(companyUpdateData).length > 0) {
          const { data: companyUpdateData_result, error: companyUpdateError } = await supabase
            .from('companies')
            .update(companyUpdateData)
            .eq('id', companyId)
            .select();
          
          if (companyUpdateError) {
            console.error('Erro ao atualizar companies:', companyUpdateError);
            throw new Error(`Erro ao atualizar empresa: ${companyUpdateError.message}`);
          }
          
          console.log('Tabela companies atualizada com sucesso:', companyUpdateData_result);
        }
      }

      // Atualizar company_settings apenas para informações do site (não name e logo)
      const existingSettingsQuery = await supabase
        .from('company_settings')
        .select('*')
        .eq('company_id', companyId)
        .limit(1)
        .maybeSingle();

      const settingsData: any = { company_id: companyId };
      // NÃO incluir name e logo aqui - eles vão para a tabela companies
      if (newSettings.siteTitle !== undefined) settingsData.site_title = newSettings.siteTitle;
      if (newSettings.siteDescription !== undefined) settingsData.site_description = newSettings.siteDescription;
      if (newSettings.sitePhone !== undefined) settingsData.site_phone = newSettings.sitePhone;
      if (newSettings.siteEmail !== undefined) settingsData.site_email = newSettings.siteEmail;
      if (newSettings.siteAddress !== undefined) settingsData.site_address = newSettings.siteAddress;
      if (newSettings.siteWhatsapp !== undefined) settingsData.site_whatsapp = newSettings.siteWhatsapp;
      if (newSettings.siteFacebook !== undefined) settingsData.site_facebook = newSettings.siteFacebook;
      if (newSettings.siteInstagram !== undefined) settingsData.site_instagram = newSettings.siteInstagram;
      if (newSettings.siteAbout !== undefined) settingsData.site_about = newSettings.siteAbout;
      if (newSettings.siteHorarioSemana !== undefined) settingsData.site_horario_semana = newSettings.siteHorarioSemana;
      if (newSettings.siteHorarioSabado !== undefined) settingsData.site_horario_sabado = newSettings.siteHorarioSabado;
      if (newSettings.siteHorarioDomingo !== undefined) settingsData.site_horario_domingo = newSettings.siteHorarioDomingo;
      if (newSettings.siteObservacoesHorario !== undefined) settingsData.site_observacoes_horario = newSettings.siteObservacoesHorario;
      if (newSettings.custom_domain !== undefined) settingsData.custom_domain = newSettings.custom_domain;
      if (newSettings.domain_status !== undefined) settingsData.domain_status = newSettings.domain_status;
      if (newSettings.ssl_status !== undefined) settingsData.ssl_status = newSettings.ssl_status;
      if (newSettings.domain_verified_at !== undefined) settingsData.domain_verified_at = newSettings.domain_verified_at;

      // Só atualizar company_settings se houver campos relacionados ao site ou domínio
      const hasSiteSettings = Object.keys(settingsData).some(key => 
        key.startsWith('site_') || key.startsWith('custom_domain') || key.startsWith('domain_') || key.startsWith('ssl_')
      );
      
      if (hasSiteSettings) {
        if (existingSettingsQuery.data) {
          const { error } = await supabase
            .from('company_settings')
            .update(settingsData)
            .eq('id', existingSettingsQuery.data.id);
          
          if (error) {
            console.error('Erro ao atualizar settings:', error);
            throw error;
          }
        } else if (Object.keys(settingsData).length > 1) { // Mais que só company_id
          const { error } = await supabase
            .from('company_settings')
            .insert(settingsData);
          
          if (error) {
            console.error('Erro ao inserir settings:', error);
            throw error;
          }
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
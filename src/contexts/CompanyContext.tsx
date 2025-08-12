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

      // Buscar configurações da empresa específica
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .eq('company_id', userData.company_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      console.log('Dados carregados do banco:', data);
      console.log('Erro na consulta:', error);

      if (data) {
        console.log('Aplicando configurações:', data);
        setSettings(prev => ({
          ...prev,
          name: data.name || '',
          logo: data.logo || null,
          site_title: data.site_title || data.name || '',
          site_description: data.site_description || '',
          site_phone: data.site_phone || '',
          site_email: data.site_email || '',
          site_address: data.site_address || '',
          site_whatsapp: data.site_whatsapp || '',
          site_facebook: data.site_facebook || '',
          site_instagram: data.site_instagram || '',
          site_about: data.site_about || '',
          site_horario_semana: data.site_horario_semana || '8:00 às 18:00',
          site_horario_sabado: data.site_horario_sabado || '8:00 às 14:00',
          site_horario_domingo: data.site_horario_domingo || 'Fechado',
          site_observacoes_horario: data.site_observacoes_horario || '*Atendimento via WhatsApp 24 horas',
        }));
      } else {
        console.log('Nenhum dado encontrado na tabela company_settings - mantendo valores vazios para onboarding');
      }
    } catch (error) {
      console.error('Erro ao carregar configurações da empresa:', error);
    }
  };

  const updateSettings = async (newSettings: Partial<CompanySettings>) => {
    console.log('updateSettings chamado com:', newSettings);
    setSettings(prev => ({ ...prev, ...newSettings }));
    
    // Atualizar no banco sempre que houver mudanças
    try {
      // Obter o usuário atual e seu company_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data: userData } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!userData?.company_id) {
        throw new Error('Usuário sem company_id definido');
      }

      const { data: existingData } = await supabase
        .from('company_settings')
        .select('*')
        .eq('company_id', userData.company_id)
        .limit(1)
        .maybeSingle();

      console.log('Dados existentes:', existingData);

      const updateData = {
        company_id: userData.company_id, // Sempre incluir o company_id
        name: newSettings.name !== undefined ? newSettings.name : existingData?.name || '',
        logo: newSettings.logo !== undefined ? newSettings.logo : existingData?.logo,
        site_title: newSettings.site_title !== undefined ? newSettings.site_title : existingData?.site_title,
        site_description: newSettings.site_description !== undefined ? newSettings.site_description : existingData?.site_description,
        site_phone: newSettings.site_phone !== undefined ? newSettings.site_phone : existingData?.site_phone,
        site_email: newSettings.site_email !== undefined ? newSettings.site_email : existingData?.site_email,
        site_address: newSettings.site_address !== undefined ? newSettings.site_address : existingData?.site_address,
        site_whatsapp: newSettings.site_whatsapp !== undefined ? newSettings.site_whatsapp : existingData?.site_whatsapp,
        site_facebook: newSettings.site_facebook !== undefined ? newSettings.site_facebook : existingData?.site_facebook,
        site_instagram: newSettings.site_instagram !== undefined ? newSettings.site_instagram : existingData?.site_instagram,
        site_about: newSettings.site_about !== undefined ? newSettings.site_about : existingData?.site_about,
        site_horario_semana: newSettings.site_horario_semana !== undefined ? newSettings.site_horario_semana : existingData?.site_horario_semana,
        site_horario_sabado: newSettings.site_horario_sabado !== undefined ? newSettings.site_horario_sabado : existingData?.site_horario_sabado,
        site_horario_domingo: newSettings.site_horario_domingo !== undefined ? newSettings.site_horario_domingo : existingData?.site_horario_domingo,
        site_observacoes_horario: newSettings.site_observacoes_horario !== undefined ? newSettings.site_observacoes_horario : existingData?.site_observacoes_horario,
      };

      console.log('Dados para atualizar:', updateData);

      if (existingData) {
        console.log('Atualizando registro existente com ID:', existingData.id);
        const { error } = await supabase
          .from('company_settings')
          .update(updateData)
          .eq('id', existingData.id);
        
        if (error) {
          console.error('Erro ao atualizar:', error);
          throw error;
        }
        console.log('Atualização bem-sucedida');
      } else {
        console.log('Criando novo registro');
        const { error } = await supabase
          .from('company_settings')
          .insert(updateData);
        
        if (error) {
          console.error('Erro ao inserir:', error);
          throw error;
        }
        console.log('Inserção bem-sucedida');
      }
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
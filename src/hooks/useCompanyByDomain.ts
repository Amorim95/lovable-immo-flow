import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CompanyInfo {
  id: string;
  name: string;
  logo_url: string | null;
  settings: {
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
    custom_domain?: string;
  };
}

export function useCompanyByDomain() {
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const detectCompany = async () => {
      try {
        const currentDomain = window.location.hostname;
        
        // Se estiver no domínio principal (lovable.app, lovableproject.com ou localhost), usar a primeira empresa
        const isMainDomain = currentDomain.includes('lovable.app') || 
                             currentDomain.includes('lovableproject.com') || 
                             currentDomain.includes('localhost') || 
                             currentDomain.includes('127.0.0.1');

        let companyData = null;

        if (isMainDomain) {
          // No domínio principal, usar configurações padrão do CRM
          companyData = {
            id: 'default',
            name: 'Meu CRM.Imob',
            logo_url: '/lovable-uploads/default-crm-logo.png',
            company_settings: [{
              site_title: 'Meu CRM.Imob - O CRM especialista para o mercado imobiliário',
              site_description: 'Sistema completo de gestão de leads para corretores e imobiliárias',
              site_phone: '',
              site_email: '',
              site_address: '',
              site_whatsapp: '',
              site_facebook: '',
              site_instagram: '',
              site_about: 'O CRM especialista para o mercado imobiliário.',
              site_horario_semana: '8:00 às 18:00',
              site_horario_sabado: '8:00 às 14:00',
              site_horario_domingo: 'Fechado',
              site_observacoes_horario: '*Atendimento via WhatsApp 24 horas',
              custom_domain: null,
            }]
          };
        } else {
          // Em domínio personalizado, buscar pela configuração do domínio
          const { data: settings, error: settingsError } = await supabase
            .from('company_settings')
            .select('*')
            .eq('custom_domain', currentDomain)
            .eq('domain_status', 'ativo')
            .single();

          if (settingsError && settingsError.code !== 'PGRST116') {
            throw settingsError;
          }

          if (settings && settings.company_id) {
            // Buscar dados da empresa para obter logo_url
            const { data: companyInfo, error: companyError } = await supabase
              .from('companies')
              .select('id, name, logo_url')
              .eq('id', settings.company_id)
              .single();

            if (!companyError && companyInfo) {
              companyData = {
                id: companyInfo.id,
                name: companyInfo.name,
                logo_url: companyInfo.logo_url,
                company_settings: [settings]
              };
            }
          }
        }

        if (companyData) {
          const settingsData = companyData.company_settings?.[0] || {};
          
          setCompany({
            id: companyData.id,
            name: companyData.name,
            logo_url: companyData.logo_url,
            settings: {
              site_title: settingsData.site_title,
              site_description: settingsData.site_description,
              site_phone: settingsData.site_phone,
              site_email: settingsData.site_email,
              site_address: settingsData.site_address,
              site_whatsapp: settingsData.site_whatsapp,
              site_facebook: settingsData.site_facebook,
              site_instagram: settingsData.site_instagram,
              site_about: settingsData.site_about,
              site_horario_semana: settingsData.site_horario_semana,
              site_horario_sabado: settingsData.site_horario_sabado,
              site_horario_domingo: settingsData.site_horario_domingo,
              site_observacoes_horario: settingsData.site_observacoes_horario,
              custom_domain: settingsData.custom_domain,
            }
          });
        } else {
          setError('Empresa não encontrada para este domínio');
        }
      } catch (err) {
        console.error('Erro ao detectar empresa por domínio:', err);
        setError('Erro ao carregar dados da empresa');
      } finally {
        setLoading(false);
      }
    };

    detectCompany();
  }, []);

  return { company, loading, error };
}
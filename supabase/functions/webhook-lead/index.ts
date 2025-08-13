import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LeadWebhookData {
  nome: string;
  telefone: string;
  dados_adicionais?: string;
  company_id?: string; // Opcional: permitir especificar empresa
}

interface Company {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string;
  status: string;
}

// Função auxiliar para validar telefone
function validatePhone(telefone: string): boolean {
  // Remove todos os caracteres não numéricos
  const cleanPhone = telefone.replace(/\D/g, '');
  // Verifica se tem pelo menos 10 dígitos (DDD + número)
  return cleanPhone.length >= 10 && cleanPhone.length <= 15;
}

// Função auxiliar para validar nome
function validateName(nome: string): boolean {
  return nome.trim().length >= 2 && nome.trim().length <= 100;
}

Deno.serve(async (req) => {
  const startTime = Date.now();
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log(`[${new Date().toISOString()}] Webhook iniciado - Method: ${req.method}`);

    // Validar método HTTP
    if (req.method !== 'POST') {
      console.warn(`Método não permitido: ${req.method}`);
      return new Response(
        JSON.stringify({ 
          error: 'Método não permitido',
          allowed_methods: ['POST'],
          received_method: req.method 
        }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Inicializar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Variáveis de ambiente do Supabase não configuradas');
      return new Response(
        JSON.stringify({ error: 'Configuração do servidor incompleta' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse e validação do JSON
    let leadData: LeadWebhookData;
    try {
      leadData = await req.json();
      console.log('Dados recebidos:', { 
        nome: leadData.nome, 
        telefone: leadData.telefone?.substring(0, 8) + '****', // Mascarar telefone no log
        has_dados_adicionais: !!leadData.dados_adicionais,
        company_id: leadData.company_id 
      });
    } catch (parseError) {
      console.error('Erro ao fazer parse do JSON:', parseError);
      return new Response(
        JSON.stringify({ 
          error: 'JSON inválido',
          details: 'Corpo da requisição deve ser um JSON válido' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validações detalhadas
    const validationErrors: string[] = [];
    
    if (!leadData.nome) {
      validationErrors.push('Campo "nome" é obrigatório');
    } else if (!validateName(leadData.nome)) {
      validationErrors.push('Campo "nome" deve ter entre 2 e 100 caracteres');
    }

    if (!leadData.telefone) {
      validationErrors.push('Campo "telefone" é obrigatório');
    } else if (!validatePhone(leadData.telefone)) {
      validationErrors.push('Campo "telefone" deve ter formato válido (10-15 dígitos)');
    }

    if (validationErrors.length > 0) {
      console.warn('Dados inválidos:', validationErrors);
      return new Response(
        JSON.stringify({ 
          error: 'Dados inválidos',
          validation_errors: validationErrors 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verificar duplicatas
    console.log('Verificando duplicatas...');
    const { data: duplicateCheck, error: duplicateError } = await supabase
      .rpc('check_duplicate_lead', { _telefone: leadData.telefone, _time_window_minutes: 5 });

    if (duplicateError) {
      console.error('Erro ao verificar duplicatas:', duplicateError);
      // Continuar mesmo com erro na verificação de duplicatas
    } else if (duplicateCheck) {
      console.log(`Lead duplicado detectado para telefone: ${leadData.telefone.substring(0, 8)}****`);
      return new Response(
        JSON.stringify({ 
          error: 'Lead duplicado', 
          message: `Um lead com este telefone já foi registrado nos últimos 5 minutos.`,
          duplicate_window_minutes: 5
        }),
        { 
          status: 409, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Determinar empresa de destino
    let targetCompany: Company;
    
    if (leadData.company_id) {
      console.log('Buscando empresa específica:', leadData.company_id);
      const { data: specificCompany, error: specificCompanyError } = await supabase
        .from('companies')
        .select('id, name')
        .eq('id', leadData.company_id)
        .maybeSingle();

      if (specificCompanyError) {
        console.error('Erro ao buscar empresa específica:', specificCompanyError);
        return new Response(
          JSON.stringify({ 
            error: 'Erro ao buscar empresa específica',
            details: specificCompanyError.message 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      if (!specificCompany) {
        console.warn('Empresa não encontrada:', leadData.company_id);
        return new Response(
          JSON.stringify({ 
            error: 'Empresa não encontrada',
            company_id: leadData.company_id 
          }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      targetCompany = specificCompany;
    } else {
      console.log('Buscando empresa padrão...');
      const { data: defaultCompany, error: companyError } = await supabase
        .from('companies')
        .select('id, name')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (companyError) {
        console.error('Erro ao buscar empresa padrão:', companyError);
        return new Response(
          JSON.stringify({ 
            error: 'Erro ao buscar empresa padrão',
            details: companyError.message 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      if (!defaultCompany) {
        console.error('Nenhuma empresa encontrada no sistema');
        return new Response(
          JSON.stringify({ 
            error: 'Nenhuma empresa encontrada',
            message: 'É necessário ter pelo menos uma empresa cadastrada no sistema' 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      targetCompany = defaultCompany;
    }

    console.log('Empresa selecionada:', { id: targetCompany.id, name: targetCompany.name });

    // Verificar se há usuários ativos na empresa
    const { data: activeUsers, error: usersError } = await supabase
      .from('users')
      .select('id, name, status')
      .eq('company_id', targetCompany.id)
      .eq('status', 'ativo');

    if (usersError) {
      console.error('Erro ao buscar usuários ativos:', usersError);
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao verificar usuários disponíveis',
          details: usersError.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!activeUsers || activeUsers.length === 0) {
      console.warn('Nenhum usuário ativo encontrado na empresa:', targetCompany.name);
      return new Response(
        JSON.stringify({ 
          error: 'Nenhum usuário ativo disponível',
          message: `A empresa "${targetCompany.name}" não possui usuários ativos para receber leads`,
          company: { id: targetCompany.id, name: targetCompany.name }
        }),
        { 
          status: 422, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Encontrados ${activeUsers.length} usuários ativos na empresa`);

    // Criar o lead
    console.log('Criando lead...');
    const { data: newLead, error: leadError } = await supabase
      .from('leads')
      .insert({
        nome: leadData.nome.trim(),
        telefone: leadData.telefone.trim(),
        dados_adicionais: leadData.dados_adicionais?.trim() || null,
        etapa: 'aguardando-atendimento',
        atividades: [],
        company_id: targetCompany.id
        // user_id será atribuído automaticamente pelo trigger round-robin
      })
      .select('*, users!leads_user_id_fkey(name, email)')
      .maybeSingle();

    if (leadError) {
      console.error('Erro ao criar lead:', leadError);
      
      // Tratamento específico para diferentes tipos de erro
      if (leadError.code === 'P0001' && leadError.message.includes('Lead duplicado detectado')) {
        return new Response(
          JSON.stringify({ 
            error: 'Lead duplicado', 
            message: `Um lead com este telefone já foi registrado nos últimos 5 minutos.`,
            duplicate_window_minutes: 5
          }),
          { 
            status: 409, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      if (leadError.code === '23505') { // Violação de constraint única
        return new Response(
          JSON.stringify({ 
            error: 'Conflito de dados', 
            message: 'Já existe um registro com estes dados',
            details: leadError.message 
          }),
          { 
            status: 409, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      return new Response(
        JSON.stringify({ 
          error: 'Erro ao criar lead', 
          details: leadError.message,
          code: leadError.code 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!newLead) {
      console.error('Lead criado mas dados não retornados');
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao recuperar dados do lead criado' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const executionTime = Date.now() - startTime;
    console.log(`Lead criado com sucesso em ${executionTime}ms:`, {
      lead_id: newLead.id,
      user_id: newLead.user_id,
      company_id: newLead.company_id,
      assigned_user: newLead.users?.name
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        lead: {
          id: newLead.id,
          nome: newLead.nome,
          telefone: newLead.telefone,
          etapa: newLead.etapa,
          created_at: newLead.created_at,
          user_id: newLead.user_id,
          company_id: newLead.company_id
        },
        assigned_user: {
          id: newLead.user_id,
          name: newLead.users?.name || 'Usuário não encontrado',
          email: newLead.users?.email || null
        },
        company: {
          id: targetCompany.id,
          name: targetCompany.name
        },
        execution_time_ms: executionTime
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error('Erro crítico no webhook:', error);
    console.error('Stack trace:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor',
        message: 'Ocorreu um erro inesperado. Tente novamente.',
        execution_time_ms: executionTime,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CompanySettings {
  company_id: string;
  auto_repique_enabled: boolean;
  auto_repique_minutes: number;
}

interface LeadToRepique {
  id: string;
  nome: string;
  user_id: string;
  company_id: string;
  repique_count: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('=== Auto Repique de Leads - Iniciando ===');

    // 1. Buscar empresas com repique automático ativado
    const { data: companies, error: companiesError } = await supabase
      .from('company_settings')
      .select('company_id, auto_repique_enabled, auto_repique_minutes')
      .eq('auto_repique_enabled', true);

    if (companiesError) {
      console.error('Erro ao buscar empresas:', companiesError);
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar empresas', details: companiesError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!companies || companies.length === 0) {
      console.log('Nenhuma empresa com repique automático ativado');
      return new Response(
        JSON.stringify({ success: true, message: 'Nenhuma empresa com repique ativado', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Empresas com repique ativado: ${companies.length}`);

    let totalProcessed = 0;
    const results: any[] = [];

    // 2. Para cada empresa, buscar leads para repique
    for (const company of companies as CompanySettings[]) {
      const { company_id, auto_repique_minutes } = company;
      
      if (!company_id) continue;

      console.log(`Processando empresa: ${company_id} (timeout: ${auto_repique_minutes} min)`);

      // Calcular o timestamp limite
      const timeLimit = new Date();
      timeLimit.setMinutes(timeLimit.getMinutes() - auto_repique_minutes);

      // Data de corte: somente leads criados a partir de hoje são elegíveis
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const cutoffDate = today.toISOString();

      // Buscar leads que precisam de repique (somente leads novos a partir de hoje)
      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('id, nome, user_id, company_id, repique_count')
        .eq('company_id', company_id)
        .eq('etapa', 'aguardando-atendimento')
        .is('primeiro_contato_whatsapp', null)
        .gte('created_at', cutoffDate) // Somente leads criados a partir de hoje
        .lt('assigned_at', timeLimit.toISOString())
        .lt('repique_count', 3); // Limite máximo de repiques

      if (leadsError) {
        console.error(`Erro ao buscar leads para empresa ${company_id}:`, leadsError);
        continue;
      }

      if (!leads || leads.length === 0) {
        console.log(`Nenhum lead para repique na empresa ${company_id}`);
        continue;
      }

      console.log(`Leads para repique na empresa ${company_id}: ${leads.length}`);

      // 3. Processar cada lead
      for (const lead of leads as LeadToRepique[]) {
        try {
          // Buscar próximo usuário no round-robin (excluindo o usuário atual)
          const { data: nextUser, error: userError } = await supabase
            .from('users')
            .select('id, name')
            .eq('company_id', company_id)
            .eq('status', 'ativo')
            .neq('id', lead.user_id)
            .order('ultimo_lead_recebido', { ascending: true, nullsFirst: true })
            .limit(1)
            .maybeSingle();

          if (userError || !nextUser) {
            console.log(`Sem usuário alternativo disponível para lead ${lead.id}`);
            continue;
          }

          console.log(`Transferindo lead ${lead.id} de ${lead.user_id} para ${nextUser.id}`);

          // Atualizar o lead
          const { error: updateError } = await supabase
            .from('leads')
            .update({
              user_id: nextUser.id,
              assigned_at: new Date().toISOString(),
              repique_count: lead.repique_count + 1
            })
            .eq('id', lead.id);

          if (updateError) {
            console.error(`Erro ao atualizar lead ${lead.id}:`, updateError);
            continue;
          }

          // Atualizar ultimo_lead_recebido do novo usuário
          await supabase
            .from('users')
            .update({ ultimo_lead_recebido: new Date().toISOString() })
            .eq('id', nextUser.id);

          // Registrar log de transferência automática
          await supabase
            .from('logs')
            .insert({
              user_id: nextUser.id,
              action: `Repique automático (${lead.repique_count + 1}x)`,
              entity: 'lead',
              entity_id: lead.id,
              company_id: company_id,
              details: {
                from_user: lead.user_id,
                to_user: nextUser.id,
                to_user_name: nextUser.name,
                repique_count: lead.repique_count + 1,
                reason: 'Sem contato WhatsApp no tempo limite'
              }
            });

          // Enviar notificação push para o novo usuário
          try {
            await supabase.functions.invoke('send-push-notification', {
              body: {
                userId: nextUser.id,
                title: '🔄 Repique de Lead',
                body: `Novo lead recebido via repique: ${lead.nome}`,
                data: {
                  leadId: lead.id,
                  url: '/'
                }
              }
            });
            console.log(`Notificação enviada para usuário ${nextUser.id}`);
          } catch (notifError) {
            console.error('Erro ao enviar notificação:', notifError);
          }

          totalProcessed++;
          results.push({
            leadId: lead.id,
            leadName: lead.nome,
            fromUser: lead.user_id,
            toUser: nextUser.id,
            toUserName: nextUser.name,
            repiqueCount: lead.repique_count + 1
          });

        } catch (leadError) {
          console.error(`Erro ao processar lead ${lead.id}:`, leadError);
        }
      }
    }

    console.log(`=== Auto Repique finalizado. Total processado: ${totalProcessed} ===`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${totalProcessed} leads redistribuídos`,
        processed: totalProcessed,
        details: results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro no auto-repique:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

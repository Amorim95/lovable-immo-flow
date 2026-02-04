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
    let totalWarnings = 0;
    const results: any[] = [];
    const warnings: any[] = [];

    // 2. Para cada empresa, processar avisos e repiques
    for (const company of companies as CompanySettings[]) {
      const { company_id, auto_repique_minutes } = company;
      
      if (!company_id) continue;

      console.log(`Processando empresa: ${company_id} (timeout: ${auto_repique_minutes} min)`);

      // Data de corte: somente leads criados a partir de hoje são elegíveis
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const cutoffDate = today.toISOString();

      // ========================================
      // FASE 1: AVISOS (2 minutos antes do timeout)
      // ========================================
      const warningMinutes = auto_repique_minutes - 2;
      
      // Só enviar avisos se o tempo configurado for maior que 2 minutos
      if (warningMinutes > 0) {
        // Janela de 1 minuto para evitar avisos duplicados
        // Ex: timeout 10 min -> aviso entre 8-9 min (apenas 1 execução do cron)
        const warningTimeStart = new Date();
        warningTimeStart.setMinutes(warningTimeStart.getMinutes() - (auto_repique_minutes - 1));
        
        const warningTimeEnd = new Date();
        warningTimeEnd.setMinutes(warningTimeEnd.getMinutes() - warningMinutes);

        // Buscar leads que estão entre warningMinutes e auto_repique_minutes de inatividade
        // (ou seja, faltam ~2 minutos para o timeout)
        const { data: leadsToWarn, error: warnError } = await supabase
          .from('leads')
          .select('id, nome, user_id, company_id')
          .eq('company_id', company_id)
          .eq('etapa', 'aguardando-atendimento')
          .is('primeiro_contato_whatsapp', null)
          .gte('created_at', cutoffDate)
          .gte('assigned_at', warningTimeStart.toISOString())
          .lt('assigned_at', warningTimeEnd.toISOString())
          .lt('repique_count', 3);

        if (warnError) {
          console.error(`Erro ao buscar leads para aviso na empresa ${company_id}:`, warnError);
        } else if (leadsToWarn && leadsToWarn.length > 0) {
          console.log(`Leads para aviso na empresa ${company_id}: ${leadsToWarn.length}`);

          for (const lead of leadsToWarn) {
            try {
              // Enviar notificação de aviso para o usuário ATUAL
              await supabase.functions.invoke('send-push-notification', {
                body: {
                  userId: lead.user_id,
                  title: '⚠️ Em 2 min você vai perder uma oportunidade! ⚠️',
                  body: `Se você não atender o Lead: ${lead.nome} ele será enviado para outro corretor!`,
                  data: {
                    leadId: lead.id,
                    url: '/',
                    type: 'repique_warning'
                  }
                }
              });
              console.log(`Aviso enviado para usuário ${lead.user_id} sobre lead ${lead.id}`);
              
              totalWarnings++;
              warnings.push({
                leadId: lead.id,
                leadName: lead.nome,
                userId: lead.user_id
              });
            } catch (notifError) {
              console.error('Erro ao enviar aviso:', notifError);
            }
          }
        }
      }

      // ========================================
      // FASE 2: REPIQUE (leads que já passaram do timeout)
      // ========================================
      const timeLimit = new Date();
      timeLimit.setMinutes(timeLimit.getMinutes() - auto_repique_minutes);

      // Buscar leads que precisam de repique
      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('id, nome, user_id, company_id, repique_count')
        .eq('company_id', company_id)
        .eq('etapa', 'aguardando-atendimento')
        .is('primeiro_contato_whatsapp', null)
        .gte('created_at', cutoffDate)
        .lt('assigned_at', timeLimit.toISOString())
        .lt('repique_count', 3);

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

          // Buscar atividades atuais do lead
          const { data: leadAtual } = await supabase
            .from('leads')
            .select('atividades')
            .eq('id', lead.id)
            .maybeSingle();

          // Criar atividade de reatribuição por repique
          const repiqueAtividade = {
            id: Date.now().toString(),
            tipo: 'observacao',
            descricao: `Lead reatribuído a ${nextUser.name}`,
            data: new Date().toISOString(),
            corretor: 'Sistema (Repique Automático)'
          };

          const atividadesAtuais = (leadAtual?.atividades as any[]) || [];
          const novasAtividades = [...atividadesAtuais, repiqueAtividade];

          // Atualizar o lead com a nova atividade
          const { error: updateError } = await supabase
            .from('leads')
            .update({
              user_id: nextUser.id,
              assigned_at: new Date().toISOString(),
              repique_count: lead.repique_count + 1,
              atividades: novasAtividades
            })
            .eq('id', lead.id);

          if (updateError) {
            console.error(`Erro ao atualizar lead ${lead.id}:`, updateError);
            continue;
          }
          
          console.log(`Atividade de reatribuição registrada para lead ${lead.id}`);

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
                title: '🔔 Alerta de Oportunidade 🔔',
                body: `O lead ${lead.nome} não foi atendido por outro corretor no tempo limite e foi enviado agora para você atender!`,
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

    console.log(`=== Auto Repique finalizado. Avisos: ${totalWarnings}, Redistribuídos: ${totalProcessed} ===`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${totalWarnings} avisos enviados, ${totalProcessed} leads redistribuídos`,
        warnings_sent: totalWarnings,
        processed: totalProcessed,
        warnings: warnings,
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

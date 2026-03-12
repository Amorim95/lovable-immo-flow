import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    // Extract the slug from the URL path or from query param
    const slug = url.searchParams.get("slug");

    if (!slug) {
      return new Response(JSON.stringify({ error: "Slug do webhook não informado" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Find the webhook config
    const { data: webhook, error: webhookError } = await supabase
      .from("company_webhooks")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (webhookError || !webhook) {
      console.error("Webhook not found or inactive:", webhookError);
      return new Response(JSON.stringify({ error: "Webhook não encontrado ou inativo" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const companyId = webhook.company_id;
    const stageName = webhook.stage_name;
    const tagIds: string[] = webhook.tag_ids || [];
    const teamId: string | null = webhook.team_id;

    // Parse body
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Body JSON inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const nome = body.nome || body.name || body.lead_name || "Lead sem nome";
    const telefone = body.telefone || body.phone || body.tel || body.whatsapp || "";
    const dadosAdicionais = body.dados_adicionais || body.additional_data || body.message || body.observacao || null;

    if (!telefone) {
      return new Response(JSON.stringify({ error: "Telefone é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Map stage_name to legacy etapa
    const stageMap: Record<string, string> = {
      "Aguardando Atendimento": "aguardando-atendimento",
      "Tentativas de Contato": "tentativas-contato",
      "Atendeu": "atendeu",
      "Visita": "visita",
      "Vendas Fechadas": "vendas-fechadas",
      "Em Pausa": "em-pausa",
      "Descarte": "descarte",
      "Nome Sujo": "nome-sujo",
      "Nome Limpo": "nome-limpo",
    };
    const etapa = stageMap[stageName] || "aguardando-atendimento";

    // Determine user via round-robin
    let assignedUserId: string | null = null;

    if (teamId) {
      // Round-robin only among team members
      const { data: teamUser } = await supabase
        .from("users")
        .select("id")
        .eq("company_id", companyId)
        .eq("equipe_id", teamId)
        .eq("status", "ativo")
        .order("ultimo_lead_recebido", { ascending: true, nullsFirst: true })
        .limit(1)
        .single();

      if (teamUser) {
        assignedUserId = teamUser.id;
        await supabase.from("users").update({ ultimo_lead_recebido: new Date().toISOString() }).eq("id", assignedUserId);
      }
    }

    if (!assignedUserId) {
      // Fallback: round-robin across entire company
      const { data: nextUser } = await supabase.rpc("get_next_user_round_robin", { _company_id: companyId });
      assignedUserId = nextUser;
    }

    if (!assignedUserId) {
      return new Response(JSON.stringify({ error: "Nenhum usuário ativo disponível" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check duplicate
    const { data: dupCheck } = await supabase.rpc("create_lead_safe", {
      _nome: nome,
      _telefone: telefone,
      _dados_adicionais: dadosAdicionais,
      _company_id: companyId,
      _user_id: assignedUserId,
    });

    if (!dupCheck || dupCheck.length === 0) {
      return new Response(JSON.stringify({ error: "Erro ao criar lead" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = dupCheck[0];

    if (result.is_duplicate) {
      console.log("Lead duplicado ignorado:", result.lead_id);
      return new Response(JSON.stringify({
        success: true,
        duplicate: true,
        lead_id: result.lead_id,
        message: result.message,
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const leadId = result.lead_id;

    // Update stage
    await supabase.from("leads").update({
      etapa,
      stage_name: stageName,
    }).eq("id", leadId);

    // Assign tags
    if (tagIds.length > 0) {
      const tagRelations = tagIds.map(tagId => ({
        lead_id: leadId,
        tag_id: tagId,
      }));
      await supabase.from("lead_tag_relations").insert(tagRelations);
    }

    // Save notification to history
    try {
      await supabase.from("notifications").insert({
        user_id: assignedUserId,
        company_id: companyId,
        title: "🔔 Novo Lead!",
        body: `${nome} - ${telefone}`,
        type: "lead",
        lead_id: leadId,
      });
    } catch (notifErr) {
      console.error("Notification history error (non-fatal):", notifErr);
    }

    // Send push notification
    try {
      const { data: subscriptions } = await supabase
        .from("push_subscriptions")
        .select("subscription")
        .eq("user_id", assignedUserId);

      if (subscriptions && subscriptions.length > 0) {
        await supabase.functions.invoke("send-push-notification", {
          body: {
            userId: assignedUserId,
            title: "🔔 Novo Lead!",
            body: `${nome} - ${telefone}`,
            url: `/leads/${leadId}`,
          },
        });
      }
    } catch (pushErr) {
      console.error("Push notification error (non-fatal):", pushErr);
    }

    console.log(`Webhook ${slug}: Lead ${leadId} criado -> Etapa: ${stageName}, User: ${assignedUserId}, Tags: ${tagIds.length}`);

    return new Response(JSON.stringify({
      success: true,
      lead_id: leadId,
      assigned_to: assignedUserId,
      stage: stageName,
      tags_count: tagIds.length,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: err.message || "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

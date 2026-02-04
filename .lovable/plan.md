
# Plano: Notificar Usuário Quando Lead For Atribuído

## Resumo

Adicionar notificação push em todos os webhooks que criam leads, para que o usuário seja notificado quando receber um lead - mesmo com o PWA fechado.

## Situação Atual

| Webhook | Notificação Push |
|---------|------------------|
| `webhook-lead` | Sim |
| `webhook-lead-click-imoveis` | Sim |
| `webhook-lead-click-imoveis-nao-qualificado` | Sim |
| `webhook-lead-janaina-vidalete` | **Sim** ✅ |
| `webhook-lead-mays-imob` | **Sim** ✅ |
| `webhook-lead-vivaz` | **Sim** ✅ |
| `webhook-lead-vivaz-zona-sul` | **Sim** ✅ |
| `webhook-lead-vivaz-zona-leste` | **Sim** ✅ |
| `webhook-lead-araujo-broker` | **Sim** ✅ |
| `webhook-lead-recuperar` | **Sim** ✅ |

## O Que Sera Feito

Adicionar o codigo de notificacao push nos 6 webhooks que ainda nao tem.

O codigo a adicionar (apos criar o lead com sucesso):

```text
// Enviar notificacao push para o usuario
if (!result.is_duplicate) {
  try {
    await supabase.functions.invoke('send-push-notification', {
      body: {
        userId: [ID_DO_USUARIO],
        title: 'Novo Lead - [NOME_DA_EMPRESA]',
        body: `Novo lead: ${leadData.nome}`,
        data: { leadId: result.lead_id, url: '/' }
      }
    });
    console.log('Notificacao push enviada');
  } catch (error) {
    console.error('Erro ao enviar notificacao:', error);
  }
}
```

## Arquivos a Modificar

| Arquivo | Empresa |
|---------|---------|
| `supabase/functions/webhook-lead-janaina-vidalete/index.ts` | MAYS IMOB |
| `supabase/functions/webhook-lead-mays-imob/index.ts` | MAYS IMOB |
| `supabase/functions/webhook-lead-vivaz/index.ts` | Vivaz Imoveis - ZONA NORTE |
| `supabase/functions/webhook-lead-vivaz-zona-sul/index.ts` | Vivaz Imoveis - ZONA SUL |
| `supabase/functions/webhook-lead-vivaz-zona-leste/index.ts` | Vivaz Imoveis - ZONA LESTE |
| `supabase/functions/webhook-lead-araujo-broker/index.ts` | Araujo Broker |
| `supabase/functions/webhook-lead-recuperar/index.ts` | Click Imoveis (Recuperar) |

## Fluxo de Funcionamento

```text
Lead chega via webhook
       |
       v
Webhook cria lead e atribui usuario
       |
       v
Webhook chama send-push-notification
       |
       v
Edge function busca subscription do usuario
       |
       v
Envia push via web-push
       |
       v
Service Worker exibe notificacao no dispositivo
```

## Observacoes

- A notificacao so e enviada se o lead NAO for duplicata
- Se o usuario nao tiver subscription ativa, a notificacao falha silenciosamente (sem erro)
- A infraestrutura ja existe e funciona (VAPID keys configuradas, Edge Function pronta, subscriptions ativas no banco)

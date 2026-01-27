
## Plano: Criar Edge Function webhook-lead-click-imoveis

### Objetivo
Criar uma nova Edge Function dedicada para a empresa **Click Imóveis** que:
1. Recebe leads via webhook
2. Distribui entre os corretores ativos usando round-robin
3. Adiciona automaticamente a etiqueta **"Lead Qualificado Pela IA"**
4. Envia notificação push para o corretor

### IDs Fixos
| Recurso | ID |
|---------|-----|
| Click Imóveis | `c95541d9-3e6a-4fc1-8d64-c5a6d5f7c9b6` |
| Tag "Lead Qualificado Pela IA" | `89b0d175-7ac8-44b3-9f47-dec34353ccac` |

### Arquivos a Criar/Modificar

#### 1. Criar `supabase/functions/webhook-lead-click-imoveis/index.ts`
```text
Estrutura da Edge Function:
├── CORS headers
├── Validação do método POST
├── Parse do payload JSON (nome, telefone, dados_adicionais)
├── Buscar próximo usuário ativo da Click Imóveis (round-robin)
├── Criar lead via create_lead_safe RPC
├── Adicionar etiqueta "Lead Qualificado Pela IA"
├── Atualizar ultimo_lead_recebido do usuário
├── Enviar notificação push
└── Retornar resposta de sucesso
```

#### 2. Atualizar `supabase/config.toml`
Adicionar configuração para a nova função:
```toml
[functions.webhook-lead-click-imoveis]
verify_jwt = false
```

### Payload Esperado
```json
{
  "nome": "Nome do Lead",
  "telefone": "21999999999",
  "dados_adicionais": "Informações extras (opcional)"
}
```

### URL do Webhook (após deploy)
```
https://loxpoehsddfearnzcdla.supabase.co/functions/v1/webhook-lead-click-imoveis
```

### Fluxo de Funcionamento
1. Sistema externo envia POST com dados do lead
2. Edge function valida campos obrigatórios (nome, telefone)
3. Busca próximo corretor ativo da Click Imóveis (round-robin)
4. Cria lead usando `create_lead_safe` (previne duplicatas)
5. Adiciona tag "Lead Qualificado Pela IA"
6. Atualiza `ultimo_lead_recebido` do corretor
7. Envia notificação push para o corretor
8. Retorna JSON com sucesso e dados do lead

### Diferença do webhook-lead atual
O `webhook-lead` atual já atende a Click Imóveis, mas esta nova função:
- É dedicada exclusivamente para Click Imóveis
- Usa IDs hardcoded (mais performático)
- Facilita rastreamento de logs separado
- Permite customizações futuras específicas

### Seção Técnica

A implementação seguirá o padrão das edge functions existentes (`webhook-lead-janaina-vidalete`, `webhook-lead-mays-imob`):

```typescript
// Constantes fixas
const CLICK_IMOVEIS_COMPANY_ID = 'c95541d9-3e6a-4fc1-8d64-c5a6d5f7c9b6';
const TAG_LEAD_QUALIFICADO_IA_ID = '89b0d175-7ac8-44b3-9f47-dec34353ccac';

// Round-robin: buscar usuário com ultimo_lead_recebido mais antigo
const { data: nextUser } = await supabase
  .from('users')
  .select('id, name')
  .eq('company_id', CLICK_IMOVEIS_COMPANY_ID)
  .eq('status', 'ativo')
  .order('ultimo_lead_recebido', { ascending: true, nullsFirst: true })
  .limit(1)
  .single();

// Criar lead com proteção contra duplicatas
const { data: leadResult } = await supabase.rpc('create_lead_safe', {
  _nome: body.nome,
  _telefone: telefoneLimpo,
  _dados_adicionais: body.dados_adicionais,
  _company_id: CLICK_IMOVEIS_COMPANY_ID,
  _user_id: nextUser.id
});

// Adicionar etiqueta
await supabase.from('lead_tag_relations').insert({
  lead_id: leadResult.lead_id,
  tag_id: TAG_LEAD_QUALIFICADO_IA_ID
});
```

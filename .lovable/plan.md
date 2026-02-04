

# Plano de Teste do Repique Automático

## Objetivo
Testar o sistema de repique automático de leads, criando um lead de teste e configurando o tempo limite para 1 minuto.

## Passos para o Teste

### 1. Corrigir Erro de Build
Há um erro no arquivo `src/components/ui/label.tsx` que precisa ser corrigido primeiro. O componente Label não está retornando JSX corretamente.

### 2. Ativar o Repique Automático para a Empresa
Atualizar as configurações da empresa **Click Imóveis** para:
- `auto_repique_enabled`: true
- `auto_repique_minutes`: 1 (1 minuto para o teste)

### 3. Criar Lead de Teste
Criar um lead de teste usando a edge function `webhook-lead` com:
- Nome: "Lead Teste Repique"
- Telefone: "5511999999999"
- company_id: `c95541d9-3e6a-4fc1-8d64-c5a6d5f7c9b6` (Click Imóveis)

### 4. Aguardar e Monitorar
Após 1 minuto, o cron job deve executar e:
1. Detectar que o lead está na etapa "aguardando-atendimento"
2. Verificar que não houve contato via WhatsApp
3. Verificar que passou mais de 1 minuto desde o `assigned_at`
4. Transferir o lead para o próximo usuário na fila
5. Incrementar o `repique_count` para 1
6. Enviar notificação push para o novo usuário

## Verificações Após o Teste
- Consultar o lead para ver se o `user_id` mudou
- Verificar se o `repique_count` foi incrementado
- Consultar a tabela de logs para ver o registro de transferência
- Verificar os logs da edge function `auto-repique-leads`

## Detalhes Técnicos

**Arquivos a modificar:**
- `src/components/ui/label.tsx` - Corrigir o componente para retornar JSX

**Configurações de banco de dados:**
```sql
UPDATE company_settings 
SET auto_repique_enabled = true, auto_repique_minutes = 1 
WHERE company_id = 'c95541d9-3e6a-4fc1-8d64-c5a6d5f7c9b6';
```

**Chamada para criar lead de teste:**
```json
POST /functions/v1/webhook-lead
{
  "nome": "Lead Teste Repique",
  "telefone": "5511999999999",
  "company_id": "c95541d9-3e6a-4fc1-8d64-c5a6d5f7c9b6"
}
```

**Query para verificar resultado após 1 minuto:**
```sql
SELECT id, nome, user_id, assigned_at, repique_count 
FROM leads 
WHERE telefone = '5511999999999' 
ORDER BY created_at DESC LIMIT 1;
```


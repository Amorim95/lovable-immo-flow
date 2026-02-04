

# Plano: Sistema de Repique Automático de Leads

## Status: ✅ Implementado

## Resumo da Funcionalidade

Sistema opcional por empresa que redireciona automaticamente leads não atendidos (sem clique em "Tentativa de contato via WhatsApp") após X minutos para o próximo usuário da fila.

## Componentes Implementados

### 1. ✅ Banco de Dados (Migration Executada)

| Tabela | Coluna | Descrição |
|--------|--------|-----------|
| `company_settings` | `auto_repique_enabled` | boolean (default: false) |
| `company_settings` | `auto_repique_minutes` | integer (default: 5) |
| `leads` | `assigned_at` | timestamp - Quando foi atribuído ao usuário atual |
| `leads` | `repique_count` | integer - Quantas vezes foi repassado |

### 2. ✅ Edge Function: `auto-repique-leads`

Função que verifica e redistribui leads não atendidos:
- Busca empresas com `auto_repique_enabled = true`
- Para cada empresa, busca leads pendentes sem contato WhatsApp
- Redistribui para próximo usuário via round-robin
- Envia notificação push
- Limite máximo: 3 repiques por lead

### 3. ✅ Interface de Configuração

Componente `AutoRepiqueSettings` adicionado em "Gestão de Usuários":
- Toggle para ativar/desativar
- Campo para configurar tempo limite (1-30 minutos)
- Visível apenas para admins

### 4. ✅ Badge de Repique no Lead Card

Componente `RepiqueBadge` mostra contador quando lead foi redistribuído:
- "Repique 1x", "Repique 2x", etc.

### 5. ✅ Webhook Atualizado

`webhook-lead` atualiza `assigned_at` ao criar leads.

## ⚠️ Configuração Pendente: Cron Job

Para o repique automático funcionar, é necessário configurar um cron job no Supabase:

### Opção 1: Via Dashboard Supabase (Recomendado)

1. Acesse o Dashboard do Supabase
2. Vá em Database > Extensions
3. Habilite a extensão `pg_cron`
4. Vá em SQL Editor e execute:

```sql
SELECT cron.schedule(
  'auto-repique-leads',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://loxpoehsddfearnzcdla.supabase.co/functions/v1/auto-repique-leads',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxveHBvZWhzZGRmZWFybnpjZGxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyOTg4NjgsImV4cCI6MjA2Njg3NDg2OH0.2jHJynuzjEhK3Gk_OrFMR6zM3Tyq3JWIYjhiVQVx4wY"}'::jsonb,
    body := concat('{"time": "', now(), '"}')::jsonb
  ) AS request_id;
  $$
);
```

### Opção 2: Usar Serviço Externo

Usar um serviço como cron-job.org, EasyCron ou GitHub Actions para chamar a edge function a cada minuto.

## Como Usar

1. Acesse "Gestão de Usuários" como admin
2. Encontre a seção "Repique Automático"
3. Ative o toggle
4. Configure o tempo limite desejado (padrão: 5 minutos)
5. Salve as configurações

## Fluxo de Funcionamento

```
Lead atribuído → Timer inicia → 5 min sem WhatsApp → Repique automático
                                                    ↓
                              Próximo usuário recebe + notificação push
```

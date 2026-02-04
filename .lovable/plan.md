

# Plano: Sistema de Repique Automático de Leads

## Resumo da Funcionalidade

Criar um sistema opcional por empresa que redireciona automaticamente leads não atendidos (sem clique em "Tentativa de contato via WhatsApp") após 5 minutos para o próximo usuário da fila.

## Arquitetura da Solução

```text
┌─────────────────────────────────────────────────────────────────────┐
│                    FLUXO DE REPIQUE AUTOMÁTICO                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. Lead é atribuído ao Usuário A                                   │
│             ↓                                                       │
│  2. Timer de 5 minutos inicia (created_at ou assigned_at)           │
│             ↓                                                       │
│  3. Cron Job verifica a cada minuto:                                │
│     → Lead sem "primeiro_contato_whatsapp"?                         │
│     → Mais de 5 minutos desde atribuição?                           │
│     → Empresa com repique automático ativado?                       │
│             ↓                                                       │
│  4. Se sim: Lead vai para próximo da fila (round-robin)             │
│             + Log de transferência automática                       │
│             + Notificação push para novo corretor                   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Componentes a Implementar

### 1. Banco de Dados

| Alteração | Tabela | Descrição |
|-----------|--------|-----------|
| Nova coluna | `company_settings` | `auto_repique_enabled` (boolean, default: false) |
| Nova coluna | `company_settings` | `auto_repique_minutes` (integer, default: 5) |
| Nova coluna | `leads` | `assigned_at` (timestamp) - Para rastrear quando foi atribuído ao usuário atual |
| Nova coluna | `leads` | `repique_count` (integer, default: 0) - Quantas vezes foi repassado |

### 2. Edge Function: `auto-repique-leads`

Função que será executada via cron job a cada minuto para verificar e redistribuir leads não atendidos.

```text
Lógica:
1. Buscar empresas com auto_repique_enabled = true
2. Para cada empresa, buscar leads onde:
   - primeiro_contato_whatsapp IS NULL
   - assigned_at < now() - interval 'X minutes'
   - etapa = 'aguardando-atendimento'
3. Para cada lead encontrado:
   - Buscar próximo usuário no round-robin
   - Atualizar user_id e assigned_at
   - Incrementar repique_count
   - Registrar log de transferência automática
   - Enviar notificação push
```

### 3. Interface de Configuração

Adicionar toggle em "Gestão de Usuários" (ou criar seção em Configurações) para:

- Ativar/desativar repique automático
- Configurar tempo limite (padrão: 5 minutos)
- Ver estatísticas de repiques

### 4. Atualização dos Webhooks

Atualizar webhooks de criação de leads para:
- Preencher campo `assigned_at` com timestamp atual
- Garantir que `primeiro_contato_whatsapp` começa como NULL

### 5. Indicador Visual no Lead Card

Mostrar badge/contador quando o lead foi repassado automaticamente:
- "Repique 1x", "Repique 2x", etc.

## Detalhes Técnicos

### Migration SQL

```sql
-- Adicionar colunas em company_settings
ALTER TABLE company_settings 
ADD COLUMN IF NOT EXISTS auto_repique_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS auto_repique_minutes integer DEFAULT 5;

-- Adicionar colunas em leads
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS assigned_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS repique_count integer DEFAULT 0;

-- Atualizar leads existentes
UPDATE leads SET assigned_at = created_at WHERE assigned_at IS NULL;
```

### Edge Function Principal

```typescript
// supabase/functions/auto-repique-leads/index.ts
// Executada via cron a cada minuto

1. Buscar empresas com repique ativado
2. Para cada empresa:
   - Buscar leads pendentes de atendimento
   - Verificar se passou o tempo limite
   - Redistribuir para próximo usuário
   - Enviar notificação
```

### Configuração do Cron Job

```sql
SELECT cron.schedule(
  'auto-repique-leads',
  '* * * * *', -- a cada minuto
  $$ SELECT net.http_post(...) $$
);
```

## Arquivos a Criar/Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `migrations/add_auto_repique.sql` | Criar | Adicionar colunas no banco |
| `supabase/functions/auto-repique-leads/index.ts` | Criar | Edge function do cron |
| `src/components/AutoRepiqueSettings.tsx` | Criar | Componente de configuração |
| `src/pages/Corretores.tsx` | Modificar | Adicionar seção de configuração |
| `src/components/LeadCard.tsx` | Modificar | Mostrar badge de repique |
| Webhooks existentes | Modificar | Preencher assigned_at |

## Benefícios

- **Nenhum lead perdido**: Leads não atendidos são automaticamente redistribuídos
- **Configurável por empresa**: Cada empresa decide se quer usar
- **Tempo configurável**: Pode ajustar de 1 a 30 minutos
- **Transparência**: Contador de repiques mostra histórico
- **Notificações**: Novos donos são avisados imediatamente

## Riscos e Mitigações

| Risco | Mitigação |
|-------|-----------|
| Lead sendo transferido infinitamente | Limite máximo de repiques (ex: 3x) |
| Sobrecarga do cron | Execução otimizada com queries eficientes |
| Conflito com transferência manual | Respeitar transferências feitas pelo gestor |

## Estimativa

- **Banco de dados**: 1 migration
- **Edge Function**: 1 função nova
- **Frontend**: 2 componentes (configuração + badge)
- **Complexidade**: Média-alta (envolve cron job)


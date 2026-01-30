
# Plano: Corrigir Contagem de Leads no Dashboard

## Problema Identificado

O Dashboard mostra números incorretos de leads porque a query no `useDashboardMetrics.ts` usa `.limit(10000)` mas o **Supabase retorna no máximo 1000 rows por query** por padrão.

**Evidências:**
- Total de leads no banco: **5.964**
- Leads da Click Imóveis: **5.519**
- Dashboard mostra apenas ~700 leads (limite do Supabase atingido)
- Kanban usa paginação e mostra corretamente: 738 em "Recuperar"

## Causa Raiz

| Componente | Método de Query | Resultado |
|------------|-----------------|-----------|
| Kanban (`useLeadsOptimized`) | Loop de paginação com `range()` | Carrega TODOS os leads |
| Dashboard (`useDashboardMetrics`) | `.limit(10000)` simples | Truncado em 1000 pelo Supabase |

```typescript
// Dashboard atual (INCORRETO)
const { data: leadsData } = await supabase
  .from('leads')
  .select('...')
  .limit(10000); // Supabase ignora e retorna max 1000

// Kanban (CORRETO)
while (hasMore) {
  const { data } = await supabase
    .from('leads')
    .select('...')
    .range(from, from + pageSize - 1);
  // ... continua paginando
}
```

## Solução

Implementar a mesma lógica de paginação do `useLeadsOptimized` no hook `useDashboardMetrics`.

---

## Detalhes Técnicos

### Arquivo a modificar:
`src/hooks/useDashboardMetrics.ts`

### Alterações:

**1. Adicionar paginação na busca de leads (linhas 63-81)**

Substituir:
```typescript
let leadsQuery = supabase
  .from('leads')
  .select('id, etapa, stage_name, created_at, user_id, primeiro_contato_whatsapp')
  .limit(10000);

if (companyId) {
  leadsQuery = leadsQuery.eq('company_id', companyId);
}

if (dateRange?.from && dateRange?.to) {
  leadsQuery = leadsQuery
    .gte('created_at', dateRange.from.toISOString())
    .lte('created_at', dateRange.to.toISOString());
}

const { data: leadsData, error: leadsError } = await leadsQuery;
```

Por:
```typescript
// Implementar paginação para buscar TODOS os leads
let allLeads: any[] = [];
let from = 0;
const pageSize = 1000;
let hasMore = true;

while (hasMore) {
  let leadsQuery = supabase
    .from('leads')
    .select('id, etapa, stage_name, created_at, user_id, primeiro_contato_whatsapp')
    .order('created_at', { ascending: false })
    .range(from, from + pageSize - 1);

  if (companyId) {
    leadsQuery = leadsQuery.eq('company_id', companyId);
  }

  if (dateRange?.from && dateRange?.to) {
    leadsQuery = leadsQuery
      .gte('created_at', dateRange.from.toISOString())
      .lte('created_at', dateRange.to.toISOString());
  }

  const { data, error } = await leadsQuery;
  
  if (error) throw error;
  if (!data || data.length === 0) break;

  allLeads = [...allLeads, ...data];

  if (data.length < pageSize) {
    hasMore = false;
  } else {
    from += pageSize;
  }
}

const leadsData = allLeads;
```

**2. Aplicar mesma correção nas queries de crescimento (linhas 221-232 e 245-275)**

As queries de comparação de período anterior também precisam de paginação para garantir contagens corretas.

---

## Fluxo Corrigido

```text
Dashboard carrega
       |
       v
Loop de paginação
  (1000 em 1000)
       |
       v
Carrega TODOS os leads
  (5519 para Click Imóveis)
       |
       v
Conta por etapa
       |
       v
Números batem com Kanban
```

---

## Resultado Esperado

Após a correção:
- "Recuperar": 738 leads (igual ao Kanban)
- "Aguardando Atendimento": 292 leads (igual ao Kanban)
- "Em Tentativas de Contato": 2897 leads (igual ao Kanban)

## Arquivos Modificados

| Arquivo | Alteração |
|---------|-----------|
| `src/hooks/useDashboardMetrics.ts` | Implementar paginação automática igual ao Kanban |

## Risco

- **Baixo**: Apenas altera a forma de buscar dados, sem impacto na lógica de cálculo
- **Performance**: Pode aumentar levemente o tempo de carregamento para empresas com muitos leads, mas é necessário para garantir precisão dos dados

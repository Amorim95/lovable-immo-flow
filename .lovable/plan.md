## Diagnóstico (o que está acontecendo)

A página de Leads aparece em branco/carregando infinito para vários usuários da Click Imóveis. **Não é problema de permissão (RLS) nem de usuário inativo** — é **timeout de banco de dados**.

**Provas nos logs:**
- Postgres retornou múltiplos `ERROR: canceling statement due to statement timeout`
- A query que falha é exatamente a do `useLeadsOptimized`: SELECT em `leads` com `LEFT JOIN LATERAL users` + `LEFT JOIN LATERAL lead_tag_relations → lead_tags`, ordenada por `created_at DESC`, paginada de 1000 em 1000
- A Click Imóveis tem **10.677 leads** (Evaldo sozinho tem 438, Juliana Xavier 332, etc.)
- Faltam índices críticos:
  - Não existe índice composto `leads(company_id, created_at DESC)` — toda paginação filtra por `company_id` (via RLS) e ordena por `created_at`
  - Não existe índice em `lead_tag_relations(lead_id)` — o lateral join precisa varrer a tabela inteira para cada lead

**Por que afeta esses usuários e não outros:** todos veem a mesma query (RLS filtra por `company_id`). Quando o servidor está com carga, Click é a empresa mais lenta porque tem o maior volume + falta de índices. Usuários inativos (Juliana Xavier, Rayane) ainda conseguem logar, mas a query trava igualmente — não é o status que causa a tela em branco.

## O que vou fazer

### Etapa 1 — Índices no banco (resolve 80% do problema)
Criar via migration:
- `idx_leads_company_created` em `leads(company_id, created_at DESC)`
- `idx_lead_tag_relations_lead_id` em `lead_tag_relations(lead_id)`
- `idx_leads_company_user` em `leads(company_id, user_id)` (acelera filtro do corretor)

### Etapa 2 — Separar a query pesada (`useLeadsOptimized.ts`)
Seguindo o padrão já estabelecido no projeto (memo "Query Splitting Strategy"):
1. Buscar `leads` sozinho (sem joins de tags)
2. Buscar `users(name, equipe_id)` em uma query separada via `.in('id', userIds)`
3. Buscar `lead_tag_relations + lead_tags` em query separada via `.in('lead_id', leadIds)`
4. Combinar os 3 resultados em memória

Isso elimina os `LEFT JOIN LATERAL` que estão causando o timeout no PostgREST.

### Etapa 3 — Validação
- Rodar `EXPLAIN ANALYZE` antes/depois para confirmar uso dos índices
- Pedir para um usuário da Click testar a página Leads
- Conferir nos logs do Postgres que não há mais `statement timeout`

## Detalhes técnicos

- **Nenhuma mudança de schema/RLS** — só índices e refatoração de query no frontend
- **Sem mudança de comportamento visível** — mesma listagem, mesmos filtros, mesma paginação de 1000
- **Sem risco para outras empresas** — índices só ajudam, não atrapalham
- Os índices serão criados com `CREATE INDEX` simples na migration (não `CONCURRENTLY`, que não funciona dentro de transação de migration)

## Resumo

| Problema | Causa | Solução |
|---|---|---|
| Página em branco | Query timeout no Postgres | 3 índices + split de query |
| Afeta Click pesado | 10.677 leads + falta de índice + lateral joins | Índices compostos resolvem |
| Usuários "inativos" listados | Coincidência — eles ainda conseguem logar | Sem mudança aqui |

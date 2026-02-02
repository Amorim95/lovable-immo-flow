

# Diagnóstico: Lentidão ao Carregar Leads e Abrir Detalhes

## Problemas Identificados

### 1. Carregamento de TODOS os 5.604 leads de uma vez

O hook `useLeadsOptimized` carrega **todos os leads** do banco usando paginação (lotes de 1000), resultando em:
- 6 requisições sequenciais ao Supabase para carregar 5.604 leads
- Todo o processamento de conversão de dados acontece no frontend
- Toda vez que a página é acessada, esses dados são recarregados

### 2. LeadDetails depende do carregamento completo de todos os leads

Quando você clica em um lead, a página `LeadDetails` usa o mesmo hook `useLeadsOptimized` e precisa esperar **todos os 5.604 leads** carregarem para então encontrar apenas 1 lead:

```typescript
// LeadDetails.tsx - Linha 49-50
useEffect(() => {
  if (id && leads.length > 0) {  // ⚠️ Espera TODOS carregarem
    const foundLead = leads.find(l => l.id === id);  // Procura apenas 1
```

### 3. Múltiplas queries em cascata

Cada componente faz suas próprias queries:
- `useLeadsOptimized` → 6+ requisições para leads
- `useLeadStages` → 1 requisição para etapas
- `useUserRole` → 1 requisição para verificar role
- `useManagerTeam` → 1 requisição para equipe

---

## Solução Proposta

### Etapa 1: Busca direta no LeadDetails (resolução imediata)

Modificar `LeadDetails.tsx` para buscar o lead diretamente pelo ID, ao invés de esperar todos os leads carregarem:

```typescript
// ANTES: Espera 5604 leads carregarem
const { leads } = useLeadsOptimized();
const foundLead = leads.find(l => l.id === id);

// DEPOIS: Busca apenas 1 lead direto do banco
const { data: lead } = await supabase
  .from('leads')
  .select('*, user:users(name), lead_tag_relations(...)')
  .eq('id', id)
  .single();
```

**Impacto esperado:** Abertura de lead de ~3-5s para ~200ms

### Etapa 2: Paginação no Kanban (carregamento mais rápido)

Modificar `useLeadsOptimized` para carregar apenas os leads visíveis inicialmente (ex: primeiros 500) e implementar scroll infinito ou "Carregar mais".

**Impacto esperado:** Carregamento inicial de ~5s para ~1s

### Etapa 3: Cache com React Query (evitar recarregar)

Adicionar cache para que os leads não sejam recarregados toda vez que a página é acessada.

---

## Detalhes Técnicos

### Arquivos a modificar:

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/LeadDetails.tsx` | Buscar lead diretamente pelo ID ao invés de usar useLeadsOptimized |
| `src/hooks/useLeadsOptimized.ts` | (Opcional) Implementar paginação com limite inicial |

### Nova implementação do LeadDetails:

```typescript
// Novo hook específico para buscar 1 lead
const [lead, setLead] = useState<Lead | null>(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchLead = async () => {
    if (!id) return;
    
    const { data, error } = await supabase
      .from('leads')
      .select(`
        id, nome, telefone, dados_adicionais, etapa, stage_name,
        created_at, user_id, atividades, primeira_visualizacao,
        user:users(name, equipe_id),
        lead_tag_relations(lead_tags(id, nome, cor))
      `)
      .eq('id', id)
      .single();
    
    if (data) {
      setLead(convertToLeadFormat(data));
    }
    setLoading(false);
  };
  
  fetchLead();
}, [id]);
```

### Fluxo atual vs corrigido:

```text
ATUAL (lento):
Clica no lead
     ↓
Carrega LeadDetails
     ↓
Hook useLeadsOptimized inicia
     ↓
6 requisições (1000 leads cada)
     ↓
5604 leads carregados (~3-5s)
     ↓
find(l => l.id === id)
     ↓
Exibe 1 lead


CORRIGIDO (rápido):
Clica no lead
     ↓
Carrega LeadDetails
     ↓
Query direta: .eq('id', id).single()
     ↓
1 lead carregado (~200ms)
     ↓
Exibe 1 lead
```

---

## Resultado Esperado

- **Abertura de lead individual:** De ~3-5 segundos para ~200ms
- **Carregamento inicial da página:** Mantém comportamento atual (pode ser otimizado depois)
- **Experiência do usuário:** Muito mais fluida ao navegar entre leads

## Risco

- **Baixo:** A alteração é isolada na página de detalhes
- Funcionalidade de atualização otimística continua funcionando normalmente


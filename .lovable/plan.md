
# Plano: Corrigir nomes de etapas na versão mobile

## Problema Identificado

A página **MobileLeads.tsx** está usando nomes de etapas **fixos no código** (hardcoded), enquanto a versão desktop (KanbanBoard) busca os nomes diretamente do banco de dados usando o hook `useLeadStages()`.

Quando você alterou "Nome Limpo" para "Análise de Crédito" no banco de dados, apenas a versão desktop refletiu a mudança.

## Solução

Atualizar a página `MobileLeads.tsx` para usar o hook `useLeadStages()` existente, igual ao KanbanBoard.

## Alterações Necessárias

### 1. Arquivo: `src/pages/MobileLeads.tsx`

**Remover os objetos hardcoded:**
```typescript
// REMOVER estas constantes fixas (linhas 20-42):
const stageColors = { ... };
const stageLabels = { ... };
```

**Adicionar importação do hook:**
```typescript
import { useLeadStages } from "@/hooks/useLeadStages";
```

**Usar o hook dentro do componente:**
```typescript
const { stages, loading: stagesLoading } = useLeadStages();
```

**Atualizar o filtro de etapas para usar dados dinâmicos:**
- Substituir `Object.entries(stageLabels)` por `stages.map(stage => ...)`
- Usar `stage.nome` e `stage.cor` do banco de dados

**Atualizar o badge de etapa no card do lead:**
- Buscar a cor da etapa dinamicamente baseado no `stage_name` do lead

## Detalhes Técnicos

| Item | Antes | Depois |
|------|-------|--------|
| Fonte dos nomes | Constante `stageLabels` hardcoded | `stages` do hook `useLeadStages()` |
| Cores das etapas | Constante `stageColors` hardcoded | Campo `cor` de cada stage do banco |
| Filtro de etapa | `Object.entries(stageLabels)` | `stages.map()` |

## Benefícios

- Nomes de etapas sincronizados entre desktop e mobile
- Cores personalizadas também funcionarão no mobile
- Novas etapas criadas aparecerão automaticamente no mobile

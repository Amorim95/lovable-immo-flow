

## Correção: Filtros e Badges de Etapas no Mobile

### Problema
Os leads no mobile perdem o campo `stage_name` durante a conversão, causando:
- Badges mostrando nomes de etapas errados (usando chave legada)
- Filtro comparando valores incompatíveis

### Alterações em `src/pages/MobileLeads.tsx`

**1. Incluir `stage_name` na conversão (linha 150)**
Adicionar `stage_name: lead.stage_name || undefined` ao objeto convertido.

**2. Simplificar filtro de etapa (linhas 175-178)**
Remover o `leads.find()` desnecessário e comparar diretamente com `lead.stage_name`:
```
const matchesStage = !selectedStage || 
  lead.stage_name === selectedStage || 
  lead.etapa === selectedStage;
```

**3. Corrigir badges nos cards (linhas 540-545)**
Trocar `getStageColor(lead.etapa)` por `getStageColor(lead.stage_name || lead.etapa)` e `getStageName(lead.etapa)` por `getStageName(lead.stage_name || lead.etapa)`.

### Risco
Muito baixo. Todas as alterações usam fallback para `lead.etapa`, garantindo compatibilidade.

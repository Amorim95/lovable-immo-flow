

## Bug: Filtro de Etapas nao funciona no Mobile

### Causa do Problema

O filtro de etapas no mobile compara dois valores incompativeis:
- O dropdown define `selectedStage` com o **nome** da etapa (ex: "Aguardando Atendimento")
- O filtro compara com `lead.etapa`, que contem a **chave legada** (ex: "aguardando-atendimento")

Como "Aguardando Atendimento" nunca e igual a "aguardando-atendimento", o filtro sempre retorna zero leads.

Na versao desktop (Kanban), o sistema usa `stage_name` para comparar, que ja contem o nome correto.

### Correcao

**Arquivo:** `src/pages/MobileLeads.tsx`

Alterar a linha do filtro de etapa (linha 175) para comparar usando `stage_name` do lead original em vez de `lead.etapa`:

```
// De:
const matchesStage = !selectedStage || lead.etapa === selectedStage;

// Para:
const originalLead = leads.find(l => l.id === lead.id);
const matchesStage = !selectedStage || 
  originalLead?.stage_name === selectedStage || 
  lead.etapa === selectedStage;
```

Isso verifica primeiro o `stage_name` (nome completo da etapa) e como fallback o `etapa` (chave legada), garantindo compatibilidade em ambos os casos.


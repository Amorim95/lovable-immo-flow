
# Plano: Corrigir Drag-and-Drop no Kanban + Resolver Build Errors

## Fase 1: Corrigir Erros de Build (Bloqueador)

### Arquivo: `src/hooks/usePushNotifications.ts`

**Problema**: TypeScript não reconhece `pushManager` em `ServiceWorkerRegistration`

**Solução**: Adicionar tipagem `any` para `registration` onde `pushManager` é utilizado:
- Linha 25: `navigator.serviceWorker.ready.then(async (registration: any) => {`
- Linha 138: `const registration = await navigator.serviceWorker.ready as any;`
- Linha 276: `navigator.serviceWorker.ready.then((registration: any) => {`

**Risco**: Nenhum - apenas adiciona tipagem explícita sem mudar lógica.

---

## Fase 2: Implementar Kanban com Posicionamento Exato

### 2.1 Adicionar coluna `stage_order` na tabela `leads`

**Objetivo**: Persistir a posição do lead dentro de cada coluna

**Ação**: Criar uma migration que:
- Adiciona coluna `stage_order` (BIGINT, DEFAULT 0)
- Popula valores iniciais baseado em `created_at` para cada stage_name

### 2.2 Refatorar `src/components/KanbanBoard.tsx`

**Mudanças principais**:

1. **Importar do react-beautiful-dnd**:
   ```typescript
   import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
   ```

2. **Substituir drag-and-drop nativo** pelos componentes Radix:
   - Remover `handleDragStart`, `handleDragOver`, `handleDrop`
   - Implementar `onDragEnd` callback que:
     - Detecta mudança de column (stage_name) e/ou position
     - Calcula novo `stage_order` baseado na posição final entre leads
     - Chama `onLeadUpdate` com ambos `stage_name` e `stage_order`

3. **Ordenar leads corretamente**:
   - No `getLeadsByStage`, ordenar por `stage_order` (não por criação)
   - Fallback: leads sem `stage_order` ficam ao final

4. **Implementar lógica de recálculo de posições**:
   - Quando um lead é dropado, calcular `stage_order` como:
     - Média entre leads vizinhos (ex: entre ordem 10 e 20 → nova ordem 15)
     - Se sem vizinhos, usar incrementos de 1000 para futuras inserções

### 2.3 Atualizar Hook de Leads (se necessário)

**Verificar**: `useLeadsOptimized.ts` ou equivalente
- Garantir que retorna leads com campo `stage_order` do banco
- Manter ordenação pelo novo campo

---

## Fluxo Visual Resultante

```text
┌─────────────────────────────────────────────────────┐
│  Usuário arrasta Lead B entre A e C                 │
├─────────────────────────────────────────────────────┤
│  Antes:                                             │
│  Coluna 1: [A(order:10), B(order:20), C(order:30)] │
│                                                     │
│  Depois (arrasta B para entre A e C):               │
│  Coluna 1: [A(order:10), B(order:15), C(order:30)] │
│  ✓ B fica exatamente onde foi solto                │
│  ✓ `stage_order` atualizado no banco               │
└─────────────────────────────────────────────────────┘
```

---

## Impacto para o Usuário

✅ Ao arrastar um lead, ele ficará **exatamente onde foi solto**
✅ A ordem será **persistida no banco** e mantida ao recarregar
✅ Funciona para **reordenar na mesma coluna** e **mover entre colunas**
✅ **Sem impacto** em funcionalidades existentes (assinalação, filtros, etc)

---

## Sequência de Implementação

1. Corrigir TypeScript errors em `usePushNotifications.ts` (rápido)
2. Criar migration para adicionar `stage_order` à tabela `leads`
3. Refatorar `KanbanBoard.tsx` com react-beautiful-dnd
4. Testar drag-and-drop no navegador em diferentes cenários
5. Verificar que logs e performance continuam normais


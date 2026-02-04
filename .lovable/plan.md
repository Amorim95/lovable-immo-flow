
# Plano: Adicionar pré-filtro de equipe para responsáveis na Gestão de Usuários Mobile

## Objetivo

Quando o usuário logado é responsável por uma equipe, o filtro de equipe deve ser pré-selecionado automaticamente com sua equipe, assim como já acontece no Kanban.

## Como Funciona Atualmente no Kanban

```text
Index.tsx
    │
    ├── useManagerTeam() ─────► Retorna { managedTeamId, loading }
    │
    └── useEffect() ─────────► Se managedTeamId existe, seta selectedTeamId
```

## Alterações no Arquivo: `src/pages/MobileCorretores.tsx`

### 1. Importar o hook useManagerTeam (linha 14)

```typescript
import { useManagerTeam } from "@/hooks/useManagerTeam";
```

### 2. Usar o hook no componente (após linha 41)

```typescript
const { managedTeamId, loading: teamLoading } = useManagerTeam();
```

### 3. Adicionar useEffect para pré-selecionar equipe (após linha 43)

```typescript
import { useState, useEffect } from "react";

// Dentro do componente:
useEffect(() => {
  if (!teamLoading && managedTeamId && !selectedEquipeId) {
    setSelectedEquipeId(managedTeamId);
  }
}, [teamLoading, managedTeamId, selectedEquipeId]);
```

## Fluxo de Funcionamento

```text
Usuário abre Gestão de Usuários
           │
           ▼
   useManagerTeam() executa
           │
           ▼
  Busca equipe onde user.id = responsavel_id
           │
           ├── Se encontrou equipe ──► managedTeamId = equipe.id
           │                                    │
           │                                    ▼
           │                          useEffect detecta
           │                                    │
           │                                    ▼
           │                     setSelectedEquipeId(managedTeamId)
           │                                    │
           │                                    ▼
           │                     Filtro mostra apenas usuários dessa equipe
           │
           └── Se não encontrou ──► Mantém "Todas as equipes"
```

## Comportamento Esperado

| Tipo de Usuário | Pré-filtro |
|-----------------|------------|
| Responsável por equipe | Equipe pré-selecionada |
| Admin sem equipe | "Todas as equipes" |
| Gestor sem equipe própria | "Todas as equipes" |

## Detalhes Técnicos

- A condição `!selectedEquipeId` evita sobrescrever se o usuário já mudou o filtro manualmente
- O `teamLoading` garante que a pré-seleção só acontece após carregar os dados
- Reutiliza o mesmo hook já usado no Kanban, mantendo consistência

## Risco

Nenhum - reutilizamos um hook existente e aplicamos o mesmo padrão já usado no Kanban.

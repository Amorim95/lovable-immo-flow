
# Plano: Remover Card "Aguardando Confirmação"

## Objetivo

Remover o card de estatísticas "Aguardando Confirmação" da página de Gestão de Usuários, conforme solicitado.

## Alteração

Remover o segundo card do grid de estatísticas que mostra a contagem de usuários com status "pendente".

## Arquivo a modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/Corretores.tsx` | Remover o card "Aguardando Confirmação" (linhas 211-226) |

## Antes (4 cards)

```text
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ Usuários Ativos │ │   Aguardando    │ │    Usuários     │ │     Total de    │
│                 │ │   Confirmação   │ │    Inativos     │ │    Usuários     │
└─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘
```

## Depois (3 cards)

```text
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ Usuários Ativos │ │    Usuários     │ │     Total de    │
│                 │ │    Inativos     │ │    Usuários     │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

## Ajuste de Layout

O grid atual usa `grid-cols-1 md:grid-cols-4`. Com 3 cards, será alterado para `grid-cols-1 md:grid-cols-3` para manter o alinhamento correto.

## Risco

- **Nenhum**: Alteração puramente visual que remove um elemento da interface

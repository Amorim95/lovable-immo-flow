

# Plano: Mover Frase Motivacional para Após o Botão

## Objetivo

Reposicionar o texto motivacional diário para aparecer logo depois do botão "Novo Lead", em vez de no topo da página como título.

## Layout Atual

```text
┌────────────────────────────────────────────────────┐
│ "Meta não é pressão, é direção."  ← H1 no topo     │
├────────────────────────────────────────────────────┤
│ [+ Novo Lead]                                      │
├────────────────────────────────────────────────────┤
│ Filtros...                                         │
└────────────────────────────────────────────────────┘
```

## Layout Depois

```text
┌────────────────────────────────────────────────────┐
│ [+ Novo Lead]    "Meta não é pressão, é direção."  │
├────────────────────────────────────────────────────┤
│ Filtros...                                         │
└────────────────────────────────────────────────────┘
```

## Alteração

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/Index.tsx` | Mover o texto motivacional para dentro da linha do botão "Novo Lead" |

## Código Antes (linhas 228-247)

```jsx
<div className="flex flex-col gap-4">
  <div>
    <h1 className="text-3xl font-bold text-gray-900">  "Meta não é pressão, é direção."</h1>
  </div>
  
  <div className="flex items-center gap-3">
    {canCreateLeads && <Button>...</Button>}
    ...
  </div>
</div>
```

## Código Depois

```jsx
<div className="flex items-center gap-4">
  {canCreateLeads && <Button>...</Button>}
  
  <span className="text-lg font-medium text-gray-600 italic">
    "{dailyQuote}"
  </span>
</div>
```

## Detalhes

- Remover o `<div>` com o `<h1>` do topo
- Adicionar a frase como um `<span>` ao lado do botão "Novo Lead"
- Estilizar com fonte menor e itálico para parecer uma citação sutil
- Manter o uso do hook `useDailyQuote` para a frase rotativa

## Risco

- **Nenhum**: Alteração puramente visual de posicionamento


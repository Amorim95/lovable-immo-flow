

# Plano: Adicionar campo de busca ao lado do filtro de data

## O Que Será Feito

Adicionar o campo de busca de leads **ao lado do DateFilter** (Período Total), como primeiro elemento junto ao filtro de data.

## Alteração no Arquivo: `src/pages/Index.tsx`

### 1. Adicionar import do ícone Search (linha 22)

```typescript
import { LayoutList, LayoutGrid, Plus, Search } from "lucide-react";
```

### 2. Adicionar campo de busca após DateFilter (linha 263)

```tsx
<div className="flex items-center gap-4">
  <DateFilter 
    value={dateFilter} 
    customRange={customDateRange} 
    onValueChange={handleDateFilterChange} 
    availableDates={availableDates} 
  />
  
  {/* NOVO: Campo de busca ao lado do período */}
  <div className="relative">
    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
    <Input
      type="text"
      placeholder="Buscar leads..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="pl-9 w-64"
    />
  </div>
  
  {/* Filtros de Equipe e Usuário... */}
```

## Resultado Visual

```
[Período Total ▼] [🔍 Buscar leads...] [Equipe ▼] [Usuário ▼] [Etiquetas ▼]
```

- Campo de busca aparece logo após o seletor de período
- Ícone de lupa dentro do campo
- Placeholder "Buscar leads..."
- Busca filtra por nome, dados adicionais e corretor

## Risco

Nenhum - reutilizamos o estado `searchTerm` e a lógica de filtragem que já existem no código.


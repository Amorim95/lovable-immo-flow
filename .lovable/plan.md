
# Plano: Adicionar frases motivacionais no header mobile

## O Que Será Feito

Substituir o título estático "Gestão de Leads" na versão mobile pelas **frases motivacionais rotativas** que já existem na versão desktop.

## Alterações Necessárias

### Arquivo: `src/pages/MobileLeads.tsx`

1. **Importar o hook existente:**
```typescript
import { useDailyQuote } from "@/hooks/useDailyQuote";
```

2. **Usar o hook dentro do componente:**
```typescript
const quote = useDailyQuote();
```

3. **Passar a frase para o MobileHeader:**
```typescript
<MobileHeader title={quote} />
```

### Arquivo: `src/components/MobileHeader.tsx`

Ajustar o estilo do título para acomodar textos mais longos:

**Antes:**
```typescript
<h1 className="text-lg font-semibold text-gray-900 truncate text-center flex-1">
```

**Depois:**
```typescript
<h1 className="text-xs font-medium text-gray-600 italic leading-tight line-clamp-2 max-w-[200px]">
```

| Propriedade | Função |
|-------------|--------|
| `text-xs` | Fonte menor para caber frases longas |
| `font-medium` | Peso médio, não tão pesado |
| `text-gray-600` | Cor sutil, não tão forte |
| `italic` | Estilo itálico para diferenciar de títulos |
| `leading-tight` | Altura de linha compacta |
| `line-clamp-2` | Limita a 2 linhas, trunca o resto |
| `max-w-[200px]` | Largura máxima para não ocupar todo espaço |

## Resultado Visual

- A frase motivacional do dia aparecerá no header mobile
- Fonte pequena e em itálico para caber no espaço disponível
- Frases muito longas serão truncadas em 2 linhas
- A frase muda automaticamente às 07:35 AM (mesmo comportamento do desktop)

## Risco

Nenhum risco - estamos reutilizando o hook `useDailyQuote` que já funciona no desktop. Apenas adaptando o visual para o espaço menor do mobile.

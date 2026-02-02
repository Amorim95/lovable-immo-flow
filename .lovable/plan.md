

# Plano: Frases Motivacionais Rotativas Diárias

## Objetivo

Implementar um sistema que exibe uma frase motivacional diferente a cada dia, mudando às 7:35 da manhã. Quando chegar na última frase da lista, volta para a primeira.

## Lista de Frases (47 frases)

Todas as frases fornecidas serão armazenadas em ordem e rotacionarão diariamente.

## Lógica de Rotação

```text
Dia 1 (7:35) → "Quem age antes, fecha antes."
Dia 2 (7:35) → "Meta não é pressão, é direção."
...
Dia 47 (7:35) → "Quem não desiste, fecha."
Dia 48 (7:35) → "Quem age antes, fecha antes." (volta ao início)
```

## Implementação

### Arquivos a criar/modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/constants/motivationalQuotes.ts` | Criar arquivo com a lista de 47 frases |
| `src/hooks/useDailyQuote.ts` | Criar hook que calcula qual frase mostrar baseado na data atual |
| `src/pages/Index.tsx` | Usar o hook para exibir a frase do dia |

### Lógica do cálculo

```typescript
// Calcula quantos "dias" se passaram desde uma data de referência
// considerando que o dia muda às 7:35

function getDailyQuote(quotes: string[]): string {
  const now = new Date();
  const referenceDate = new Date('2025-02-02T07:35:00'); // Data de início
  
  // Ajusta para considerar que o dia muda às 7:35
  const adjustedNow = new Date(now);
  if (now.getHours() < 7 || (now.getHours() === 7 && now.getMinutes() < 35)) {
    adjustedNow.setDate(adjustedNow.getDate() - 1); // Ainda é o dia anterior
  }
  
  // Calcula dias desde a referência
  const diffTime = adjustedNow.getTime() - referenceDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  // Índice circular (volta ao início após a última frase)
  const index = ((diffDays % quotes.length) + quotes.length) % quotes.length;
  
  return quotes[index];
}
```

### Estrutura do hook

```typescript
// useDailyQuote.ts
export const useDailyQuote = () => {
  const [quote, setQuote] = useState(getDailyQuote(QUOTES));
  
  // Atualiza a frase se o usuário ficar na página durante a mudança às 7:35
  useEffect(() => {
    const checkForUpdate = () => {
      const newQuote = getDailyQuote(QUOTES);
      if (newQuote !== quote) {
        setQuote(newQuote);
      }
    };
    
    const interval = setInterval(checkForUpdate, 60000); // Verifica a cada minuto
    return () => clearInterval(interval);
  }, [quote]);
  
  return quote;
};
```

### Uso no Index.tsx

```typescript
// Antes
<h1 className="text-3xl font-bold text-gray-900">
  "Meta não é pressão, é direção."
</h1>

// Depois
const dailyQuote = useDailyQuote();

<h1 className="text-3xl font-bold text-gray-900">
  "{dailyQuote}"
</h1>
```

## Comportamento

- **Às 7:35 de cada dia**: A frase muda automaticamente
- **Antes das 7:35**: Mostra a frase do dia anterior
- **Após as 7:35**: Mostra a frase do dia atual
- **Ciclo**: Após a 47ª frase, volta para a 1ª

## Risco

- **Nenhum**: Alteração isolada que não afeta outras funcionalidades
- O cálculo é feito no frontend, então todos os usuários verão a mesma frase no mesmo dia


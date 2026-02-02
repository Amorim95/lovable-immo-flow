
# Plano: Adicionar Novas Frases Motivacionais

## Objetivo

Adicionar 17 novas frases motivacionais de autores renomados à lista rotativa existente.

## Novas Frases a Adicionar

| # | Frase | Autor |
|---|-------|-------|
| 1 | "A melhor maneira de prever o futuro é criá-lo." | Peter Drucker |
| 2 | "Disciplina é a ponte entre metas e realizações." | Jim Rohn |
| 3 | "Onde o foco vai, a energia flui." | Tony Robbins |
| 4 | "Sucesso é sua obrigação, não uma opção." | Grant Cardone |
| 5 | "Pessoas de sucesso fazem o que as pessoas comuns não querem fazer." | Brian Tracy |
| 6 | "Posso aceitar o fracasso, mas não posso aceitar não tentar." | Michael Jordan |
| 7 | "Descanso no final, não no meio." | Kobe Bryant |
| 8 | "Disciplina é liberdade." | Jocko Willink |
| 9 | "Sonhar grande e sonhar pequeno dá o mesmo trabalho." | Jorge Paulo Lemann |
| 10 | "Não existe sucesso sem desconforto." | Flávio Augusto |
| 11 | "Quem resolve problema cresce." | Luiza Helena Trajano |
| 12 | "Eu acredito na sorte, mas acredito muito mais no trabalho." | Silvio Santos |
| 13 | "Ideia boa sem execução não vale nada." | Murilo Gun |
| 14 | "Quem não controla o processo não controla o resultado." | Thiago Nigro |
| 15 | "Quem se adapta mais rápido, vence." | Ricardo Amorim |
| 16 | "Disciplina é fazer o que precisa ser feito, mesmo sem vontade." | Carlos Wizard |
| 17 | "O jogo é simples: quem executa, ganha." | Erico Rocha |

## Implementação

| Arquivo | Alteração |
|---------|-----------|
| `src/constants/motivationalQuotes.ts` | Adicionar as 17 novas frases ao final do array |

## Resultado

- **Antes**: 46 frases
- **Depois**: 63 frases (46 + 17)
- **Ciclo completo**: 63 dias até repetir

## Formato das Frases

As frases serão adicionadas incluindo o nome do autor para dar crédito:
```
"A melhor maneira de prever o futuro é criá-lo." - Peter Drucker
```

## Risco

- **Nenhum**: Apenas adição de novos itens ao array existente
- A lógica de rotação já suporta qualquer quantidade de frases automaticamente

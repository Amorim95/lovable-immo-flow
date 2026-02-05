

# Transformar Modal de "Novo Lead" em Banner no Topo (Mobile)

## Objetivo
Melhorar a experiencia de digitacao na versao mobile ao criar um novo lead, substituindo o modal central por um painel fixo no topo da tela.

## Problema Atual
O modal de "Novo Lead" aparece centralizado na tela, o que em dispositivos moveis faz com que o teclado virtual cubra parte do formulario, dificultando a visualizacao dos campos enquanto o usuario digita.

## Solucao Proposta
Utilizar o componente `Sheet` com `side="top"` para exibir o formulario de novo lead como um painel que desliza do topo da tela. Isso permite que o formulario fique visivel acima do teclado virtual.

## Arquivos a Modificar

### 1. `src/pages/MobileLeads.tsx`
- Substituir o `NewLeadModal` por uma implementacao inline usando o componente `Sheet` com `side="top"`
- Manter toda a logica de criacao de lead existente
- O painel tera:
  - Header com titulo "+ Novo Lead" e botao de fechar (X)
  - Campos: Nome, Telefone, Dados Adicionais
  - Botoes: Cancelar e Criar Lead
  - Animacao de slide-in do topo

## Detalhes Tecnicos

### Estrutura do Componente Sheet (Banner do Topo)
```text
+------------------------------------------+
|  + Novo Lead                         [X] |
|------------------------------------------|
|  Nome *                                  |
|  [________________________]              |
|                                          |
|  Telefone *                              |
|  [________________________]              |
|                                          |
|  Dados Adicionais                        |
|  [________________________]              |
|                                          |
|     [Cancelar]  [Criar Lead]             |
+------------------------------------------+
```

### Beneficios
- O formulario fica no topo, acima do teclado virtual
- O usuario consegue ver todos os campos enquanto digita
- Animacao suave de entrada/saida do topo
- Consistente com outros padroes de UX mobile

### Implementacao
- Usar `Sheet` do `@radix-ui/react-dialog` com `side="top"`
- Manter a mesma logica de submit do `NewLeadModal` atual
- Incluir validacao de campos obrigatorios
- Usar o hook `useAuth` para obter o usuario logado


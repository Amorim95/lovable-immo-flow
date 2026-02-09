

## Correcao do Modal "Editar Usuario"

### Problema
1. Ao abrir o modal de edicao, os campos nao vem preenchidos com os dados atuais do usuario
2. A lista de equipes aparece vazia no select de equipe

### Causa Raiz
- A prop `equipes` nao esta sendo passada ao componente `EditUsuarioModal` em `Corretores.tsx`
- O campo `equipeNome` dos corretores esta sendo mapeado como `undefined`, impedindo a pre-selecao correta

### Correcoes

**Arquivo: `src/pages/Corretores.tsx`**
1. Corrigir o mapeamento de `equipeNome` na lista de corretores para buscar o nome correto da equipe
2. Passar a prop `equipes` ao componente `EditUsuarioModal`

**Arquivo: `src/pages/MobileCorretores.tsx`**
3. Verificar e garantir que a prop `equipes` esta sendo passada ao `MobileEditUsuarioModal`

### Nivel de Risco
Baixo. Sao apenas correcoes de passagem de props e mapeamento de dados. Nenhuma alteracao em logica de negocio, banco de dados ou autenticacao.


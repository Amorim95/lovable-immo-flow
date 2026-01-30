
# Plano: Corrigir Reload Automático ao Retornar para a Aba

## Problema Identificado

A aplicação recarrega automaticamente quando o usuário sai da aba (deixa em segundo plano) e retorna. Isso acontece por três razões:

1. **Service Worker força reload**: O listener `controllerchange` em `PWALifecycle.tsx` executa `window.location.reload()` quando o Service Worker é atualizado
2. **AuthContext limpa cache na inicialização**: Toda vez que o componente monta, ele apaga o `localStorage` e `sessionStorage`
3. **Estados não persistidos**: Filtros e preferências do usuário são armazenados apenas em memória (useState)

## Solução Proposta

### Etapa 1: Remover reload automático do Service Worker

Modificar `src/components/PWALifecycle.tsx` para não forçar reload automático, apenas notificar o usuário sobre atualizações disponíveis.

**Antes:**
```typescript
navigator.serviceWorker.addEventListener('controllerchange', () => {
  window.location.reload();
});
```

**Depois:**
```typescript
navigator.serviceWorker.addEventListener('controllerchange', () => {
  console.log('Service Worker atualizado - nova versão disponível');
  // Não forçar reload automático
});
```

### Etapa 2: Manter cache do usuário entre inicializações

Modificar `src/contexts/AuthContext.tsx` para usar o cache local enquanto valida a sessão em background.

**Antes:**
```typescript
useEffect(() => {
  localStorage.removeItem('crm_user');
  sessionStorage.clear();
  // ...
}, []);
```

**Depois:**
```typescript
useEffect(() => {
  // Tentar restaurar usuário do cache local PRIMEIRO
  const cachedUser = localStorage.getItem('crm_user');
  if (cachedUser) {
    try {
      setUser(JSON.parse(cachedUser));
    } catch (e) {
      localStorage.removeItem('crm_user');
    }
  }
  
  // Depois validar sessão em background
  // ...
}, []);
```

### Etapa 3 (Opcional): Persistir preferências do usuário

Criar um hook `usePersistedState` para salvar filtros e modo de visualização no localStorage.

Modificar `src/pages/Index.tsx` para usar estados persistidos:
- `viewMode` - persistir escolha kanban/lista
- `dateFilter` - persistir filtro de data selecionado
- `selectedTeamId` - persistir equipe selecionada

---

## Detalhes Técnicos

### Arquivos a modificar:

| Arquivo | Alteração |
|---------|-----------|
| `src/components/PWALifecycle.tsx` | Remover `window.location.reload()` do listener `controllerchange` |
| `src/contexts/AuthContext.tsx` | Usar cache local primeiro, depois validar em background |
| `src/pages/Index.tsx` | (Opcional) Persistir estados de filtros no localStorage |

### Fluxo após a correção:

```text
Usuário sai da aba
        |
        v
Retorna para a aba
        |
        v
Service Worker não força reload
        |
        v
AuthContext usa cache local
        |
        v
Estados mantidos em memória
        |
        v
Usuário continua de onde parou
```

---

## Resultado Esperado

- Ao sair e retornar à aba, a página mantém o estado atual
- Não há mais reload automático ao retornar
- A experiência do usuário é suave e contínua
- Atualizações do PWA são notificadas mas não forçam reload

## Risco

- **Baixo**: As alterações são pontuais e não afetam a lógica de autenticação
- A sessão continua sendo validada em background para segurança

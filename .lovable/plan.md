

# Plano: Botão rápido para mudar status do usuário no cartão mobile

## O Que Será Feito

Adicionar um botão/toggle clicável diretamente no badge de status de cada usuário, permitindo mudar entre "ativo" e "inativo" com um único toque, sem precisar abrir o modal de edição.

## Solução Proposta

Transformar o Badge de status em um botão clicável que alterna o status ao ser tocado.

## Alterações no Arquivo: `src/pages/MobileCorretores.tsx`

### 1. Criar função para atualizar status diretamente

```typescript
const handleToggleStatus = async (e: React.MouseEvent, corretor: Corretor) => {
  e.stopPropagation(); // Impede abrir o modal
  
  const newStatus = corretor.status === 'ativo' ? 'inativo' : 'ativo';
  
  try {
    const { error } = await supabase
      .from('users')
      .update({ status: newStatus })
      .eq('id', corretor.id);

    if (error) throw error;

    toast.success(`Status alterado para ${newStatus}`);
    refetchUsers();
  } catch (error) {
    toast.error('Erro ao alterar status');
  }
};
```

### 2. Modificar o Badge de status para ser clicável

**Antes (linha 274-287):**
```tsx
<Badge 
  variant={...}
  className={...}
>
  {corretor.status === 'pendente' ? 'Aguardando' : corretor.status}
</Badge>
```

**Depois:**
```tsx
<Badge 
  variant={...}
  className={`cursor-pointer hover:opacity-80 active:scale-95 transition-all ${...}`}
  onClick={(e) => handleToggleStatus(e, corretor)}
>
  {corretor.status === 'pendente' ? 'Aguardando' : corretor.status}
</Badge>
```

## Comportamento Visual

| Estado | Ação ao Clicar | Feedback |
|--------|----------------|----------|
| ativo (verde) | Muda para inativo | Badge fica vermelho + toast |
| inativo (vermelho) | Muda para ativo | Badge fica verde + toast |
| pendente (amarelo) | Muda para ativo | Badge fica verde + toast |

## Indicadores de Interatividade

- `cursor-pointer` - Mostra que é clicável
- `hover:opacity-80` - Feedback visual no hover
- `active:scale-95` - Animação de "press" ao tocar
- `e.stopPropagation()` - Impede que o clique abra o modal

## Detalhes Técnicos

O `e.stopPropagation()` é essencial para:
- Impedir que o clique no badge também acione o `onClick` do cartão pai
- Permitir ação independente no badge sem abrir o modal de edição

## Resultado Esperado

O usuário poderá tocar diretamente no badge de status (ativo/inativo) e o status será alterado instantaneamente, com feedback visual e toast de confirmação.


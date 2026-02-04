
# Plano: Remover opção "Aparência" do menu mobile

## Alteração Necessária

### Arquivo: `src/pages/MobileConfiguracoes.tsx`

Remover o item de menu "Aparência" do array `menuItems`:

```typescript
// REMOVER estas linhas (37-44):
{
  id: 'appearance',
  title: 'Aparência',
  description: 'Modo noturno e personalização visual',
  icon: Palette,
  action: () => navigate('/mobile-appearance'),
  show: true
},
```

Também remover a importação não utilizada do ícone `Palette` da linha 12.

## Resultado

O menu de configurações mobile mostrará apenas:
- Informações Pessoais
- Dados da Empresa (para admin/gestor)
- Gestão de Usuários (para admin/gestor)
- Botão Sair

## Risco

Nenhum risco - é apenas uma remoção de item de menu. A página de aparência continuará existindo, apenas não será acessível pelo menu mobile.

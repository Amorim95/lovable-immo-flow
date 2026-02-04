

# Plano: Centralizar frase motivacional no header mobile

## Problema Atual

A estrutura atual do header tem:
- Logo à esquerda + frase junto ao logo
- Elementos à direita

Isso faz a frase ficar alinhada à esquerda, não centralizada.

## Solução

Reestruturar o layout do header para usar 3 colunas:
1. **Esquerda**: Logo da empresa
2. **Centro**: Frase motivacional (centralizada)
3. **Direita**: Elementos opcionais (rightElement)

## Alteração no Arquivo: `src/components/MobileHeader.tsx`

**Estrutura Atual:**
```tsx
<header className="flex items-center justify-between">
  <div className="flex items-center gap-3">
    {logo}
    {title}  // Frase fica junto ao logo, não centralizada
  </div>
  {rightElement}
</header>
```

**Nova Estrutura:**
```tsx
<header className="flex items-center justify-between">
  {/* Coluna esquerda - Logo */}
  <div className="flex items-center min-w-[40px]">
    {logo}
  </div>
  
  {/* Coluna central - Frase centralizada */}
  {title && (
    <div className="flex-1 flex justify-center">
      <h1 className="text-xs font-medium text-muted-foreground italic leading-tight line-clamp-2 max-w-[200px] text-center">
        {title}
      </h1>
    </div>
  )}
  
  {/* Coluna direita - Elementos opcionais */}
  <div className="flex items-center min-w-[40px] justify-end">
    {rightElement}
  </div>
</header>
```

## Resultado Visual

- Logo permanece à esquerda
- Frase motivacional fica **perfeitamente centralizada** na barra
- Elementos à direita (quando existem) ficam à direita
- As colunas laterais têm `min-w-[40px]` para garantir simetria

## Risco

Nenhum - apenas reorganização do layout interno do componente.




## Plano: Substituir Badge de Status por Switch Interativo

### Situação Atual
Atualmente, o status do usuário é exibido como um **Badge** (etiqueta) com cores diferentes:
- Verde para "ativo"
- Vermelho para "inativo"  
- Amarelo para "pendente"

Embora seja clicável, não transmite visualmente a sensação de "interruptor".

### Solução Proposta
Substituir o Badge por um componente **Switch** (interruptor) estilizado, que:
- Mostra visualmente o estado ligado/desligado
- Tem animação suave de transição
- Inclui um label textual ao lado ("Ativo" / "Inativo")
- Usa cores intuitivas (verde quando ativo, cinza quando inativo)

### Implementação Técnica

**Arquivo a modificar:** `src/pages/MobileCorretores.tsx`

**Mudanças:**

1. **Importar o componente Switch:**
   ```typescript
   import { Switch } from "@/components/ui/switch";
   ```

2. **Substituir o Badge pelo Switch** (linhas 261-275):

   De:
   ```tsx
   <Badge 
     variant={...}
     className={`cursor-pointer hover:opacity-80 active:scale-95 transition-all px-4 py-1.5 text-sm ${...}`}
     onClick={(e) => handleToggleStatus(e, corretor)}
   >
     {corretor.status === 'pendente' ? 'Aguardando' : corretor.status}
   </Badge>
   ```

   Para:
   ```tsx
   <div className="flex items-center gap-2">
     <Switch
       checked={corretor.status === 'ativo'}
       onCheckedChange={() => handleToggleStatus(corretor)}
       disabled={corretor.status === 'pendente'}
       className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-gray-300"
     />
     <span className={`text-xs font-medium ${
       corretor.status === 'ativo' ? 'text-green-600' : 
       corretor.status === 'pendente' ? 'text-yellow-600' : 
       'text-gray-500'
     }`}>
       {corretor.status === 'pendente' ? 'Aguardando' : 
        corretor.status === 'ativo' ? 'Ativo' : 'Inativo'}
     </span>
   </div>
   ```

3. **Simplificar a função handleToggleStatus** para não precisar do evento:
   ```typescript
   const handleToggleStatus = async (corretor: Corretor) => {
     const newStatus = corretor.status === 'ativo' ? 'inativo' : 'ativo';
     // ... resto da lógica
   };
   ```

### Resultado Visual
- **Switch ligado (verde):** Usuário ativo, com label "Ativo" em verde
- **Switch desligado (cinza):** Usuário inativo, com label "Inativo" em cinza
- **Switch desabilitado:** Usuário pendente, com label "Aguardando" em amarelo
- **Animação:** Transição suave do thumb do switch entre posições

### Comportamento
- O Switch já possui animação nativa de transição (200ms)
- Ao tocar, o switch desliza suavemente para a nova posição
- Feedback visual imediato antes mesmo da confirmação do servidor
- Toast de confirmação após salvar no banco


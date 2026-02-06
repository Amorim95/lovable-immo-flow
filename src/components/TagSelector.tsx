
import { useState } from "react";
import { LeadTag } from "@/types/crm";
import { useAvailableTags } from "@/hooks/useAvailableTags";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Tag } from "lucide-react";

interface TagSelectorProps {
  selectedTags: LeadTag[];
  onTagsChange: (tags: LeadTag[]) => void;
  variant?: 'default' | 'compact';
}

// Mapeamento de cores padrão para compatibilidade
const getTagColor = (nome: string, dbColor?: string) => {
  if (dbColor) {
    // Se é um gradiente, retornar configuração especial
    if (dbColor.startsWith('linear-gradient')) {
      return {
        background: dbColor,
        color: '#FFFFFF',
        textShadow: '0 1px 2px rgba(0,0,0,0.7)',
        fontWeight: '600',
        border: 'none'
      };
    }
    // Cor sólida do banco
    return {
      backgroundColor: dbColor,
      color: '#FFFFFF',
      border: 'none'
    };
  }
  
  // Fallback para tags customizadas
  return { className: 'bg-muted text-foreground border-border' };
};

export function TagSelector({ selectedTags, onTagsChange, variant = 'default' }: TagSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { tags: availableTags, loading } = useAvailableTags();

  const handleTagToggle = (tag: LeadTag) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    
    onTagsChange(newTags);
  };

  const isCompact = variant === 'compact';

  const getTagDisplayName = (tagName: string) => {
    const displayNames: Record<string, string> = {
      'Lead Qualificado Pela IA': 'Lead Qualificado Pela IA',
      'Não Qualificado': 'Não Qualificado'
    };
    return displayNames[tagName] || tagName;
  };

  return (
    <div className="space-y-2">
      {/* Etiquetas selecionadas */}
      <div className="flex flex-wrap gap-1 min-h-[32px] p-2 border rounded-md bg-muted">
        {selectedTags.length > 0 ? (
          selectedTags.map((tag) => {
            // Find the tag in available tags to get its database color
            const availableTag = availableTags.find(t => t.nome === tag);
            const colorStyle = getTagColor(tag, availableTag?.cor);
            
            return (
              <Badge
                key={tag}
                variant="secondary"
                className={`text-xs cursor-pointer hover:opacity-80 ${colorStyle.className || ''}`}
                style={colorStyle.className ? undefined : colorStyle}
                onClick={() => handleTagToggle(tag)}
              >
                {getTagDisplayName(tag)}
                <span className="ml-1 text-xs">✕</span>
              </Badge>
            );
          })
        ) : (
          <span className="text-muted-foreground text-sm">Nenhuma etiqueta selecionada</span>
        )}
      </div>

      {/* Botão para editar etiquetas */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size={isCompact ? "sm" : "default"}
            className={isCompact ? "h-7 px-2 text-xs" : "w-full"}
            disabled={loading}
          >
            <Tag className={`${isCompact ? "w-3 h-3" : "w-4 h-4"} mr-1`} />
            {isCompact ? "Tags" : "Adicionar/Remover Etiquetas"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-4 bg-popover border shadow-lg z-50" align="start">
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Selecionar Etiquetas</h4>
            <div className="space-y-2">
              {loading ? (
                <div className="text-sm text-muted-foreground">Carregando tags...</div>
              ) : (
                availableTags.map((tag) => (
                  <div key={tag.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={tag.nome}
                      checked={selectedTags.includes(tag.nome as LeadTag)}
                      onCheckedChange={() => handleTagToggle(tag.nome as LeadTag)}
                    />
                    <label
                      htmlFor={tag.nome}
                      className="text-sm font-medium leading-none cursor-pointer flex-1"
                      onClick={() => handleTagToggle(tag.nome as LeadTag)}
                    >
                      <Badge
                        variant="secondary"
                        className={`text-xs ${getTagColor(tag.nome, tag.cor).className || ''}`}
                        style={getTagColor(tag.nome, tag.cor).className ? undefined : getTagColor(tag.nome, tag.cor)}
                      >
                        {getTagDisplayName(tag.nome)}
                      </Badge>
                    </label>
                  </div>
                ))
              )}
            </div>
            <div className="pt-2 border-t">
              <Button
                size="sm"
                onClick={() => setIsOpen(false)}
                className="w-full"
              >
                Fechar
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

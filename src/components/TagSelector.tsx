
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
    // Se temos cor do banco, usar ela (assumindo formato hex)
    return `border-2 text-white`;
  }
  
  // Fallback para cores hardcoded
  const colorMap: Record<string, string> = {
    'tentando-financiamento': 'bg-blue-100 text-blue-800 border-blue-200',
    'parou-responder': 'bg-red-100 text-red-800 border-red-200',
    'cpf-restricao': 'bg-orange-100 text-orange-800 border-orange-200'
  };
  
  return colorMap[nome] || 'bg-gray-100 text-gray-800 border-gray-200';
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
      'tentando-financiamento': 'Tentando Financiamento',
      'parou-responder': 'Parou de Responder',
      'cpf-restricao': 'CPF Restrição'
    };
    return displayNames[tagName] || tagName;
  };

  return (
    <div className="space-y-2">
      {/* Etiquetas selecionadas */}
      <div className="flex flex-wrap gap-1 min-h-[32px] p-2 border rounded-md bg-gray-50">
        {selectedTags.length > 0 ? (
          selectedTags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className={`text-xs ${getTagColor(tag)} cursor-pointer hover:opacity-80`}
              onClick={() => handleTagToggle(tag)}
            >
              {getTagDisplayName(tag)}
              <span className="ml-1 text-xs">✕</span>
            </Badge>
          ))
        ) : (
          <span className="text-gray-400 text-sm">Nenhuma etiqueta selecionada</span>
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
        <PopoverContent className="w-72 p-4 bg-white dark:bg-gray-800 border shadow-lg z-50" align="start">
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Selecionar Etiquetas</h4>
            <div className="space-y-2">
              {loading ? (
                <div className="text-sm text-gray-500">Carregando tags...</div>
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
                        className={`text-xs ${getTagColor(tag.nome, tag.cor)}`}
                        style={{ backgroundColor: tag.cor }}
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

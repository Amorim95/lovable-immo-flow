
import { useState } from "react";
import { LeadTag } from "@/types/crm";
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

const availableTags: Record<LeadTag, { label: string; color: string }> = {
  'tentando-financiamento': {
    label: 'Tentando Financiamento',
    color: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  'parou-responder': {
    label: 'Parou de Responder',
    color: 'bg-red-100 text-red-800 border-red-200'
  },
  'cpf-restricao': {
    label: 'CPF Restrição',
    color: 'bg-orange-100 text-orange-800 border-orange-200'
  }
};

export function TagSelector({ selectedTags, onTagsChange, variant = 'default' }: TagSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleTagToggle = (tag: LeadTag) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    
    onTagsChange(newTags);
  };

  const isCompact = variant === 'compact';

  return (
    <div className="space-y-2">
      {/* Etiquetas selecionadas */}
      <div className="flex flex-wrap gap-1 min-h-[32px] p-2 border rounded-md bg-gray-50">
        {selectedTags.length > 0 ? (
          selectedTags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className={`text-xs ${availableTags[tag].color} cursor-pointer hover:opacity-80`}
              onClick={() => handleTagToggle(tag)}
            >
              {availableTags[tag].label}
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
          >
            <Tag className={`${isCompact ? "w-3 h-3" : "w-4 h-4"} mr-1`} />
            {isCompact ? "Tags" : "Adicionar/Remover Etiquetas"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-4" align="start">
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Selecionar Etiquetas</h4>
            <div className="space-y-2">
              {Object.entries(availableTags).map(([tag, config]) => (
                <div key={tag} className="flex items-center space-x-2">
                  <Checkbox
                    id={tag}
                    checked={selectedTags.includes(tag as LeadTag)}
                    onCheckedChange={() => handleTagToggle(tag as LeadTag)}
                  />
                  <label
                    htmlFor={tag}
                    className="text-sm font-medium leading-none cursor-pointer flex-1"
                    onClick={() => handleTagToggle(tag as LeadTag)}
                  >
                    <Badge
                      variant="secondary"
                      className={`text-xs ${config.color}`}
                    >
                      {config.label}
                    </Badge>
                  </label>
                </div>
              ))}
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

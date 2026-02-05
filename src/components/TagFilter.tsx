import { useState, useEffect } from "react";
import { Check, ChevronDown, Tag as TagIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useAvailableTags } from "@/hooks/useAvailableTags";
import { cn } from "@/lib/utils";

interface TagFilterProps {
  selectedTagIds: string[];
  onTagChange: (tagIds: string[]) => void;
  className?: string;
}

export function TagFilter({ selectedTagIds, onTagChange, className }: TagFilterProps) {
  const [open, setOpen] = useState(false);
  const { tags, loading } = useAvailableTags();

  const selectedTags = tags.filter(tag => selectedTagIds.includes(tag.id));

  const handleToggleTag = (tagId: string) => {
    const newSelection = selectedTagIds.includes(tagId)
      ? selectedTagIds.filter(id => id !== tagId)
      : [...selectedTagIds, tagId];
    
    onTagChange(newSelection);
  };

  const clearSelection = () => {
    onTagChange([]);
  };

  if (loading) {
    return (
      <div className={cn("w-full", className)}>
        <Button variant="outline" disabled className="w-full justify-start">
          <TagIcon className="mr-2 h-4 w-4" />
          Carregando etiquetas...
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-start"
          >
            <TagIcon className="mr-2 h-4 w-4" />
            {selectedTags.length === 0 
              ? "Selecionar etiquetas" 
              : `${selectedTags.length} etiqueta${selectedTags.length > 1 ? 's' : ''} selecionada${selectedTags.length > 1 ? 's' : ''}`
            }
            <ChevronDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar etiquetas..." />
            <CommandList>
              <CommandEmpty>Nenhuma etiqueta encontrada.</CommandEmpty>
              <CommandGroup>
                {tags.map((tag) => (
                  <CommandItem
                    key={tag.id}
                    value={tag.nome}
                    onSelect={() => handleToggleTag(tag.id)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedTagIds.includes(tag.id) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ 
                          backgroundColor: tag.nome === 'Lead Qualificado Pela IA' 
                            ? '#FFD700' 
                            : tag.cor 
                        }}
                      />
                      {tag.nome}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {/* Selected tags display */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedTags.map((tag) => (
            <Badge 
              key={tag.id} 
              variant="secondary" 
              className="text-xs"
              style={{ 
                backgroundColor: tag.nome === 'Lead Qualificado Pela IA' 
                  ? 'rgba(255, 215, 0, 0.2)' 
                  : `${tag.cor}20`, 
                borderColor: tag.nome === 'Lead Qualificado Pela IA' 
                  ? '#FFD700' 
                  : tag.cor 
              }}
            >
              <div 
                className="w-2 h-2 rounded-full mr-1"
                style={{ 
                  backgroundColor: tag.nome === 'Lead Qualificado Pela IA' 
                    ? '#FFD700' 
                    : tag.cor 
                }}
              />
              {tag.nome}
              <button
                onClick={() => handleToggleTag(tag.id)}
                className="ml-1 hover:bg-black/20 rounded-full w-3 h-3 flex items-center justify-center text-xs"
              >
                ×
              </button>
            </Badge>
          ))}
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 text-xs"
            onClick={clearSelection}
          >
            Limpar
          </Button>
        </div>
      )}
    </div>
  );
}
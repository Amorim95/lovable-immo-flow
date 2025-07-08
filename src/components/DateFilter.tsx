import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export type DateFilterOption = 
  | 'hoje' 
  | 'ontem' 
  | 'ultimos-7-dias' 
  | 'ultimos-15-dias' 
  | 'ultimos-30-dias' 
  | 'ultimos-3-meses' 
  | 'mes-passado' 
  | 'periodo-total' 
  | 'personalizado';

export interface DateRange {
  from: Date;
  to: Date;
}

interface DateFilterProps {
  value: DateFilterOption;
  customRange?: DateRange;
  onValueChange: (option: DateFilterOption, customRange?: DateRange) => void;
  className?: string;
}

const dateFilterOptions = [
  { value: 'hoje', label: 'Hoje' },
  { value: 'ontem', label: 'Ontem' },
  { value: 'ultimos-7-dias', label: 'Últimos 7 dias' },
  { value: 'ultimos-15-dias', label: 'Últimos 15 dias' },
  { value: 'ultimos-30-dias', label: 'Últimos 30 dias' },
  { value: 'ultimos-3-meses', label: 'Últimos 3 meses' },
  { value: 'mes-passado', label: 'Mês passado' },
  { value: 'periodo-total', label: 'Período Total' },
  { value: 'personalizado', label: 'Personalizado' },
] as const;

export function DateFilter({ value, customRange, onValueChange, className }: DateFilterProps) {
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
    from: customRange?.from,
    to: customRange?.to,
  });

  const handleSelectChange = (newValue: DateFilterOption) => {
    if (newValue !== 'personalizado') {
      onValueChange(newValue);
    } else {
      onValueChange(newValue, customRange);
    }
  };

  const handleDateRangeChange = (range: { from?: Date; to?: Date }) => {
    setDateRange(range);
    if (range.from && range.to) {
      onValueChange('personalizado', { from: range.from, to: range.to });
    }
  };

  const formatDateRange = () => {
    if (!dateRange.from) return "Selecionar período";
    if (!dateRange.to) return format(dateRange.from, "dd/MM/yyyy", { locale: ptBR });
    return `${format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} - ${format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}`;
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Select value={value} onValueChange={handleSelectChange}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Filtrar por data" />
        </SelectTrigger>
        <SelectContent>
          {dateFilterOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {value === 'personalizado' && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[300px] justify-start text-left font-normal",
                !dateRange.from && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formatDateRange()}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange.from}
              selected={{ from: dateRange.from, to: dateRange.to }}
              onSelect={handleDateRangeChange}
              numberOfMonths={2}
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

export function getDateRangeFromFilter(option: DateFilterOption, customRange?: DateRange): DateRange | null {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (option) {
    case 'hoje':
      return {
        from: today,
        to: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
      };
    
    case 'ontem':
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      return {
        from: yesterday,
        to: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1)
      };
    
    case 'ultimos-7-dias':
      return {
        from: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
        to: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
      };
    
    case 'ultimos-15-dias':
      return {
        from: new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000),
        to: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
      };
    
    case 'ultimos-30-dias':
      return {
        from: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
        to: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
      };
    
    case 'ultimos-3-meses':
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
      return {
        from: threeMonthsAgo,
        to: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
      };
    
    case 'mes-passado':
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return {
        from: lastMonth,
        to: lastMonthEnd
      };
    
    case 'periodo-total':
      return null; // Sem filtro, mostrar tudo
    
    case 'personalizado':
      return customRange || null;
    
    default:
      return null;
  }
}
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyFilter } from './useCompanyFilter';
import { DateRange } from '@/components/DateFilter';

interface FieldStat {
  value: string;
  count: number;
  percentage: number;
}

interface ProfileField {
  label: string;
  total: number;
  stats: FieldStat[];
}

interface IncomeBracket {
  label: string;
  count: number;
  percentage: number;
}

export interface ClientProfileData {
  totalLeads: number;
  leadsWithData: number;
  incomeBrackets: IncomeBracket[];
  fields: Record<string, ProfileField>;
}

const INCOME_BRACKETS = [
  { label: 'Até R$ 1.500', min: 0, max: 1500 },
  { label: 'R$ 1.500 - R$ 2.499', min: 1500, max: 2500 },
  { label: 'R$ 2.500 - R$ 3.999', min: 2500, max: 4000 },
  { label: 'R$ 4.000 - R$ 5.999', min: 4000, max: 6000 },
  { label: 'R$ 6.000+', min: 6000, max: Infinity },
];

function parseBRNumber(raw: string): number | null {
  let val = raw.trim();
  // Remove leading minus sign
  val = val.replace(/^-\s*/, '');
  // Remove trailing text like "reais", "mensal", "cada", and trailing symbols
  val = val.replace(/\s*(reais|mensal|cada|por\s+mês|mês|mes).*$/i, '').trim();
  val = val.replace(/[\$\*\.!]+$/, '').trim();
  
  if (!val) return null;
  
  // Format: "2.100,00" or "1.600,50" (dots=thousands, comma=decimal)
  if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(val)) {
    return parseFloat(val.replace(/\./g, '').replace(',', '.'));
  }
  
  // Format: "2.000" or "12.500" (dot-only, segment after last dot is 3 digits = thousands separator)
  if (/^\d{1,3}(\.\d{3})+$/.test(val)) {
    return parseFloat(val.replace(/\./g, ''));
  }
  
  // Format: "5,000" or "2,200" (English-style comma-as-thousands separator)
  if (/^\d{1,3}(,\d{3})+$/.test(val)) {
    return parseFloat(val.replace(/,/g, ''));
  }
  
  // Format: "2,5" or "3,5" shorthand (comma as decimal, result < 50 means thousands shorthand)
  if (/^\d+,\d{1}$/.test(val)) {
    const num = parseFloat(val.replace(',', '.'));
    if (!isNaN(num) && num < 50) return num * 1000;
  }
  
  // Format: "2.2000" or "3.9000" (typos - dot in wrong place)
  if (/^\d\.\d{4}$/.test(val)) {
    return parseFloat(val.replace('.', ''));
  }
  
  // Plain number
  const num = parseFloat(val.replace(',', '.'));
  if (!isNaN(num)) return num;
  
  return null;
}

function parseIncome(text: string): number | null {
  // Handle "salário mínimo" / "um salário mínimo" / "um salário"
  if (/sal[aá]rio\s*m[ií]nimo/i.test(text)) {
    return 1412;
  }
  
  // Handle "X a Y mil" range format (e.g., "2 a 3 mil por mês")
  const rangeMilMatch = text.match(/[Rr]enda[^0-9]*(\d+(?:[.,]\d+)?)\s*(?:a|até)\s*(\d+(?:[.,]\d+)?)\s*mil/i);
  if (rangeMilMatch) {
    const low = parseFloat(rangeMilMatch[1].replace(',', '.'));
    const high = parseFloat(rangeMilMatch[2].replace(',', '.'));
    if (!isNaN(low) && !isNaN(high)) {
      const avg = ((low + high) / 2) * 1000;
      if (avg >= 500 && avg <= 100000) return avg;
    }
  }
  
  // Handle range format "de R$X até R$Y" or "de R$X.000 até R$Y.000"  
  const rangeMatch = text.match(/[Rr]enda[^0-9R$]*de\s*R?\$?\s*([0-9.,]+)\s*(?:a|até)\s*R?\$?\s*([0-9.,]+)/i);
  if (rangeMatch) {
    const low = parseBRNumber(rangeMatch[1]);
    const high = parseBRNumber(rangeMatch[2]);
    if (low !== null && high !== null) {
      const avg = (low + high) / 2;
      if (avg >= 500 && avg <= 100000) return avg;
    }
  }
  
  const patterns = [
    /[Rr]enda\s*[Bb]ruta[^0-9R$]*(?:R?\$?\s*)?([0-9.,\-]+(?:\s*(?:mil|reais|mensal|cada|por\s+mês|mês|mes))?)/i,
    /[Rr]enda[^0-9R$]*(?:R?\$?\s*)?([0-9.,\-]+(?:\s*(?:mil|reais|mensal|cada|por\s+mês|mês|mes))?)/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      let raw = match[1].trim();
      
      // Handle "X mil"
      const milMatch = raw.match(/^([0-9.,]+)\s*mil/i);
      if (milMatch) {
        const base = parseFloat(milMatch[1].replace(',', '.'));
        if (!isNaN(base)) {
          const val = base * 1000;
          if (val >= 500 && val <= 100000) return val;
        }
        continue;
      }
      
      // Handle dual income: take first value before +, e, /
      const dualMatch = raw.match(/^([0-9.,\-]+)\s*(?:\+|e\s|\/)/);
      if (dualMatch) {
        raw = dualMatch[1];
      }
      
      const num = parseBRNumber(raw);
      if (num !== null && num >= 500 && num <= 100000) {
        return num;
      }
    }
  }
  return null;
}

function extractField(text: string, keys: string[]): string | null {
  for (const key of keys) {
    // Format 1: "Key: Value |" or "Key: Value" at end
    const pipeRegex = new RegExp(key + '\\s*:?\\s*([^|\\n]+)', 'i');
    const match = text.match(pipeRegex);
    if (match) {
      const val = match[1].trim().replace(/[!?]+$/, '').trim();
      if (val && val.length > 0 && val.length < 100) {
        return val;
      }
    }
  }
  return null;
}

function parseBirthDate(text: string): number | null {
  const patterns = [
    /[Dd]ata\s*de\s*[Nn]ascimento[^0-9]*(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,
    /[Dd]ata\s*de\s*[Nn]ascimento[^0-9]*(\d{1,2})(\d{2})(\d{4})/,
    /[Dd]ata\s*de\s*[Nn]ascimento[^0-9]*(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})(?!\d)/,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      let year = parseInt(match[3]);
      // Handle 2-digit years
      if (year < 100) {
        year = year < 30 ? 2000 + year : 1900 + year;
      }
      if (year > 1940 && year < 2010) {
        const now = new Date();
        return now.getFullYear() - year;
      }
    }
  }
  return null;
}

function getAgeRange(age: number): string {
  if (age < 25) return '18-24 anos';
  if (age < 30) return '25-29 anos';
  if (age < 35) return '30-34 anos';
  if (age < 40) return '35-39 anos';
  if (age < 50) return '40-49 anos';
  return '50+ anos';
}

function normalizeValue(val: string): string {
  const lower = val.toLowerCase().trim();
  if (lower === 'sim' || lower === 'sim!' || lower.startsWith('sim,') || lower.startsWith('sim ')) return 'Sim';
  if (lower === 'não' || lower === 'nao' || lower === 'não!' || lower === 'nao!') return 'Não';
  return val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
}

const FIELD_DEFINITIONS: { key: string; label: string; extractKeys: string[] }[] = [
  { key: 'primeira_casa', label: 'Primeira Casa', extractKeys: ['Primeira Casa', 'Primeira casa'] },
  { key: 'emprego', label: 'Emprego / Vínculo', extractKeys: ['Vínculo empregatício', 'Vinculo empregaticio', 'Emprego'] },
  { key: 'casado', label: 'Casado', extractKeys: ['Casado no cartório', 'Casado no cartorio', 'Casado'] },
  { key: 'filho_menor', label: 'Filho Menor de Idade', extractKeys: ['Tem filhos menor de idade', 'Tem filho menor de idade', 'filho menor'] },
  { key: 'somar_renda', label: 'Somar Renda', extractKeys: ['Se vai somar Renda', 'Somar renda', 'somar renda'] },
  { key: 'fgts', label: 'FGTS', extractKeys: ['FGTS ou Reserva de emergência', 'FGTS ou Reserva de emergencia', 'FGTS ou Reserva', 'FGTS'] },
  { key: 'bairro', label: 'Bairro de Preferência', extractKeys: ['Bairro de preferência', 'Bairro de preferencia'] },
  { key: 'horario', label: 'Horário de Preferência', extractKeys: ['Horário de Preferência', 'Horario de Preferencia', 'Melhor horário', 'Melhor horario'] },
];

function parseLeadData(dadosAdicionais: string) {
  const result: Record<string, string | null> = {};
  
  for (const field of FIELD_DEFINITIONS) {
    result[field.key] = extractField(dadosAdicionais, field.extractKeys);
  }
  
  const income = parseIncome(dadosAdicionais);
  const age = parseBirthDate(dadosAdicionais);
  
  return { fields: result, income, age };
}

export function useClientProfile(dateRange: DateRange | null, teamId?: string | null, userId?: string | null) {
  const [rawData, setRawData] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getCompanyId } = useCompanyFilter();
  const companyId = getCompanyId();

  useEffect(() => {
    if (!companyId) return;
    
    let cancelled = false;
    
    async function fetchAll() {
      setLoading(true);
      setError(null);
      
      try {
        // If filtering by team, first get user IDs in that team
        let teamUserIds: string[] | null = null;
        if (teamId) {
          const { data: teamUsers } = await supabase
            .from('users')
            .select('id')
            .eq('equipe_id', teamId);
          teamUserIds = teamUsers?.map(u => u.id) || [];
          if (teamUserIds.length === 0) {
            setRawData([]);
            setLoading(false);
            return;
          }
        }

        const allData: string[] = [];
        let from = 0;
        const batchSize = 1000;
        
        while (true) {
          let query = supabase
            .from('leads')
            .select('dados_adicionais, created_at, user_id')
            .eq('company_id', companyId)
            .not('dados_adicionais', 'is', null)
            .neq('dados_adicionais', '')
            .range(from, from + batchSize - 1);
          
          if (dateRange) {
            query = query.gte('created_at', dateRange.from.toISOString())
              .lte('created_at', dateRange.to.toISOString());
          }

          if (userId) {
            query = query.eq('user_id', userId);
          } else if (teamUserIds) {
            query = query.in('user_id', teamUserIds);
          }
          
          const { data, error: fetchError } = await query;
          
          if (fetchError) throw fetchError;
          if (cancelled) return;
          
          if (data) {
            allData.push(...data.map(d => d.dados_adicionais!).filter(Boolean));
          }
          
          if (!data || data.length < batchSize) break;
          from += batchSize;
        }
        
        setRawData(allData);
      } catch (err: any) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    
    fetchAll();
    return () => { cancelled = true; };
  }, [companyId, dateRange?.from?.getTime(), dateRange?.to?.getTime(), teamId, userId]);

  const profileData = useMemo((): ClientProfileData => {
    const incomes: number[] = [];
    const ages: number[] = [];
    const fieldCounts: Record<string, Record<string, number>> = {};
    
    for (const def of FIELD_DEFINITIONS) {
      fieldCounts[def.key] = {};
    }
    fieldCounts['idade'] = {};
    
    for (const text of rawData) {
      const parsed = parseLeadData(text);
      
      if (parsed.income !== null) incomes.push(parsed.income);
      if (parsed.age !== null) {
        const range = getAgeRange(parsed.age);
        fieldCounts['idade'][range] = (fieldCounts['idade'][range] || 0) + 1;
      }
      
      for (const def of FIELD_DEFINITIONS) {
        const val = parsed.fields[def.key];
        if (val) {
          const normalized = def.key === 'bairro' || def.key === 'horario' || def.key === 'emprego'
            ? val.charAt(0).toUpperCase() + val.slice(1)
            : normalizeValue(val);
          fieldCounts[def.key][normalized] = (fieldCounts[def.key][normalized] || 0) + 1;
        }
      }
    }
    
    // Income brackets
    const incomeBrackets: IncomeBracket[] = INCOME_BRACKETS.map(bracket => {
      const count = incomes.filter(i => i >= bracket.min && i < bracket.max).length;
      return {
        label: bracket.label,
        count,
        percentage: incomes.length > 0 ? Math.round((count / incomes.length) * 1000) / 10 : 0,
      };
    });
    
    // Profile fields
    const fields: Record<string, ProfileField> = {};
    
    for (const def of FIELD_DEFINITIONS) {
      const counts = fieldCounts[def.key];
      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      const stats = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([value, count]) => ({
          value,
          count,
          percentage: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
        }));
      
      fields[def.key] = { label: def.label, total, stats };
    }
    
    // Age field
    const ageCounts = fieldCounts['idade'];
    const ageTotal = Object.values(ageCounts).reduce((a, b) => a + b, 0);
    fields['idade'] = {
      label: 'Faixa Etária',
      total: ageTotal,
      stats: Object.entries(ageCounts)
        .sort((a, b) => {
          const order = ['18-24 anos', '25-29 anos', '30-34 anos', '35-39 anos', '40-49 anos', '50+ anos'];
          return order.indexOf(a[0]) - order.indexOf(b[0]);
        })
        .map(([value, count]) => ({
          value,
          count,
          percentage: ageTotal > 0 ? Math.round((count / ageTotal) * 1000) / 10 : 0,
        })),
    };
    
    return {
      totalLeads: rawData.length,
      leadsWithData: rawData.length,
      incomeBrackets,
      fields,
    };
  }, [rawData]);

  return { data: profileData, loading, error };
}

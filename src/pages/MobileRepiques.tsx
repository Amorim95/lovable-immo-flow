import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileDown, FileSpreadsheet } from "lucide-react";
import { AccessControlWrapper } from "@/components/AccessControlWrapper";
import { DateFilter, DateFilterOption, getDateRangeFromFilter } from "@/components/DateFilter";
import { UserFilter } from "@/components/UserFilter";
import { TagFilter } from "@/components/TagFilter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRepiquesExport } from "@/hooks/useRepiquesExport";
import { exportToExcel, exportToPDF } from "@/utils/exportHelpers";
import { useCompany } from "@/contexts/CompanyContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { MobileHeader } from "@/components/MobileHeader";

interface Equipe {
  id: string;
  nome: string;
}

export default function MobileRepiques() {
  const { leads, loading, error } = useRepiquesExport();
  const { settings } = useCompany();
  
  // Estados dos filtros
  const [dateFilter, setDateFilter] = useState<DateFilterOption>("periodo-total");
  const [customDateRange, setCustomDateRange] = useState<{ from: Date; to: Date } | undefined>();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedEquipeId, setSelectedEquipeId] = useState<string | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  // Buscar equipes
  const { data: equipes = [] } = useQuery({
    queryKey: ['equipes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipes')
        .select('id, nome')
        .order('nome');
      
      if (error) throw error;
      return data as Equipe[];
    }
  });

  // Filtrar leads
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      // Filtro de período
      const dateRange = getDateRangeFromFilter(dateFilter, customDateRange);
      if (dateRange) {
        const leadDate = new Date(lead.created_at);
        if (leadDate < dateRange.from || leadDate > dateRange.to) {
          return false;
        }
      }
      
      // Filtro de equipe
      if (selectedEquipeId && lead.user?.equipe_id !== selectedEquipeId) {
        return false;
      }
      
      // Filtro de usuário
      if (selectedUserId && lead.user_id !== selectedUserId) {
        return false;
      }
      
      // Filtro de tags
      if (selectedTagIds.length > 0) {
        const leadTagIds = lead.lead_tag_relations?.map(rel => rel.tag_id) || [];
        const hasMatchingTag = selectedTagIds.some(tagId => leadTagIds.includes(tagId));
        if (!hasMatchingTag) {
          return false;
        }
      }
      
      return true;
    });
  }, [leads, dateFilter, customDateRange, selectedEquipeId, selectedUserId, selectedTagIds]);

  const handleExportExcel = () => {
    if (filteredLeads.length === 0) {
      toast.error("Nenhum lead encontrado para exportar");
      return;
    }
    
    const filename = `repiques_${new Date().toISOString().split('T')[0]}`;
    exportToExcel(filteredLeads, filename);
    toast.success(`${filteredLeads.length} leads exportados para Excel`);
  };

  const handleExportPDF = () => {
    if (filteredLeads.length === 0) {
      toast.error("Nenhum lead encontrado para exportar");
      return;
    }
    
    const filename = `repiques_${new Date().toISOString().split('T')[0]}`;
    exportToPDF(filteredLeads, filename, settings?.name || 'CRM');
    toast.success(`${filteredLeads.length} leads exportados para PDF`);
  };

  const handleDateChange = (option: DateFilterOption, customRange?: { from: Date; to: Date }) => {
    setDateFilter(option);
    if (option === 'personalizado' && customRange) {
      setCustomDateRange(customRange);
    }
  };

  if (loading) {
    return (
      <AccessControlWrapper requireAdmin={false} requireGestor={false} allowAdmin allowGestor allowCorretor={false}>
        <div className="min-h-screen bg-background pb-20">
          <MobileHeader title="Repiques" showBackButton />
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </AccessControlWrapper>
    );
  }

  if (error) {
    return (
      <AccessControlWrapper requireAdmin={false} requireGestor={false} allowAdmin allowGestor allowCorretor={false}>
        <div className="min-h-screen bg-background pb-20">
          <MobileHeader title="Repiques" showBackButton />
          <div className="text-center text-red-500 p-8">
            {error}
          </div>
        </div>
      </AccessControlWrapper>
    );
  }

  return (
    <AccessControlWrapper requireAdmin={false} requireGestor={false} allowAdmin allowGestor allowCorretor={false}>
      <div className="min-h-screen bg-background pb-20">
        <MobileHeader title="Repiques" showBackButton />
        
        <div className="p-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Período</label>
                <DateFilter 
                  value={dateFilter}
                  customRange={customDateRange}
                  onValueChange={handleDateChange}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Equipe</label>
                <Select value={selectedEquipeId || ""} onValueChange={(value) => setSelectedEquipeId(value || null)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as equipes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas as equipes</SelectItem>
                    {equipes.map((equipe) => (
                      <SelectItem key={equipe.id} value={equipe.id}>
                        {equipe.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Usuário</label>
                <UserFilter 
                  selectedUserId={selectedUserId}
                  onUserChange={setSelectedUserId}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Etiquetas</label>
                <TagFilter 
                  selectedTagIds={selectedTagIds}
                  onTagChange={setSelectedTagIds}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resumo</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg">
                Total de leads: <strong>{filteredLeads.length}</strong>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Exportar</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Button onClick={handleExportExcel} className="gap-2 w-full" disabled={filteredLeads.length === 0}>
                <FileSpreadsheet className="w-4 h-4" />
                Exportar Excel
              </Button>
              <Button onClick={handleExportPDF} variant="outline" className="gap-2 w-full" disabled={filteredLeads.length === 0}>
                <FileDown className="w-4 h-4" />
                Exportar PDF
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Prévia</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredLeads.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum lead encontrado
                </p>
              ) : (
                <div className="space-y-3">
                  {filteredLeads.slice(0, 50).map((lead) => (
                    <div key={lead.id} className="p-3 border rounded-lg">
                      <p className="font-medium">{lead.nome}</p>
                      <p className="text-sm text-muted-foreground">{lead.telefone}</p>
                    </div>
                  ))}
                  {filteredLeads.length > 50 && (
                    <p className="text-sm text-muted-foreground text-center pt-2">
                      Mostrando 50 de {filteredLeads.length} leads
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AccessControlWrapper>
  );
}

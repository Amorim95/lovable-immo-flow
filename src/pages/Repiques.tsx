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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Equipe {
  id: string;
  nome: string;
}

export default function Repiques() {
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
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AccessControlWrapper>
    );
  }

  if (error) {
    return (
      <AccessControlWrapper requireAdmin={false} requireGestor={false} allowAdmin allowGestor allowCorretor={false}>
        <div className="text-center text-red-500 p-8">
          {error}
        </div>
      </AccessControlWrapper>
    );
  }

  return (
    <AccessControlWrapper requireAdmin={false} requireGestor={false} allowAdmin allowGestor allowCorretor={false}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Repiques</h1>
          <p className="text-muted-foreground">Exportação de leads em Excel ou PDF</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <Select value={selectedEquipeId || "all"} onValueChange={(value) => setSelectedEquipeId(value === "all" ? null : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as equipes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as equipes</SelectItem>
                    {equipes.map((equipe) => (
                      <SelectItem key={equipe.id} value={equipe.id}>
                        {equipe.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg">
              Total de leads encontrados: <strong>{filteredLeads.length}</strong>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Exportar</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Button onClick={handleExportExcel} className="gap-2" disabled={filteredLeads.length === 0}>
              <FileSpreadsheet className="w-4 h-4" />
              Exportar Excel
            </Button>
            <Button onClick={handleExportPDF} variant="outline" className="gap-2" disabled={filteredLeads.length === 0}>
              <FileDown className="w-4 h-4" />
              Exportar PDF
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Prévia dos Dados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border max-h-96 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Telefone</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-muted-foreground">
                        Nenhum lead encontrado com os filtros selecionados
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLeads.slice(0, 100).map((lead) => (
                      <TableRow key={lead.id}>
                        <TableCell>{lead.nome}</TableCell>
                        <TableCell>{lead.telefone}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              {filteredLeads.length > 100 && (
                <div className="p-4 text-sm text-muted-foreground text-center border-t">
                  Mostrando 100 de {filteredLeads.length} leads. Todos serão exportados.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AccessControlWrapper>
  );
}

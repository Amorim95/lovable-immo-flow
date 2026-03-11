import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateFilter, DateFilterOption, DateRange, getDateRangeFromFilter } from "@/components/DateFilter";
import { useClientProfile, LeadParsed, INCOME_BRACKETS } from "@/hooks/useClientProfile";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileHeader } from "@/components/MobileHeader";
import { TeamUserFilters } from "@/components/TeamUserFilters";
import { ProfileExportDialog } from "@/components/ProfileExportDialog";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Users, DollarSign, Loader2, Download } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";

const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

function ProfileFieldCard({ label, total, stats, onExport }: { 
  label: string; 
  total: number; 
  stats: { value: string; count: number; percentage: number }[];
  onExport: (value: string) => void;
}) {
  if (stats.length === 0) return null;
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{label}</CardTitle>
        <p className="text-xs text-muted-foreground">{total} leads com dados</p>
      </CardHeader>
      <CardContent className="space-y-2">
        {stats.map((stat) => (
          <div key={stat.value} className="space-y-1 group">
            <div className="flex justify-between text-sm items-center">
              <span className="truncate max-w-[55%]">{stat.value}</span>
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground whitespace-nowrap">{stat.count} ({stat.percentage}%)</span>
                <button
                  onClick={() => onExport(stat.value)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-muted"
                  title={`Baixar leads: ${stat.value}`}
                >
                  <Download className="w-3.5 h-3.5 text-primary" />
                </button>
              </div>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary rounded-full h-2 transition-all"
                style={{ width: `${Math.min(stat.percentage, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function PerfilCliente() {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { settings } = useCompany();
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('ultimos-7-dias');
  const [customDateRange, setCustomDateRange] = useState<DateRange>();
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportLeads, setExportLeads] = useState<LeadParsed[]>([]);
  const [exportLabel, setExportLabel] = useState('');

  const dateRange = useMemo(() => getDateRangeFromFilter(dateFilter, customDateRange), [dateFilter, customDateRange]);
  const { data, loading, error } = useClientProfile(dateRange, selectedTeamId, selectedUserId);

  const handleDateFilterChange = (option: DateFilterOption, customRange?: DateRange) => {
    setDateFilter(option);
    if (customRange) setCustomDateRange(customRange);
  };

  const handleExportIncomeBracket = useCallback((bracketLabel: string) => {
    const bracket = INCOME_BRACKETS.find(b => b.label === bracketLabel);
    if (!bracket) return;
    const filtered = data.parsedLeads.filter(l => 
      l.income !== null && l.income >= bracket.min && l.income < bracket.max
    );
    setExportLeads(filtered);
    setExportLabel(`Renda: ${bracketLabel}`);
    setExportDialogOpen(true);
  }, [data.parsedLeads]);

  const handleExportField = useCallback((fieldKey: string, fieldLabel: string, value: string) => {
    let filtered: LeadParsed[];
    if (fieldKey === 'idade') {
      filtered = data.parsedLeads.filter(l => l.ageRange === value);
    } else {
      filtered = data.parsedLeads.filter(l => l.fields[fieldKey] === value);
    }
    setExportLeads(filtered);
    setExportLabel(`${fieldLabel}: ${value}`);
    setExportDialogOpen(true);
  }, [data.parsedLeads]);

  const companyName = settings.name || user?.name || 'CRM';
  const companyLogo = settings.logo || null;

  const content = (
    <div className="space-y-6">
      {!isMobile && (
        <div>
          <h1 className="text-3xl font-bold text-foreground">Perfil de Cliente</h1>
          <p className="text-muted-foreground mt-1">Análise do perfil dos leads baseada nos dados adicionais</p>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Filtro de Período</label>
            <DateFilter value={dateFilter} customRange={customDateRange} onValueChange={handleDateFilterChange} />
          </div>
          <div className={isMobile ? 'space-y-4' : ''}>
            <TeamUserFilters
              selectedTeamId={selectedTeamId}
              selectedUserId={selectedUserId}
              onTeamChange={setSelectedTeamId}
              onUserChange={setSelectedUserId}
            />
          </div>
          {!loading && (
            <p className="text-sm text-muted-foreground mt-3">
              {data.totalLeads} leads com dados adicionais encontrados
            </p>
          )}
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span>Carregando perfil dos clientes...</span>
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-8 text-center text-destructive">
            Erro ao carregar dados: {error}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Income Distribution */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">Distribuição de Renda</CardTitle>
              </div>
              <p className="text-xs text-muted-foreground">
                {data.incomeBrackets.reduce((a, b) => a + b.count, 0)} leads com renda identificada
                <span className="ml-1 text-muted-foreground/60">— clique na barra para baixar</span>
              </p>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={data.incomeBrackets} 
                    margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                    style={{ cursor: 'pointer' }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                    <YAxis className="fill-muted-foreground" />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                      formatter={(value: number, name: string, props: any) => [`${value} leads (${props.payload.percentage}%)`, 'Volume']}
                    />
                    <Bar 
                      dataKey="count" 
                      radius={[4, 4, 0, 0]} 
                      cursor="pointer"
                      onClick={(barData: any) => {
                        if (barData && barData.label) {
                          handleExportIncomeBracket(barData.label);
                        }
                      }}
                    >
                      {data.incomeBrackets.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {/* Download buttons below chart */}
              <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-border">
                {data.incomeBrackets.map((bracket, idx) => (
                  bracket.count > 0 && (
                    <button
                      key={bracket.label}
                      onClick={() => handleExportIncomeBracket(bracket.label)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border border-border hover:bg-muted transition-colors"
                    >
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
                      <span>{bracket.label}</span>
                      <Download className="w-3 h-3 text-muted-foreground" />
                    </button>
                  )
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Profile Fields Grid */}
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Perfil Detalhado</h2>
          </div>
          <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3'}`}>
            {Object.entries(data.fields).map(([key, field]) => (
              <ProfileFieldCard 
                key={key} 
                label={field.label} 
                total={field.total} 
                stats={field.stats}
                onExport={(value) => handleExportField(key, field.label, value)}
              />
            ))}
          </div>
        </>
      )}

      <ProfileExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        leads={exportLeads}
        filterLabel={exportLabel}
        companyName={companyName}
        companyLogo={companyLogo}
      />
    </div>
  );

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <MobileHeader title="Perfil de Cliente" />
        <div className="p-4">{content}</div>
      </div>
    );
  }

  return content;
}

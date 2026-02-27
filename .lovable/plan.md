

## Plan: New "Perfil de Cliente" Dashboard

### Summary
Create a new dashboard page that analyzes the `dados_adicionais` text field from leads, extracting client profile data (income, employment, marital status, etc.) and displaying volume/percentage statistics with date filtering.

### Data Format Discovery
The `dados_adicionais` field has two formats that need parsing:

**Format 1** (pipe-separated):
```
Primeira Casa: Sim! | Emprego: Tenho carteira assinada | Casado: Sim | Renda: 2000 | Data de Nascimento: 5121994 | Tem filho menor de idade: Não | Se vai somar Renda: Sim | FGTS: Sim | Bairro de preferencia: Porto da pedra | CPF: ... | Horário de Preferência: Manhã
```

**Format 2** (numbered lines):
```
1 - Vínculo empregatício: Sim, a 9 anos
2 - Casado no cartório: Sim
3 - Tem filhos menor de idade?: Sim
4 - Somar renda: Não
5 - Data de nascimento: 26/04/1991
6 - Renda Bruta: R$ 2.100,00
7 - CPF: ...
8 - FGTS ou Reserva de emergência: Não
9 - Bairro de preferência: São Gonçalo
Melhor horário: 12h às 13h30
```

### Implementation Steps

1. **Create hook `src/hooks/useClientProfile.ts`**
   - Fetch all leads with `dados_adicionais` from the user's company, paginated (batches of 1000)
   - Apply date range filter on `created_at`
   - Parse both formats using regex to extract: Primeira Casa, Emprego, Casado, Data de Nascimento, Filho menor, Somar Renda, FGTS, Bairro de preferência, Horário de Preferência, Renda
   - Compute:
     - Income distribution in 5 brackets (up to R$1.500, R$1.500-2.499, R$2.500-3.999, R$4.000-5.999, R$6.000+)
     - For each categorical field: count of each value + percentage
     - Age distribution from birth dates

2. **Create page `src/pages/PerfilCliente.tsx`**
   - Desktop page with DateFilter component at top
   - Card with income distribution (bar chart using recharts)
   - Grid of cards showing each field's breakdown with volume and percentage
   - Each card shows: field name, top values with count and percentage bar
   - Loading and error states

3. **Create mobile page `src/pages/MobilePerfilCliente.tsx`**
   - Mobile-optimized layout with MobileHeader
   - Same data, stacked cards layout

4. **Add routes in `src/App.tsx`**
   - Desktop: `/dashboards/perfil-cliente` → `PerfilCliente`
   - Mobile: `/dashboards/perfil-cliente` → `PerfilCliente` (with mobile detection)

5. **Add navigation card in `src/pages/Dashboards.tsx`**
   - New card "Perfil de Cliente" with Users icon linking to `/dashboards/perfil-cliente`

6. **Add to mobile dashboards in `src/pages/MobileDashboards.tsx`**
   - New item in `dashboardItems` array for "Perfil de Cliente"

### Technical Details

- **Parsing logic**: Two regex strategies depending on format detection (pipe `|` separator vs numbered lines)
- **Income extraction**: Handle `R$ 2.100,00`, `2000`, `3,000 reis`, `1759 e 1640` (dual income) formats
- **Pagination**: Use batch fetching (1000 per batch) to overcome Supabase row limits
- **Charts**: Use recharts BarChart for income distribution, PieChart for categorical fields
- **Date filter**: Reuse existing `DateFilter` component and `getDateRangeFromFilter` utility


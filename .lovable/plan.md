

## Diagnosis: Parsing Bugs in `useClientProfile.ts`

After analyzing real data from RKMF Imoveis and Click Imoveis, I found **3 categories of bugs** causing data loss:

### Bug 1: Income parsing fails for BR number format without comma
Values like `"R$ 2.000"`, `"R$ 3.000"`, `"1.600"` are parsed as 2.0, 3.0, 1.6 (float) instead of 2000, 3000, 1600. The code only handles BR format when a comma is present (`2.100,00`), but most leads use dot-only thousands separators.

Also fails for: `"3 mil"`, `"5 mil"`, `"2,5"` (shorthand for 2500), `"2.2000"` / `"3.9000"` (typos), `"1.600 + 6.000"` (dual income), `"Um salário mínimo"` (text), `"INSS e 2.500"`, `"2.000 reais cada"`.

### Bug 2: Field extraction key ordering captures garbage
Keys are ordered short-first: `['Casado', 'Casado no cartório', ...]` and `['FGTS', 'FGTS ou Reserva de emergência', ...]`. The short key matches first on Format 2 data, capturing wrong values like `"no cartório: Sim"` instead of `"Sim"`, or `"ou Reserva de emergência: Não"` instead of `"Não"`.

### Bug 3: Birth date regex misses 2-digit years
Dates like `"26/05/77"` and `"23/05/96"` fail because the regex only accepts 4-digit years (`\d{4}`).

---

### Fix Plan (single file: `src/hooks/useClientProfile.ts`)

**1. Rewrite `parseIncome` function**
- Detect BR dot-only format: if number has dots and segment after last dot is 3 digits, treat dots as thousands separators (e.g., `"2.000"` → 2000)
- Handle `"X mil"` → multiply by 1000
- Handle shorthand `"2,5"` → when parsed value < 50, multiply by 1000
- Handle dual income (`+`, `e`, `/`): take the first numeric value
- Strip trailing text like `"reais"`, `"mensal"`, `"cada"`
- Handle `"salário mínimo"` → map to 1412 (current BR minimum wage)
- Widen range check to 500-100000

**2. Fix `extractField` key ordering**
- Reorder all `extractKeys` arrays to put longer/more-specific keys first (e.g., `['Casado no cartório', 'Casado no cartorio', 'Casado']`)
- Add word boundary or colon requirement after short keys to prevent partial matches

**3. Fix `parseBirthDate` for 2-digit years**
- Add pattern for `(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})` (2-digit year)
- Convert: if year < 30 → 2000+year, else → 1900+year


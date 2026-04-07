

## Add PITI Pie Chart + Amortization Bar Chart to Payment Estimator

### What changes

Enhance the Payment Estimator layout to use the empty left column for two visualizations:

1. **PITI Breakdown Pie Chart** — shows the percentage of each monthly payment component: Principal, Interest, Taxes, Insurance, and HOA
2. **Principal vs Interest Bar Chart** — stacked bar chart showing annual principal vs interest over the loan term, with term selector buttons (5, 15, 20, 30 years) matching the reference screenshot

### Layout

The current estimator is a single-column block. Change it to a two-column layout:
- **Left column**: Pie chart (top) + bar chart (bottom)
- **Right column**: Existing inputs and result summary (unchanged)

On mobile (< md), stack vertically: inputs first, then charts below.

### Technical details

**Pie chart** — Use Recharts `PieChart` + `Pie` + `Cell` with the existing chart components from `src/components/ui/chart.tsx`. Segments:
- Principal (blue) — derived by splitting P&I into principal and interest for month 1
- Interest (red/coral)
- Taxes (amber)
- Insurance (green)
- HOA (purple, only shown if > 0)

Center label shows total monthly payment. Legend below the pie.

**Bar chart** — Use Recharts `BarChart` with stacked `Bar` for Principal (blue) and Interest (red). Generate amortization schedule data (annual totals) based on current loan params. Add term selector buttons (5, 15, 20, 30 years) in the top-right of the chart area. Tooltip shows Year, Interest, and Principal amounts. Dark background card matching the reference screenshot style.

**Month-1 principal/interest split for pie chart:**
- Monthly interest = loanAmount * (rate/100/12)
- Monthly principal = P&I payment - monthly interest

**Amortization data generation:**
- Loop through each year, calculate annual principal and interest totals from the amortization schedule
- Recalculate when offerPrice, downPct, rate, or loan term changes

### Files

| File | Action |
|------|--------|
| `src/components/portal/PaymentCalculator.tsx` | Edit — add two-column layout, pie chart, bar chart with term selector, amortization data generation |


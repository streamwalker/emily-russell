// Pure helpers for the Payment Calculator — shared between the editor and the compare modal.

export const PIE_COLORS = [
  "hsl(210, 70%, 50%)",  // Principal - blue
  "hsl(0, 70%, 55%)",    // Interest - red/coral
  "hsl(40, 80%, 50%)",   // Taxes - amber
  "hsl(140, 50%, 45%)",  // Insurance - green
  "hsl(270, 50%, 55%)",  // HOA - purple
];

export const TERM_OPTIONS = [5, 15, 20, 30] as const;

export interface ScenarioInputs {
  offerPrice: number;
  downPct: number;
  rate: number;
  taxRate: number;
  insurance: number;
  hoa: number;
  loanTerm: number;
}

export interface SavedScenario extends ScenarioInputs {
  id: string;
  name: string;
  is_pinned: boolean;
  last_saved_by_admin: boolean;
}

export function defaultInputs(price: number, hoaFee: number): ScenarioInputs {
  return {
    offerPrice: price,
    downPct: 20,
    rate: 6.5,
    taxRate: 2.2,
    insurance: 150,
    hoa: hoaFee,
    loanTerm: 30,
  };
}

export function calcPI(loanAmount: number, annualRate: number, years = 30): number {
  if (loanAmount <= 0 || annualRate <= 0) return 0;
  const r = annualRate / 100 / 12;
  const n = years * 12;
  return loanAmount * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

export function generateAmortization(loanAmount: number, annualRate: number, years: number) {
  if (loanAmount <= 0 || annualRate <= 0) return [];
  const r = annualRate / 100 / 12;
  const n = years * 12;
  const payment = loanAmount * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  let balance = loanAmount;
  const data: { year: number; principal: number; interest: number }[] = [];
  for (let y = 1; y <= years; y++) {
    let yearPrincipal = 0;
    let yearInterest = 0;
    for (let m = 0; m < 12; m++) {
      if (balance <= 0) break;
      const intPayment = balance * r;
      const prinPayment = Math.min(payment - intPayment, balance);
      yearInterest += intPayment;
      yearPrincipal += prinPayment;
      balance -= prinPayment;
    }
    data.push({ year: y, principal: Math.round(yearPrincipal), interest: Math.round(yearInterest) });
  }
  return data;
}

/** Derived monthly numbers for a single scenario. */
export function computeBreakdown(s: ScenarioInputs) {
  const downAmt = Math.round(s.offerPrice * s.downPct / 100);
  const loanAmount = s.offerPrice - downAmt;
  const pi = Math.round(calcPI(loanAmount, s.rate, s.loanTerm));
  const monthlyInterest = loanAmount > 0 && s.rate > 0
    ? Math.round(loanAmount * (s.rate / 100 / 12))
    : 0;
  const monthlyPrincipal = Math.max(0, pi - monthlyInterest);
  const monthlyTaxes = Math.round((s.offerPrice * s.taxRate / 100) / 12);
  const monthly = pi + monthlyTaxes + s.insurance + s.hoa;
  return { downAmt, loanAmount, pi, monthlyInterest, monthlyPrincipal, monthlyTaxes, monthly };
}

import { useState, useMemo } from "react";

interface Expenses {
  piti?: number;
  hoa?: number;
  gas?: number;
  electric?: number;
  water?: number;
  trash?: number;
  other?: number;
  otherLabel?: string;
}

interface Property {
  id: string;
  address: string;
  city?: string;
  price?: number;
  rentEst?: string;
  expenses?: Expenses;
  [key: string]: unknown;
}

interface Tab {
  key: string;
  label: string;
  color: string;
}

interface DossierData {
  tabs: Tab[];
  properties: Record<string, Property[]>;
  [key: string]: unknown;
}

interface Props {
  dossierData: DossierData;
  onSave: (updatedData: DossierData) => void;
  onCancel: () => void;
  saving: boolean;
}

const EXPENSE_FIELDS: { key: keyof Omit<Expenses, "otherLabel">; label: string }[] = [
  { key: "piti", label: "PITI (Principal, Interest, Tax, Insurance)" },
  { key: "hoa", label: "HOA Fees" },
  { key: "gas", label: "Gas" },
  { key: "electric", label: "Electric" },
  { key: "water", label: "Water" },
  { key: "trash", label: "Trash Pickup" },
  { key: "other", label: "Other" },
];

function parseRent(rentEst?: string): number {
  if (!rentEst) return 0;
  const m = (rentEst || "").replace(/,/g, "").match(/\$?([\d]+)/);
  return m ? parseInt(m[1], 10) : 0;
}

const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 });

export default function ExpenseEditor({ dossierData, onSave, onCancel, saving }: Props) {
  const [data, setData] = useState<DossierData>(JSON.parse(JSON.stringify(dossierData)));
  const [expandedProp, setExpandedProp] = useState<string | null>(null);

  const allProperties = useMemo(() => {
    const result: { tabKey: string; tabLabel: string; tabColor: string; prop: Property; index: number }[] = [];
    data.tabs.forEach(tab => {
      (data.properties[tab.key] || []).forEach((prop, i) => {
        result.push({ tabKey: tab.key, tabLabel: tab.label, tabColor: tab.color, prop, index: i });
      });
    });
    return result;
  }, [data]);

  const updateExpense = (tabKey: string, propIndex: number, field: keyof Expenses, value: string) => {
    setData(prev => {
      const next = JSON.parse(JSON.stringify(prev)) as DossierData;
      const prop = next.properties[tabKey][propIndex];
      if (!prop.expenses) prop.expenses = {};
      if (field === "otherLabel") {
        prop.expenses.otherLabel = value;
      } else {
        prop.expenses[field] = value === "" ? undefined : Number(value);
      }
      return next;
    });
  };

  const totalExpenses = (e?: Expenses) => {
    if (!e) return 0;
    return (e.piti || 0) + (e.hoa || 0) + (e.gas || 0) + (e.electric || 0) + (e.water || 0) + (e.trash || 0) + (e.other || 0);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-display text-lg">Manage Monthly Expenses</h3>
        <div className="text-xs text-muted-foreground font-body">{allProperties.length} properties</div>
      </div>

      <div className="space-y-2 mb-5 max-h-[60vh] overflow-y-auto">
        {data.tabs.map(tab => {
          const props = data.properties[tab.key] || [];
          if (props.length === 0) return null;
          return (
            <div key={tab.key}>
              <div
                className="text-[10px] uppercase tracking-[2px] font-body font-semibold py-2 px-1 border-b border-border mb-1"
                style={{ color: tab.color }}
              >
                {tab.label}
              </div>
              {props.map((prop, i) => {
                const propId = `${tab.key}-${i}`;
                const isOpen = expandedProp === propId;
                const expenses = prop.expenses || {};
                const total = totalExpenses(expenses);
                const rent = parseRent(prop.rentEst as string | undefined);
                const net = rent > 0 ? rent - total : 0;

                return (
                  <div key={propId} className="border border-border rounded mb-1.5 bg-card overflow-hidden">
                    <button
                      onClick={() => setExpandedProp(isOpen ? null : propId)}
                      className="w-full text-left px-4 py-3 flex justify-between items-center bg-transparent border-none cursor-pointer font-body hover:bg-muted/50 transition-colors"
                    >
                      <div>
                        <span className="text-sm font-semibold text-foreground">{prop.address as string}</span>
                        <span className="text-xs text-muted-foreground ml-2">{prop.city as string}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs font-body">
                        {total > 0 && (
                          <span className="text-muted-foreground">{fmt(total)}/mo</span>
                        )}
                        {net !== 0 && (
                          <span style={{ color: net > 0 ? "#2e7d32" : "#c62828" }} className="font-semibold">
                            Net: {net > 0 ? "+" : ""}{fmt(net)}
                          </span>
                        )}
                        <span className="opacity-40">{isOpen ? "▲" : "▼"}</span>
                      </div>
                    </button>

                    {isOpen && (
                      <div className="px-4 pb-4 pt-1 border-t border-border">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                          {EXPENSE_FIELDS.map(({ key, label }) => (
                            <div key={key}>
                              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-body block mb-1">
                                {label}
                              </label>
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-muted-foreground">$</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={expenses[key as keyof Omit<Expenses, "otherLabel">] ?? ""}
                                  onChange={e => updateExpense(tab.key, i, key as keyof Expenses, e.target.value)}
                                  placeholder="0"
                                  className="er-input !py-1.5 !text-sm w-full"
                                />
                              </div>
                              {key === "other" && (
                                <input
                                  type="text"
                                  value={expenses.otherLabel || ""}
                                  onChange={e => updateExpense(tab.key, i, "otherLabel", e.target.value)}
                                  placeholder="Label (e.g., Internet)"
                                  className="er-input !py-1 !text-xs mt-1 w-full"
                                />
                              )}
                            </div>
                          ))}
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t border-border text-sm font-body">
                          <div className="flex gap-4">
                            <div>
                              <span className="text-muted-foreground">Total: </span>
                              <span className="font-bold text-foreground">{fmt(total)}/mo</span>
                            </div>
                            {rent > 0 && (
                              <div>
                                <span className="text-muted-foreground">Rent Est: </span>
                                <span className="font-bold" style={{ color: "#2e7d32" }}>{fmt(rent)}/mo</span>
                              </div>
                            )}
                          </div>
                          {net !== 0 && (
                            <div className="font-bold" style={{ color: net > 0 ? "#2e7d32" : "#c62828" }}>
                              Net: {net > 0 ? "+" : ""}{fmt(net)}/mo
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <div className="flex gap-3 pt-2 border-t border-border">
        <button
          onClick={() => onSave(data)}
          disabled={saving}
          className="btn-er-primary !py-2.5 !px-6 !text-[10px]"
        >
          {saving ? "Saving…" : "Save Expenses"}
        </button>
        <button
          onClick={onCancel}
          className="btn-outline-light !text-charcoal !border-border !py-2.5 !px-6 !text-[10px]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

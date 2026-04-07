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
  beds?: number;
  baths?: string;
  sqft?: number;
  stories?: number;
  garages?: number;
  builder?: string;
  plan?: string;
  type?: string;
  status?: string;
  community?: string;
  area?: string;
  rentEst?: string;
  yieldEst?: string;
  rentNote?: string;
  sourceUrl?: string;
  notes?: string;
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

const TEXT_FIELDS: { key: keyof Property; label: string }[] = [
  { key: "address", label: "Address" },
  { key: "city", label: "City" },
  { key: "community", label: "Community" },
  { key: "area", label: "Area" },
  { key: "builder", label: "Builder" },
  { key: "plan", label: "Plan" },
  { key: "type", label: "Type" },
  { key: "status", label: "Status" },
];

const NUMBER_FIELDS: { key: keyof Property; label: string }[] = [
  { key: "price", label: "Price ($)" },
  { key: "beds", label: "Beds" },
  { key: "sqft", label: "Sq Ft" },
  { key: "stories", label: "Stories" },
  { key: "garages", label: "Garages" },
];

const ESTIMATE_FIELDS: { key: keyof Property; label: string }[] = [
  { key: "baths", label: "Baths" },
  { key: "rentEst", label: "Rent Estimate" },
  { key: "yieldEst", label: "Yield Estimate" },
  { key: "rentNote", label: "Rent Note" },
  { key: "sourceUrl", label: "Source Listing URL" },
];

export default function PropertyEditor({ dossierData, onSave, onCancel, saving }: Props) {
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

  const updateField = (tabKey: string, propIndex: number, field: string, value: string, isNumber: boolean) => {
    setData(prev => {
      const next = JSON.parse(JSON.stringify(prev)) as DossierData;
      const prop = next.properties[tabKey][propIndex];
      if (isNumber) {
        (prop as any)[field] = value === "" ? undefined : Number(value);
      } else {
        (prop as any)[field] = value;
      }
      return next;
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-display text-lg">Edit Properties & Agent Notes</h3>
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

                return (
                  <div key={propId} className="border border-border rounded mb-1.5 bg-card overflow-hidden">
                    <button
                      onClick={() => setExpandedProp(isOpen ? null : propId)}
                      className="w-full text-left px-4 py-3 flex justify-between items-center bg-transparent border-none cursor-pointer font-body hover:bg-muted/50 transition-colors"
                    >
                      <div>
                        <span className="text-sm font-semibold text-foreground">{prop.address}</span>
                        <span className="text-xs text-muted-foreground ml-2">{prop.city}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs font-body">
                        {prop.notes && <span className="text-primary">📝 Has Notes</span>}
                        <span className="opacity-40">{isOpen ? "▲" : "▼"}</span>
                      </div>
                    </button>

                    {isOpen && (
                      <div className="px-4 pb-4 pt-1 border-t border-border">
                        {/* Text fields */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                          {TEXT_FIELDS.map(({ key, label }) => (
                            <div key={key}>
                              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-body block mb-1">
                                {label}
                              </label>
                              <input
                                type="text"
                                value={(prop[key] as string) || ""}
                                onChange={e => updateField(tab.key, i, key as string, e.target.value, false)}
                                className="er-input !py-1.5 !text-sm w-full"
                              />
                            </div>
                          ))}
                        </div>

                        {/* Number fields */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
                          {NUMBER_FIELDS.map(({ key, label }) => (
                            <div key={key}>
                              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-body block mb-1">
                                {label}
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={prop[key] !== undefined && prop[key] !== null ? String(prop[key]) : ""}
                                onChange={e => updateField(tab.key, i, key as string, e.target.value, true)}
                                className="er-input !py-1.5 !text-sm w-full"
                              />
                            </div>
                          ))}
                        </div>

                        {/* Estimate / string fields */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                          {ESTIMATE_FIELDS.map(({ key, label }) => (
                            <div key={key}>
                              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-body block mb-1">
                                {label}
                              </label>
                              <input
                                type="text"
                                value={(prop[key] as string) || ""}
                                onChange={e => updateField(tab.key, i, key as string, e.target.value, false)}
                                className="er-input !py-1.5 !text-sm w-full"
                              />
                            </div>
                          ))}
                        </div>

                        {/* Agent Notes */}
                        <div className="mb-2">
                          <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-body block mb-1">
                            Agent Notes
                          </label>
                          <textarea
                            value={(prop.notes as string) || ""}
                            onChange={e => updateField(tab.key, i, "notes", e.target.value, false)}
                            rows={4}
                            placeholder="Add notes about this property for the client..."
                            className="er-input !py-2 !text-sm w-full"
                            style={{ resize: "vertical" }}
                          />
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
          {saving ? "Saving…" : "Save All"}
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

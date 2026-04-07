import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Plus, Sparkles, Loader2 } from "lucide-react";

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

const TAB_COLORS = [
  "hsl(27, 35%, 59%)", "hsl(15, 38%, 62%)", "hsl(140, 30%, 55%)",
  "hsl(220, 30%, 55%)", "hsl(270, 30%, 55%)", "hsl(340, 30%, 55%)",
  "hsl(50, 40%, 55%)", "hsl(180, 30%, 50%)",
];

export default function PropertyEditor({ dossierData, onSave, onCancel, saving }: Props) {
  const [data, setData] = useState<DossierData>(JSON.parse(JSON.stringify(dossierData)));
  const [expandedProp, setExpandedProp] = useState<string | null>(null);
  const [showSmartAdd, setShowSmartAdd] = useState(false);
  const [smartAddText, setSmartAddText] = useState("");
  const [smartAdding, setSmartAdding] = useState(false);
  const [smartAddError, setSmartAddError] = useState("");
  const [newTabLabel, setNewTabLabel] = useState("");
  const [showAddTab, setShowAddTab] = useState(false);

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

  const addProperty = (tabKey: string) => {
    setData(prev => {
      const next = JSON.parse(JSON.stringify(prev)) as DossierData;
      if (!next.properties[tabKey]) next.properties[tabKey] = [];
      const newProp: Property = {
        id: `prop-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        address: "",
      };
      next.properties[tabKey].push(newProp);
      return next;
    });
    // Auto-expand the new property
    const newIndex = (data.properties[tabKey]?.length || 0);
    setExpandedProp(`${tabKey}-${newIndex}`);
  };

  const deleteProperty = (tabKey: string, propIndex: number) => {
    if (!confirm("Remove this property from the dossier?")) return;
    setData(prev => {
      const next = JSON.parse(JSON.stringify(prev)) as DossierData;
      next.properties[tabKey].splice(propIndex, 1);
      return next;
    });
    setExpandedProp(null);
  };

  const addTab = () => {
    if (!newTabLabel.trim()) return;
    const key = newTabLabel.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
    const colorIndex = data.tabs.length % TAB_COLORS.length;
    setData(prev => {
      const next = JSON.parse(JSON.stringify(prev)) as DossierData;
      next.tabs.push({ key, label: newTabLabel.trim(), color: TAB_COLORS[colorIndex] });
      next.properties[key] = [];
      return next;
    });
    setNewTabLabel("");
    setShowAddTab(false);
  };

  const smartAdd = async () => {
    setSmartAdding(true);
    setSmartAddError("");
    try {
      const { data: result, error } = await supabase.functions.invoke("parse-properties", {
        body: { rawText: smartAddText },
      });
      if (error) throw new Error(error.message || "Extraction failed");
      if (result?.error) throw new Error(result.error);
      const parsed = result.dossierData as DossierData;
      // Merge into existing data
      setData(prev => {
        const next = JSON.parse(JSON.stringify(prev)) as DossierData;
        (parsed.tabs || []).forEach(newTab => {
          const existing = next.tabs.find(t => t.key === newTab.key);
          if (existing) {
            // Append properties to existing tab
            next.properties[existing.key] = [
              ...(next.properties[existing.key] || []),
              ...(parsed.properties[newTab.key] || []),
            ];
          } else {
            // Create new tab
            next.tabs.push(newTab);
            next.properties[newTab.key] = parsed.properties[newTab.key] || [];
          }
        });
        return next;
      });
      setSmartAddText("");
      setShowSmartAdd(false);
    } catch (e: unknown) {
      setSmartAddError(e instanceof Error ? e.message : "Failed to extract properties");
    }
    setSmartAdding(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-display text-lg">Edit Properties & Agent Notes</h3>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSmartAdd(!showSmartAdd)}
            className="flex items-center gap-1.5 font-body text-[10px] uppercase tracking-[2px] cursor-pointer bg-transparent border border-primary/50 text-primary px-3 py-1.5 hover:border-primary hover:bg-primary/5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" /> Smart Add
          </button>
          <div className="text-xs text-muted-foreground font-body">{allProperties.length} properties</div>
        </div>
      </div>

      {/* Smart Add Panel */}
      {showSmartAdd && (
        <div className="bg-muted/30 border border-border rounded p-4 mb-4">
          <label className="er-label block mb-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Paste property info to add via AI
          </label>
          <textarea
            value={smartAddText}
            onChange={e => setSmartAddText(e.target.value)}
            rows={6}
            placeholder="Paste addresses, listing descriptions, URLs..."
            className="er-input text-sm w-full mb-2"
            style={{ resize: "vertical" }}
          />
          {smartAddError && <div className="text-destructive text-xs mb-2">{smartAddError}</div>}
          <div className="flex gap-2">
            <button
              onClick={smartAdd}
              disabled={smartAdding || smartAddText.trim().length < 10}
              className="btn-er-primary !py-2 !px-4 !text-[10px] flex items-center gap-1.5"
            >
              {smartAdding ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Extracting…</> : <><Sparkles className="w-3.5 h-3.5" /> Extract & Add</>}
            </button>
            <button
              onClick={() => { setShowSmartAdd(false); setSmartAddText(""); setSmartAddError(""); }}
              className="btn-outline-light !text-charcoal !border-border !py-2 !px-4 !text-[10px]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2 mb-5 max-h-[60vh] overflow-y-auto">
        {data.tabs.map(tab => {
          const props = data.properties[tab.key] || [];
          return (
            <div key={tab.key}>
              <div
                className="text-[10px] uppercase tracking-[2px] font-body font-semibold py-2 px-1 border-b border-border mb-1 flex justify-between items-center"
                style={{ color: tab.color }}
              >
                <span>{tab.label} ({props.length})</span>
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
                        <span className="text-sm font-semibold text-foreground">{prop.address || "(no address)"}</span>
                        <span className="text-xs text-muted-foreground ml-2">{prop.city}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs font-body">
                        {prop.notes && <span className="text-primary">📝 Has Notes</span>}
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteProperty(tab.key, i); }}
                          className="text-destructive/50 hover:text-destructive bg-transparent border-none cursor-pointer p-1 transition-colors"
                          title="Remove property"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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
              {/* Add Property button per tab */}
              <button
                onClick={() => addProperty(tab.key)}
                className="flex items-center gap-1.5 font-body text-[10px] uppercase tracking-[2px] cursor-pointer bg-transparent border border-dashed border-border text-muted-foreground px-3 py-2 w-full hover:border-primary hover:text-primary transition-colors mb-2"
              >
                <Plus className="w-3.5 h-3.5" /> Add Property to {tab.label}
              </button>
            </div>
          );
        })}

        {/* Add Tab */}
        {showAddTab ? (
          <div className="flex gap-2 items-center mt-2">
            <input
              value={newTabLabel}
              onChange={e => setNewTabLabel(e.target.value)}
              placeholder="Tab label (e.g. Builder Name)"
              className="er-input !py-1.5 !text-sm flex-1"
              onKeyDown={e => e.key === "Enter" && addTab()}
            />
            <button onClick={addTab} className="btn-er-primary !py-1.5 !px-4 !text-[10px]">Add</button>
            <button onClick={() => { setShowAddTab(false); setNewTabLabel(""); }} className="btn-outline-light !text-charcoal !border-border !py-1.5 !px-4 !text-[10px]">Cancel</button>
          </div>
        ) : (
          <button
            onClick={() => setShowAddTab(true)}
            className="flex items-center gap-1.5 font-body text-[10px] uppercase tracking-[2px] cursor-pointer bg-transparent border border-dashed border-border text-muted-foreground px-3 py-2 w-full hover:border-primary hover:text-primary transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add New Tab (Builder Group)
          </button>
        )}
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

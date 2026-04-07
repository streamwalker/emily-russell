import { useState, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Plus, Sparkles, Loader2, Search, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  useDroppable,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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

/* ── Sortable property row ── */
function SortablePropertyRow({
  id,
  prop,
  tabKey,
  propIndex,
  isOpen,
  onToggle,
  onDelete,
  onUpdateField,
}: {
  id: string;
  prop: Property;
  tabKey: string;
  propIndex: number;
  isOpen: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onUpdateField: (field: string, value: string, isNumber: boolean) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="border border-border rounded mb-1.5 bg-card overflow-hidden">
      <div className="w-full text-left px-4 py-3 flex justify-between items-center font-body hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <button
            className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground bg-transparent border-none p-0.5 touch-none"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="w-4 h-4" />
          </button>
          <button onClick={onToggle} className="flex-1 min-w-0 text-left bg-transparent border-none cursor-pointer p-0">
            <span className="text-sm font-semibold text-foreground">{prop.address || "(no address)"}</span>
            <span className="text-xs text-muted-foreground ml-2">{prop.city}</span>
          </button>
        </div>
        <div className="flex items-center gap-3 text-xs font-body shrink-0">
          {prop.notes && <span className="text-primary">📝 Has Notes</span>}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="text-destructive/50 hover:text-destructive bg-transparent border-none cursor-pointer p-1 transition-colors"
            title="Remove property"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={onToggle} className="opacity-40 bg-transparent border-none cursor-pointer p-0">{isOpen ? "▲" : "▼"}</button>
        </div>
      </div>

      {isOpen && (
        <div className="px-4 pb-4 pt-1 border-t border-border">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            {TEXT_FIELDS.map(({ key, label }) => (
              <div key={key}>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-body block mb-1">{label}</label>
                <input type="text" value={(prop[key] as string) || ""} onChange={e => onUpdateField(key as string, e.target.value, false)} className="er-input !py-1.5 !text-sm w-full" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
            {NUMBER_FIELDS.map(({ key, label }) => (
              <div key={key}>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-body block mb-1">{label}</label>
                <input type="number" min="0" value={prop[key] !== undefined && prop[key] !== null ? String(prop[key]) : ""} onChange={e => onUpdateField(key as string, e.target.value, true)} className="er-input !py-1.5 !text-sm w-full" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
            {ESTIMATE_FIELDS.map(({ key, label }) => (
              <div key={key}>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-body block mb-1">{label}</label>
                <input type="text" value={(prop[key] as string) || ""} onChange={e => onUpdateField(key as string, e.target.value, false)} className="er-input !py-1.5 !text-sm w-full" />
              </div>
            ))}
          </div>
          <div className="mb-2">
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-body block mb-1">Agent Notes</label>
            <textarea value={(prop.notes as string) || ""} onChange={e => onUpdateField("notes", e.target.value, false)} rows={4} placeholder="Add notes about this property for the client..." className="er-input !py-2 !text-sm w-full" style={{ resize: "vertical" }} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Droppable tab container ── */
function DroppableTab({ tabKey, children }: { tabKey: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: `tab-${tabKey}` });
  return (
    <div ref={setNodeRef} className={`min-h-[40px] transition-colors rounded ${isOver ? "bg-primary/5 ring-1 ring-primary/30" : ""}`}>
      {children}
    </div>
  );
}

/* ── Main editor ── */
export default function PropertyEditor({ dossierData, onSave, onCancel, saving }: Props) {
  const [data, setData] = useState<DossierData>(JSON.parse(JSON.stringify(dossierData)));
  const [expandedProp, setExpandedProp] = useState<string | null>(null);
  const [showSmartAdd, setShowSmartAdd] = useState(false);
  const [smartAddText, setSmartAddText] = useState("");
  const [smartAdding, setSmartAdding] = useState(false);
  const [smartAddError, setSmartAddError] = useState("");
  const [newTabLabel, setNewTabLabel] = useState("");
  const [showAddTab, setShowAddTab] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Build a flat map of sortable id → { tabKey, index } for dnd
  const propIdMap = useMemo(() => {
    const map: Record<string, { tabKey: string; index: number }> = {};
    data.tabs.forEach(tab => {
      (data.properties[tab.key] || []).forEach((prop, i) => {
        map[prop.id] = { tabKey: tab.key, index: i };
      });
    });
    return map;
  }, [data]);

  const matchesSearch = useCallback((prop: Property) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return [prop.address, prop.city, prop.builder, prop.community]
      .some(v => v && String(v).toLowerCase().includes(q));
  }, [searchQuery]);

  const totalCount = useMemo(() => {
    return data.tabs.reduce((sum, tab) => sum + (data.properties[tab.key]?.length || 0), 0);
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
      setData(prev => {
        const next = JSON.parse(JSON.stringify(prev)) as DossierData;
        (parsed.tabs || []).forEach(newTab => {
          const existing = next.tabs.find(t => t.key === newTab.key);
          if (existing) {
            next.properties[existing.key] = [
              ...(next.properties[existing.key] || []),
              ...(parsed.properties[newTab.key] || []),
            ];
          } else {
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

  // ── Drag handlers ──
  const findTabForPropId = (propId: string): string | null => {
    for (const tab of data.tabs) {
      if ((data.properties[tab.key] || []).some(p => p.id === propId)) return tab.key;
    }
    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeTabKey = findTabForPropId(active.id as string);
    let overTabKey: string | null = null;

    // Check if over a tab container
    const overId = over.id as string;
    if (overId.startsWith("tab-")) {
      overTabKey = overId.replace("tab-", "");
    } else {
      overTabKey = findTabForPropId(overId);
    }

    if (!activeTabKey || !overTabKey || activeTabKey === overTabKey) return;

    // Move property to new tab
    setData(prev => {
      const next = JSON.parse(JSON.stringify(prev)) as DossierData;
      const srcArr = next.properties[activeTabKey];
      const srcIdx = srcArr.findIndex((p: Property) => p.id === active.id);
      if (srcIdx === -1) return prev;
      const [moved] = srcArr.splice(srcIdx, 1);
      const destArr = next.properties[overTabKey!] || [];

      // Find insert position
      if (overId.startsWith("tab-")) {
        destArr.push(moved);
      } else {
        const destIdx = destArr.findIndex((p: Property) => p.id === overId);
        destArr.splice(destIdx >= 0 ? destIdx : destArr.length, 0, moved);
      }
      next.properties[overTabKey!] = destArr;
      return next;
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const activeTabKey = findTabForPropId(active.id as string);
    const overTabKey = findTabForPropId(over.id as string);

    if (!activeTabKey || !overTabKey || activeTabKey !== overTabKey) return;
    if (active.id === over.id) return;

    setData(prev => {
      const next = JSON.parse(JSON.stringify(prev)) as DossierData;
      const arr = next.properties[activeTabKey];
      const oldIdx = arr.findIndex((p: Property) => p.id === active.id);
      const newIdx = arr.findIndex((p: Property) => p.id === over.id);
      next.properties[activeTabKey] = arrayMove(arr, oldIdx, newIdx);
      return next;
    });
  };

  const activeProp = activeId ? (() => {
    for (const tab of data.tabs) {
      const found = (data.properties[tab.key] || []).find(p => p.id === activeId);
      if (found) return found;
    }
    return null;
  })() : null;

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
          <div className="text-xs text-muted-foreground font-body">{totalCount} properties</div>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search by address, city, builder, or community..."
          className="er-input !py-2 !pl-9 !text-sm w-full"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground bg-transparent border-none cursor-pointer text-xs"
          >
            ✕
          </button>
        )}
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

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-2 mb-5 max-h-[60vh] overflow-y-auto">
          {data.tabs.map(tab => {
            const props = data.properties[tab.key] || [];
            const filteredProps = props.filter(matchesSearch);
            if (searchQuery && filteredProps.length === 0) return null;

            return (
              <div key={tab.key}>
                <div
                  className="text-[10px] uppercase tracking-[2px] font-body font-semibold py-2 px-1 border-b border-border mb-1 flex justify-between items-center"
                  style={{ color: tab.color }}
                >
                  <span>{tab.label} ({props.length})</span>
                </div>
                <DroppableTab tabKey={tab.key}>
                  <SortableContext items={props.map(p => p.id)} strategy={verticalListSortingStrategy}>
                    {props.map((prop, i) => {
                      const hidden = searchQuery && !matchesSearch(prop);
                      if (hidden) return null;
                      const propId = `${tab.key}-${i}`;
                      return (
                        <SortablePropertyRow
                          key={prop.id}
                          id={prop.id}
                          prop={prop}
                          tabKey={tab.key}
                          propIndex={i}
                          isOpen={expandedProp === propId}
                          onToggle={() => setExpandedProp(expandedProp === propId ? null : propId)}
                          onDelete={() => deleteProperty(tab.key, i)}
                          onUpdateField={(field, value, isNum) => updateField(tab.key, i, field, value, isNum)}
                        />
                      );
                    })}
                  </SortableContext>
                </DroppableTab>
                {!searchQuery && (
                  <button
                    onClick={() => addProperty(tab.key)}
                    className="flex items-center gap-1.5 font-body text-[10px] uppercase tracking-[2px] cursor-pointer bg-transparent border border-dashed border-border text-muted-foreground px-3 py-2 w-full hover:border-primary hover:text-primary transition-colors mb-2"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Property to {tab.label}
                  </button>
                )}
              </div>
            );
          })}

          {/* Add Tab */}
          {!searchQuery && (
            showAddTab ? (
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
            )
          )}
        </div>

        <DragOverlay>
          {activeProp ? (
            <div className="border border-primary/50 rounded bg-card shadow-lg px-4 py-3 font-body text-sm opacity-90">
              <span className="font-semibold text-foreground">{activeProp.address || "(no address)"}</span>
              <span className="text-xs text-muted-foreground ml-2">{activeProp.city}</span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

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

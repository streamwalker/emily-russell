import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import FilterSortToolbar from "@/components/portal/FilterSortToolbar";
import RankBadge from "@/components/portal/RankBadge";
import TabSummary from "@/components/portal/TabSummary";
import {
  scorePrimaryResidence,
  scoreIncomeGeneration,
  applyFilters,
  applySort,
  getUniqueCities,
  getUniqueBuilders,
  defaultFilters,
  type FilterState,
  type SortField,
  type RankedProperty,
} from "@/lib/dossierScoring";

/* ── Types ── */
interface Property {
  id: string;
  address: string;
  city: string;
  community: string;
  area: string;
  builder: string;
  price: number;
  beds: number;
  baths: string;
  sqft: number;
  stories: number;
  garages: number;
  status: string;
  plan: string;
  type: string;
  notes: string;
  rentEst?: string;
  rentNote?: string;
  yieldEst?: string;
  expenses?: {
    piti?: number;
    hoa?: number;
    gas?: number;
    electric?: number;
    water?: number;
    trash?: number;
    other?: number;
    otherLabel?: string;
  };
}

interface Tab {
  key: string;
  label: string;
  color: string;
}

interface DossierData {
  tabs: Tab[];
  properties: Record<string, Property[]>;
  preparedBy?: string;
  subtitle?: string;
  date?: string;
  phone?: string;
}

const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 });

const ALL_HOMES_TAB: Tab = { key: "all-homes", label: "📋 All Homes", color: "#6B7280" };

const RANK_TABS: Tab[] = [
  { key: "rank-primary", label: "🏠 Primary Residence", color: "#5B7FA5" },
  { key: "rank-income", label: "💰 Income Generation", color: "#2e7d32" },
];

/* ── Property Row ── */
function PropertyRow({
  prop,
  isExpanded,
  onToggle,
  accentColor,
  rankInfo,
}: {
  prop: Property;
  isExpanded: boolean;
  onToggle: () => void;
  accentColor: string;
  rankInfo?: { rank: number; scoreSummary: string; sourceTab: string };
}) {
  return (
    <div className="bg-card rounded border border-border mb-3.5 overflow-hidden shadow-sm">
      {rankInfo && (
        <div className="px-5 pt-3 pb-1">
          <RankBadge rank={rankInfo.rank} summary={rankInfo.scoreSummary} sourceTab={rankInfo.sourceTab} color={accentColor} />
        </div>
      )}
      <div
        onClick={onToggle}
        className="flex justify-between items-center px-5 py-3.5 cursor-pointer transition-all duration-150"
        style={{ background: isExpanded ? accentColor : "hsl(var(--card))", color: isExpanded ? "#fff" : "hsl(var(--charcoal))" }}
      >
        <div className="flex-1 min-w-0">
          <div className="text-[17px] font-bold font-display">{prop.address}</div>
          <div className="text-xs opacity-70 mt-0.5 font-body">{prop.city} · {prop.community}</div>
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
          {prop.beds && (
            <div className="text-center font-body">
              <div className="text-[9px] opacity-50 uppercase tracking-widest">Bed</div>
              <div className="text-[15px] font-bold">{prop.beds}</div>
            </div>
          )}
          {prop.baths && (
            <div className="text-center font-body">
              <div className="text-[9px] opacity-50 uppercase tracking-widest">Bath</div>
              <div className="text-[15px] font-bold">{prop.baths}</div>
            </div>
          )}
          {prop.sqft && (
            <div className="text-center font-body">
              <div className="text-[9px] opacity-50 uppercase tracking-widest">Sq Ft</div>
              <div className="text-[15px] font-bold">{prop.sqft.toLocaleString()}</div>
            </div>
          )}
          <div className="text-right min-w-[90px]">
            <div className="text-[17px] font-bold font-display">{prop.price ? fmt(prop.price) : "Call"}</div>
            <span
              className="text-[9px] px-2 py-0.5 rounded inline-block mt-0.5 font-semibold tracking-wide font-body"
              style={{
                background: isExpanded
                  ? "rgba(255,255,255,0.2)"
                  : prop.status === "Move-In Ready" || prop.status === "New Construction"
                    ? "rgba(76,175,80,0.12)"
                    : "rgba(255,193,7,0.15)",
                color: isExpanded
                  ? "rgba(255,255,255,0.85)"
                  : prop.status === "Move-In Ready" || prop.status === "New Construction"
                    ? "#2e7d32"
                    : "#f57f17",
              }}
            >
              {prop.status}
            </span>
          </div>
          <div className="text-xs ml-1 opacity-50">{isExpanded ? "▲" : "▼"}</div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-5 py-4 border-t" style={{ borderColor: `${accentColor}15` }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] uppercase tracking-[2px] text-muted-foreground mb-2 font-body">Property Details</div>
              <div className="font-body text-[13px]">
                {([
                  ["Area", prop.area],
                  ["Builder", prop.builder],
                  ["Plan", prop.plan],
                  ["Type", prop.type],
                  ["Stories", prop.stories],
                  ["Garages", prop.garages ? `${prop.garages}-car` : null],
                ] as [string, string | number | null][])
                  .filter(([, v]) => v)
                  .map(([label, value], i) => (
                    <div key={i} className="flex justify-between py-1.5 border-b border-border/50">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-semibold text-foreground text-right max-w-[65%] text-xs">{value}</span>
                    </div>
                  ))}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[2px] text-muted-foreground mb-2 font-body">Agent Notes</div>
              <div className="text-[12.5px] leading-relaxed text-foreground font-body bg-muted p-3 rounded border border-border/50">
                {prop.notes}
              </div>
              {(prop.rentEst || prop.yieldEst) && (
                <div className="mt-2.5 p-2.5 rounded border" style={{ background: "#f0f7f0", borderColor: "#c8e6c9" }}>
                  <div className="flex justify-between items-start gap-4">
                    {prop.rentEst && (
                      <div>
                        <div className="text-[9px] uppercase tracking-[2px] mb-1 font-body" style={{ color: "#2e7d32" }}>
                          Rental Income Est.
                        </div>
                        <div className="text-sm font-bold font-body" style={{ color: "#2e7d32" }}>{prop.rentEst}</div>
                      </div>
                    )}
                    {prop.yieldEst && (
                      <div className="text-right">
                        <div className="text-[9px] uppercase tracking-[2px] mb-1 font-body" style={{ color: "#2e7d32" }}>
                          Projected Gross Yield
                        </div>
                        <div className="text-sm font-bold font-body" style={{ color: "#2e7d32" }}>{prop.yieldEst}</div>
                      </div>
                    )}
                  </div>
                  {prop.rentNote && <div className="text-[11px] text-muted-foreground mt-1 italic">{prop.rentNote}</div>}
                </div>
              )}
              {prop.expenses && Object.values(prop.expenses).some(v => v && v !== 0) && (() => {
                const e = prop.expenses!;
                const items: [string, number][] = [
                  ["PITI (Principal, Interest, Taxes, Insurance)", e.piti || 0],
                  ["HOA Fees", e.hoa || 0],
                  ["Gas", e.gas || 0],
                  ["Electric", e.electric || 0],
                  ["Water", e.water || 0],
                  ["Trash Pickup", e.trash || 0],
                  [e.otherLabel || "Other", e.other || 0],
                ].filter(([, v]) => typeof v === "number" && v > 0) as [string, number][];
                const totalExpenses = items.reduce((sum, [, v]) => sum + v, 0);
                const rentNum = (() => { const m = (prop.rentEst || "").replace(/,/g, "").match(/\$?([\d]+)/); return m ? parseInt(m[1], 10) : 0; })();
                const netIncome = rentNum > 0 ? rentNum - totalExpenses : 0;
                return (
                  <div className="mt-2.5 p-2.5 rounded border border-border bg-card">
                    <div className="text-[9px] uppercase tracking-[2px] text-muted-foreground mb-2 font-body font-semibold">Monthly Expenses</div>
                    {items.map(([label, value], i) => (
                      <div key={i} className="flex justify-between py-1 border-b border-border/30 text-[12px] font-body">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-semibold text-foreground">${value.toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="flex justify-between py-1.5 mt-1 text-[12px] font-body font-bold">
                      <span className="text-muted-foreground">Total Expenses</span>
                      <span className="text-foreground">${totalExpenses.toLocaleString()}/mo</span>
                    </div>
                    {netIncome !== 0 && (
                      <div className="flex justify-between py-1.5 text-[12px] font-body font-bold border-t border-border">
                        <span style={{ color: netIncome > 0 ? "#2e7d32" : "#c62828" }}>Net Cash Flow</span>
                        <span style={{ color: netIncome > 0 ? "#2e7d32" : "#c62828" }}>
                          {netIncome > 0 ? "+" : ""}${netIncome.toLocaleString()}/mo
                        </span>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main Portal ── */
export default function ClientPortal() {
  const [dossier, setDossier] = useState<DossierData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [userEmail, setUserEmail] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [sort, setSort] = useState<SortField>("price-asc");
  const { isAdmin } = useAdminCheck();
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/portal/login", { replace: true }); return; }
      setUserEmail(session.user.email || "");

      const { data, error } = await supabase
        .from("client_dossiers")
        .select("dossier_data")
        .eq("user_id", session.user.id)
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        setDossier(null);
      } else {
        const d = data.dossier_data as unknown as DossierData;
        setDossier(d);
        if (d.tabs?.length) {
          setActiveTab(d.tabs[0].key);
          const firstIds = Object.values(d.properties).map(arr => arr[0]?.id).filter(Boolean);
          setExpandedIds(new Set(firstIds));
        }
      }
      setLoading(false);
    };
    load();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/portal/login", { replace: true });
  };

  const toggle = (id: string) => {
    setExpandedIds(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  // Derived data
  const allTabs = useMemo(() => (dossier ? [...dossier.tabs, ...RANK_TABS] : []), [dossier]);
  const tabLabels = useMemo(() => {
    if (!dossier) return {};
    const map: Record<string, string> = {};
    dossier.tabs.forEach(t => (map[t.key] = t.label));
    return map;
  }, [dossier]);

  const cities = useMemo(() => (dossier ? getUniqueCities(dossier.properties) : []), [dossier]);
  const builders = useMemo(() => (dossier ? getUniqueBuilders(dossier.properties) : []), [dossier]);

  const primaryRanked = useMemo(
    () => (dossier ? applyFilters(scorePrimaryResidence(dossier.properties, tabLabels), filters) : []),
    [dossier, tabLabels, filters]
  );
  const incomeRanked = useMemo(
    () => (dossier ? scoreIncomeGeneration(dossier.properties, tabLabels) : { fullRental: [], airbnbPotential: [] }),
    [dossier, tabLabels]
  );
  const incomeFiltered = useMemo(() => ({
    fullRental: applyFilters(incomeRanked.fullRental, filters),
    airbnbPotential: applyFilters(incomeRanked.airbnbPotential, filters),
  }), [incomeRanked, filters]);

  const isRankTab = activeTab.startsWith("rank-");

  const builderProperties = useMemo(() => {
    if (!dossier || isRankTab) return [];
    const raw = dossier.properties[activeTab] || [];
    return applySort(applyFilters(raw, filters), sort);
  }, [dossier, activeTab, filters, sort, isRankTab]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-primary font-body text-lg">Loading your dossier…</div>
      </div>
    );
  }

  if (!dossier) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center">
          <h2 className="font-display text-2xl text-foreground mb-3">No Dossier Available</h2>
          <p className="font-body text-sm text-muted-foreground mb-6">Your personalized dossier is being prepared. Please check back soon.</p>
          <button onClick={handleLogout} className="btn-er-primary">Sign Out</button>
        </div>
      </div>
    );
  }

  const currentTab = allTabs.find(t => t.key === activeTab) || allTabs[0];

  const totalProps = Object.values(dossier.properties).flat().length;

  const outOfTownByCity =
    activeTab === "outoftown" && !isRankTab
      ? builderProperties.reduce<Record<string, Property[]>>((acc, p) => {
          const city = p.city.split(",")[0].trim();
          if (!acc[city]) acc[city] = [];
          acc[city].push(p);
          return acc;
        }, {})
      : null;

  return (
    <div className="font-body min-h-screen" style={{ background: "hsl(var(--background))", color: "hsl(var(--foreground))" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)", color: "#fff", padding: "32px 24px 0" }}>
        <div className="max-w-[960px] mx-auto">
          <div className="flex justify-between items-start mb-5">
            <div>
              <div className="text-[10px] tracking-[3px] uppercase opacity-45 mb-1.5">
                {dossier.preparedBy || "Prepared by Emily Russell · Fathom Realty · TREC #791742"}
              </div>
              <h1 className="font-display text-[26px] font-bold m-0">Client Property Dossier</h1>
              <p className="text-xs opacity-55 mt-1">
                {dossier.subtitle || `Multi-Builder New Construction · San Antonio Metro & Beyond · ${totalProps} Properties`}
              </p>
            </div>
            <div className="text-right flex items-start gap-4">
              <div className="opacity-45 text-[11px] leading-relaxed">
                <div>{dossier.date || "April 6, 2026"}</div>
                <div>{dossier.phone || "(210) 912-0806"}</div>
              </div>
              {isAdmin && (
                <Link to="/portal/admin" className="font-body text-[11px] uppercase tracking-[2px] no-underline bg-transparent border border-primary/50 text-primary px-4 py-2 hover:border-primary hover:text-white transition-colors">
                  Admin
                </Link>
              )}
              <div className="relative">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="font-body text-[11px] uppercase tracking-[2px] cursor-pointer bg-transparent border border-white/30 text-white/70 px-4 py-2 hover:text-white hover:border-white/60 transition-colors"
                >
                  ⚙ Account
                </button>
                {showSettings && (
                  <div className="absolute right-0 top-full mt-2 bg-foreground border border-white/10 rounded shadow-xl min-w-[180px] py-1 z-50">
                    <Link to="/portal/change-email" className="block px-4 py-2 text-[12px] text-white/70 no-underline hover:text-white hover:bg-white/5 font-body transition-colors">
                      Change Email
                    </Link>
                    <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-[12px] text-white/70 bg-transparent border-none cursor-pointer hover:text-white hover:bg-white/5 font-body transition-colors">
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto">
            {allTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="px-3.5 py-2.5 rounded-t border-none cursor-pointer text-[11px] font-semibold tracking-wide font-body whitespace-nowrap transition-all duration-150"
                style={{
                  background: activeTab === tab.key ? tab.color : "rgba(255,255,255,0.06)",
                  color: activeTab === tab.key ? "#fff" : "rgba(255,255,255,0.4)",
                }}
              >
                {tab.label}{" "}
                {!tab.key.startsWith("rank-") && (
                  <span className="opacity-50">({(dossier.properties[tab.key] || []).length})</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Accent bar */}
      <div className="h-[3px]" style={{ background: currentTab.color }} />

      {/* Content */}
      <div className="max-w-[960px] mx-auto px-6 py-5 pb-12">
        <FilterSortToolbar
          filters={filters}
          sort={sort}
          onFiltersChange={setFilters}
          onSortChange={setSort}
          cities={cities}
          builders={builders}
        />

        <h2 className="font-display text-lg font-semibold mb-3.5" style={{ color: currentTab.color }}>
          {currentTab.label}
        </h2>

        {/* Tab Summary */}
        {activeTab === "rank-primary" ? (
          <TabSummary properties={primaryRanked} color={currentTab.color} label="Primary Residence Rankings" />
        ) : activeTab === "rank-income" ? (
          <TabSummary properties={incomeFiltered.fullRental} color={currentTab.color} label="Income Generation Rankings" />
        ) : (
          <TabSummary properties={builderProperties} color={currentTab.color} label={currentTab.label} />
        )}

        {/* Rank: Primary Residence */}
        {activeTab === "rank-primary" && (
          <div>
            <p className="text-xs text-muted-foreground font-body mb-4">
              All {primaryRanked.length} properties ranked best-to-worst for primary residence living — based on size, layout, value per sq ft, and move-in readiness.
            </p>
            {primaryRanked.map(p => (
              <PropertyRow
                key={p.id}
                prop={p}
                isExpanded={expandedIds.has(p.id)}
                onToggle={() => toggle(p.id)}
                accentColor={currentTab.color}
                rankInfo={{ rank: p.rank, scoreSummary: p.scoreSummary, sourceTab: p.sourceTab }}
              />
            ))}
          </div>
        )}

        {/* Rank: Income Generation */}
        {activeTab === "rank-income" && (
          <div>
            <div className="mb-6">
              <h3 className="font-display text-base font-semibold mb-1" style={{ color: "#2e7d32" }}>
                Full Rental
              </h3>
              <p className="text-xs text-muted-foreground font-body mb-3">
                Ranked by gross yield, rental income, and barrier to entry — {incomeFiltered.fullRental.length} properties.
              </p>
              {incomeFiltered.fullRental.map(p => (
                <PropertyRow
                  key={`fr-${p.id}`}
                  prop={p}
                  isExpanded={expandedIds.has(p.id)}
                  onToggle={() => toggle(p.id)}
                  accentColor={currentTab.color}
                  rankInfo={{ rank: p.rank, scoreSummary: p.scoreSummary, sourceTab: p.sourceTab }}
                />
              ))}
            </div>

            {incomeFiltered.airbnbPotential.length > 0 && (
              <div>
                <h3 className="font-display text-base font-semibold mb-1" style={{ color: "#1565c0" }}>
                  Airbnb / House-Hack Potential
                </h3>
                <p className="text-xs text-muted-foreground font-body mb-3">
                  Properties suited for short-term rentals or renting out part of the home — {incomeFiltered.airbnbPotential.length} properties.
                </p>
                {incomeFiltered.airbnbPotential.map(p => (
                  <PropertyRow
                    key={`ab-${p.id}`}
                    prop={p}
                    isExpanded={expandedIds.has(p.id)}
                    onToggle={() => toggle(p.id)}
                    accentColor="#1565c0"
                    rankInfo={{ rank: p.rank, scoreSummary: p.scoreSummary, sourceTab: p.sourceTab }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Regular builder tabs */}
        {!isRankTab && (
          <>
            {activeTab === "outoftown" && outOfTownByCity ? (
              Object.entries(outOfTownByCity).map(([city, props]) => (
                <div key={city} className="mb-5">
                  <div className="text-[11px] font-bold uppercase tracking-[2px] text-muted-foreground mb-2 pb-1 border-b border-border">
                    {city}
                  </div>
                  {props.map(p => (
                    <PropertyRow key={p.id} prop={p} isExpanded={expandedIds.has(p.id)} onToggle={() => toggle(p.id)} accentColor={currentTab.color} />
                  ))}
                </div>
              ))
            ) : (
              builderProperties.map(p => (
                <PropertyRow key={p.id} prop={p} isExpanded={expandedIds.has(p.id)} onToggle={() => toggle(p.id)} accentColor={currentTab.color} />
              ))
            )}
          </>
        )}

        {/* Disclaimer */}
        <div className="mt-6 p-3.5 bg-card rounded border border-border text-[10px] text-muted-foreground leading-relaxed">
          <span className="font-bold uppercase tracking-wider" style={{ color: "#666" }}>Disclaimer: </span>
          Pricing, availability, and specifications subject to change without notice. Rental estimates based on comparables as of April 2026. Not financial or investment advice. Builder incentives subject to lender approval. Consult a financial advisor before investing. Prepared by Emily Russell, REALTOR® — Fathom Realty · (210) 912-0806 · emily@streamwalkers.com · alamocitydesigns.com
        </div>
      </div>

      {/* Logged-in indicator */}
      <div className="fixed bottom-4 left-4 font-body text-[10px] text-muted-foreground opacity-50">
        Logged in as {userEmail}
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdminCheck } from "@/hooks/useAdminCheck";

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

/* ── Property Row ── */
function PropertyRow({ prop, isExpanded, onToggle, accentColor }: { prop: Property; isExpanded: boolean; onToggle: () => void; accentColor: string }) {
  return (
    <div className="bg-white rounded border border-border mb-3.5 overflow-hidden shadow-sm">
      <div
        onClick={onToggle}
        className="flex justify-between items-center px-5 py-3.5 cursor-pointer transition-all duration-150"
        style={{ background: isExpanded ? accentColor : "#fff", color: isExpanded ? "#fff" : "hsl(var(--charcoal))" }}
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
              <div className="text-[10px] uppercase tracking-[2px] text-slate-er mb-2 font-body">Property Details</div>
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
                      <span className="text-slate-er">{label}</span>
                      <span className="font-semibold text-charcoal text-right max-w-[65%] text-xs">{value}</span>
                    </div>
                  ))}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[2px] text-slate-er mb-2 font-body">Agent Notes</div>
              <div className="text-[12.5px] leading-relaxed text-charcoal font-body bg-warm p-3 rounded border border-border/50">
                {prop.notes}
              </div>
              {prop.rentEst && (
                <div className="mt-2.5 p-2.5 rounded border" style={{ background: "#f0f7f0", borderColor: "#c8e6c9" }}>
                  <div className="text-[9px] uppercase tracking-[2px] mb-1 font-body" style={{ color: "#2e7d32" }}>
                    Rental Income Est.
                  </div>
                  <div className="text-sm font-bold font-body" style={{ color: "#2e7d32" }}>{prop.rentEst}</div>
                  {prop.rentNote && <div className="text-[11px] text-slate-er mt-1 italic">{prop.rentNote}</div>}
                </div>
              )}
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
          // Expand first property of each tab
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="text-gold font-body text-lg">Loading your dossier…</div>
      </div>
    );
  }

  if (!dossier) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream px-4">
        <div className="text-center">
          <h2 className="font-display text-2xl text-charcoal mb-3">No Dossier Available</h2>
          <p className="font-body text-sm text-slate-er mb-6">Your personalized dossier is being prepared. Please check back soon.</p>
          <button onClick={handleLogout} className="btn-er-primary">Sign Out</button>
        </div>
      </div>
    );
  }

  const currentTab = dossier.tabs.find(t => t.key === activeTab) || dossier.tabs[0];
  const properties = dossier.properties[activeTab] || [];
  const totalProps = Object.values(dossier.properties).flat().length;

  const outOfTownByCity =
    activeTab === "outoftown"
      ? properties.reduce<Record<string, Property[]>>((acc, p) => {
          const city = p.city.split(",")[0].trim();
          if (!acc[city]) acc[city] = [];
          acc[city].push(p);
          return acc;
        }, {})
      : null;

  return (
    <div className="font-body min-h-screen" style={{ background: "#f4f2ee", color: "#1a1a1a" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)", color: "#fff", padding: "32px 24px 0" }}>
        <div className="max-w-[960px] mx-auto">
          <div className="flex justify-between items-start mb-5">
            <div>
              <div className="text-[10px] tracking-[3px] uppercase opacity-45 mb-1.5">
                {dossier.preparedBy || "Prepared by Emily Russell · Fathom Realty · TREC #791742"}
              </div>
              <h1 className="font-display text-[26px] font-bold m-0">{dossier.tabs ? "Client Property Dossier" : "Dossier"}</h1>
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
                <Link to="/portal/admin" className="font-body text-[11px] uppercase tracking-[2px] no-underline bg-transparent border border-gold/50 text-gold-light px-4 py-2 hover:border-gold hover:text-white transition-colors">
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
                  <div className="absolute right-0 top-full mt-2 bg-charcoal border border-white/10 rounded shadow-xl min-w-[180px] py-1 z-50">
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
            {dossier.tabs.map(tab => (
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
                <span className="opacity-50">({(dossier.properties[tab.key] || []).length})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Accent bar */}
      <div className="h-[3px]" style={{ background: currentTab.color }} />

      {/* Content */}
      <div className="max-w-[960px] mx-auto px-6 py-5 pb-12">
        <h2 className="font-display text-lg font-semibold mb-3.5" style={{ color: currentTab.color }}>
          {currentTab.label}
        </h2>

        {activeTab === "outoftown" && outOfTownByCity ? (
          Object.entries(outOfTownByCity).map(([city, props]) => (
            <div key={city} className="mb-5">
              <div className="text-[11px] font-bold uppercase tracking-[2px] text-slate-er mb-2 pb-1 border-b border-border">
                {city}
              </div>
              {props.map(p => (
                <PropertyRow key={p.id} prop={p} isExpanded={expandedIds.has(p.id)} onToggle={() => toggle(p.id)} accentColor={currentTab.color} />
              ))}
            </div>
          ))
        ) : (
          properties.map(p => (
            <PropertyRow key={p.id} prop={p} isExpanded={expandedIds.has(p.id)} onToggle={() => toggle(p.id)} accentColor={currentTab.color} />
          ))
        )}

        {/* Disclaimer */}
        <div className="mt-6 p-3.5 bg-white rounded border border-border text-[10px] text-slate-er leading-relaxed">
          <span className="font-bold uppercase tracking-wider" style={{ color: "#666" }}>Disclaimer: </span>
          Pricing, availability, and specifications subject to change without notice. Rental estimates based on comparables as of April 2026. Not financial or investment advice. Builder incentives subject to lender approval. Consult a financial advisor before investing. Prepared by Emily Russell, REALTOR® — Fathom Realty · (210) 912-0806 · emily@streamwalkers.com · alamocitydesigns.com
        </div>
      </div>

      {/* Logged-in indicator */}
      <div className="fixed bottom-4 left-4 font-body text-[10px] text-slate-er opacity-50">
        Logged in as {userEmail}
      </div>
    </div>
  );
}

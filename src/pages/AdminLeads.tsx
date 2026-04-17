import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ArrowLeft, Download, Search, ArrowUpDown, Mail, Phone } from "lucide-react";
import { toast } from "sonner";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  timeframe: string | null;
  message: string | null;
  source: string;
  metadata: Record<string, unknown> | null;
  user_agent: string | null;
  referrer: string | null;
  created_at: string;
}

type SortKey = "created_at" | "name" | "timeframe";
type SortDir = "asc" | "desc";

export default function AdminLeads() {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [highlightedIds, setHighlightedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!adminLoading && !isAdmin) navigate("/portal/dashboard", { replace: true });
    if (!adminLoading && isAdmin) fetchLeads();
  }, [adminLoading, isAdmin, navigate]);

  // Realtime subscription for new leads
  useEffect(() => {
    if (adminLoading || !isAdmin) return;
    const channel = supabase
      .channel("leads-inserts")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "leads" },
        (payload) => {
          const newLead = payload.new as Lead;
          setLeads((prev) => {
            if (prev.some((l) => l.id === newLead.id)) return prev;
            return [newLead, ...prev];
          });
          setHighlightedIds((prev) => {
            const next = new Set(prev);
            next.add(newLead.id);
            return next;
          });
          setTimeout(() => {
            setHighlightedIds((prev) => {
              const next = new Set(prev);
              next.delete(newLead.id);
              return next;
            });
          }, 3000);
          toast.success(`New lead from ${newLead.name}`, {
            description: `${newLead.email}${newLead.timeframe ? ` · ${newLead.timeframe}` : ""} · ${newLead.source}`,
            duration: 8000,
            action: {
              label: "View",
              onClick: () => setSelectedLead(newLead),
            },
          });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [adminLoading, isAdmin]);

  const fetchLeads = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setLeads(data as Lead[]);
    setLoading(false);
  };

  const sources = useMemo(() => {
    const set = new Set<string>();
    leads.forEach((l) => set.add(l.source));
    return Array.from(set).sort();
  }, [leads]);

  const filtered = useMemo(() => {
    let rows = leads;
    if (sourceFilter !== "all") rows = rows.filter((l) => l.source === sourceFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q) ||
          (l.phone || "").toLowerCase().includes(q),
      );
    }
    rows = [...rows].sort((a, b) => {
      const av = (a[sortKey] || "") as string;
      const bv = (b[sortKey] || "") as string;
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return rows;
  }, [leads, search, sourceFilter, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const exportCsv = () => {
    const headers = ["Date", "Name", "Email", "Phone", "Timeframe", "Source", "Message", "Referrer"];
    const escape = (v: unknown) => {
      const s = v == null ? "" : String(v);
      return `"${s.replace(/"/g, '""').replace(/\r?\n/g, " ")}"`;
    };
    const rows = filtered.map((l) =>
      [
        new Date(l.created_at).toISOString(),
        l.name,
        l.email,
        l.phone || "",
        l.timeframe || "",
        l.source,
        l.message || "",
        l.referrer || "",
      ]
        .map(escape)
        .join(","),
    );
    const csv = [headers.map(escape).join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 500);
  };

  if (adminLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="text-primary font-body text-lg">Loading leads…</div>
      </div>
    );
  }

  return (
    <div className="font-body min-h-screen bg-cream text-charcoal">
      <div className="bg-charcoal text-white px-6 py-5">
        <div className="max-w-[1200px] mx-auto flex justify-between items-center">
          <div>
            <h1 className="font-display text-2xl font-bold m-0">Recent Leads</h1>
            <p className="text-[10px] tracking-[3px] uppercase opacity-45 mt-1">
              {filtered.length} of {leads.length} submissions
            </p>
          </div>
          <div className="flex gap-3 items-center">
            <Link
              to="/portal/admin"
              className="font-body text-[11px] uppercase tracking-[2px] text-white/70 no-underline hover:text-white transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Admin Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 py-8">
        {/* Toolbar */}
        <div className="flex flex-wrap gap-3 mb-5 items-center">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search name, email, phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="h-10 px-3 bg-white border border-input rounded-md text-sm font-body"
          >
            <option value="all">All sources</option>
            {sources.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <Button
            variant="outline"
            onClick={exportCsv}
            disabled={filtered.length === 0}
            className="ml-auto"
          >
            <Download className="w-4 h-4" /> Export CSV
          </Button>
        </div>

        {/* Table */}
        <div className="bg-white border border-border shadow-sm">
          {filtered.length === 0 ? (
            <div className="p-12 text-center">
              <p className="font-display text-xl text-foreground mb-2">No leads yet</p>
              <p className="font-body text-sm text-muted-foreground">
                {leads.length === 0
                  ? "Lead submissions will appear here as they come in."
                  : "Try adjusting your search or filter."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <button
                      onClick={() => toggleSort("created_at")}
                      className="flex items-center gap-1 font-body text-[10px] uppercase tracking-[2px] hover:text-foreground"
                    >
                      Date <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => toggleSort("name")}
                      className="flex items-center gap-1 font-body text-[10px] uppercase tracking-[2px] hover:text-foreground"
                    >
                      Name <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </TableHead>
                  <TableHead className="font-body text-[10px] uppercase tracking-[2px]">Contact</TableHead>
                  <TableHead>
                    <button
                      onClick={() => toggleSort("timeframe")}
                      className="flex items-center gap-1 font-body text-[10px] uppercase tracking-[2px] hover:text-foreground"
                    >
                      Timeframe <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </TableHead>
                  <TableHead className="font-body text-[10px] uppercase tracking-[2px]">Source</TableHead>
                  <TableHead className="font-body text-[10px] uppercase tracking-[2px]">Message</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((l) => (
                  <TableRow
                    key={l.id}
                    className={`cursor-pointer transition-colors ${highlightedIds.has(l.id) ? "bg-primary/10 animate-pulse" : ""}`}
                    onClick={() => setSelectedLead(l)}
                  >
                    <TableCell className="text-xs whitespace-nowrap">
                      {new Date(l.created_at).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", year: "numeric",
                      })}
                      <div className="text-[10px] text-muted-foreground">
                        {new Date(l.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{l.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5 text-xs">
                        <a
                          href={`mailto:${l.email}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          <Mail className="w-3 h-3" /> {l.email}
                        </a>
                        {l.phone && (
                          <a
                            href={`tel:${l.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                          >
                            <Phone className="w-3 h-3" /> {l.phone}
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">{l.timeframe || "—"}</TableCell>
                    <TableCell>
                      <span className="inline-block px-2 py-0.5 bg-muted text-[10px] uppercase tracking-wider rounded">
                        {l.source}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[280px] truncate">
                      {l.message || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Detail drawer */}
      <Sheet open={!!selectedLead} onOpenChange={(o) => !o && setSelectedLead(null)}>
        <SheetContent className="bg-cream overflow-y-auto sm:max-w-lg">
          {selectedLead && (
            <>
              <SheetHeader>
                <SheetTitle className="font-display text-2xl">{selectedLead.name}</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-5 font-body text-sm">
                <div>
                  <div className="text-[10px] uppercase tracking-[2px] text-muted-foreground mb-1">Submitted</div>
                  <div>{new Date(selectedLead.created_at).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-[2px] text-muted-foreground mb-1">Email</div>
                  <a href={`mailto:${selectedLead.email}`} className="text-primary hover:underline">{selectedLead.email}</a>
                </div>
                {selectedLead.phone && (
                  <div>
                    <div className="text-[10px] uppercase tracking-[2px] text-muted-foreground mb-1">Phone</div>
                    <a href={`tel:${selectedLead.phone}`} className="text-primary hover:underline">{selectedLead.phone}</a>
                  </div>
                )}
                {selectedLead.timeframe && (
                  <div>
                    <div className="text-[10px] uppercase tracking-[2px] text-muted-foreground mb-1">Timeframe</div>
                    <div>{selectedLead.timeframe}</div>
                  </div>
                )}
                <div>
                  <div className="text-[10px] uppercase tracking-[2px] text-muted-foreground mb-1">Source</div>
                  <div>{selectedLead.source}</div>
                </div>
                {selectedLead.message && (
                  <div>
                    <div className="text-[10px] uppercase tracking-[2px] text-muted-foreground mb-1">Message</div>
                    <div className="whitespace-pre-wrap bg-white border border-border p-3 rounded text-xs">
                      {selectedLead.message}
                    </div>
                  </div>
                )}
                {selectedLead.referrer && (
                  <div>
                    <div className="text-[10px] uppercase tracking-[2px] text-muted-foreground mb-1">Referrer</div>
                    <div className="text-xs break-all">{selectedLead.referrer}</div>
                  </div>
                )}
                {selectedLead.metadata && (
                  <div>
                    <div className="text-[10px] uppercase tracking-[2px] text-muted-foreground mb-1">Metadata</div>
                    <pre className="whitespace-pre-wrap bg-white border border-border p-3 rounded text-[11px] overflow-x-auto">
                      {JSON.stringify(selectedLead.metadata, null, 2)}
                    </pre>
                  </div>
                )}
                {selectedLead.user_agent && (
                  <div>
                    <div className="text-[10px] uppercase tracking-[2px] text-muted-foreground mb-1">User Agent</div>
                    <div className="text-[11px] text-muted-foreground break-all">{selectedLead.user_agent}</div>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

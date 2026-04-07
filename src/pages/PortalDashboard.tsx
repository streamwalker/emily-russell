import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Home, FileText, Phone, Shield, BookOpen, Star, Users, ArrowRight } from "lucide-react";

const PortalDashboard = () => {
  const [userName, setUserName] = useState("");
  const [hasDossier, setHasDossier] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/portal/login"); return; }
      const { data: profile } = await supabase.from("profiles").select("full_name").eq("user_id", user.id).maybeSingle();
      setUserName(profile?.full_name || user.email || "");
      const { count } = await supabase.from("client_dossiers").select("id", { count: "exact", head: true }).eq("user_id", user.id);
      setHasDossier((count ?? 0) > 0);
      setLoading(false);
    };
    load();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/portal/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-primary font-body text-lg">Loading…</div>
      </div>
    );
  }

  return (
    <div className="font-body min-h-screen bg-background text-foreground">
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)" }} className="text-white px-6 py-10">
        <div className="max-w-[900px] mx-auto">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[10px] tracking-[3px] uppercase opacity-45 mb-1.5">Emily Russell · Fathom Realty · TREC #791742</div>
              <h1 className="font-display text-3xl font-bold mb-1">Welcome{userName ? `, ${userName.split(" ")[0]}` : ""}</h1>
              <p className="text-sm opacity-60">Your personalized real estate portal</p>
            </div>
            <button onClick={handleLogout} className="font-body text-[11px] uppercase tracking-[2px] cursor-pointer bg-transparent border border-white/30 text-white/70 px-4 py-2 hover:text-white hover:border-white/60 transition-colors">
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[900px] mx-auto px-6 py-8 space-y-10">

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {hasDossier && (
            <Link to="/portal" className="group flex items-center gap-3 p-5 bg-card border border-border hover:border-primary transition-colors no-underline">
              <Home className="w-5 h-5 text-primary shrink-0" />
              <div>
                <div className="font-display text-sm font-semibold text-foreground group-hover:text-primary transition-colors">Property Dossier</div>
                <div className="text-xs text-muted-foreground">View your curated properties</div>
              </div>
              <ArrowRight className="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>
          )}
          <Link to="/portal/agreement" className="group flex items-center gap-3 p-5 bg-card border border-border hover:border-primary transition-colors no-underline">
            <FileText className="w-5 h-5 text-primary shrink-0" />
            <div>
              <div className="font-display text-sm font-semibold text-foreground group-hover:text-primary transition-colors">Buyer Rep Agreement</div>
              <div className="text-xs text-muted-foreground">Sign digitally</div>
            </div>
            <ArrowRight className="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary transition-colors" />
          </Link>
          <a href="tel:+12109120806" className="group flex items-center gap-3 p-5 bg-card border border-border hover:border-primary transition-colors no-underline">
            <Phone className="w-5 h-5 text-primary shrink-0" />
            <div>
              <div className="font-display text-sm font-semibold text-foreground group-hover:text-primary transition-colors">Contact Emily</div>
              <div className="text-xs text-muted-foreground">(210) 912-0806</div>
            </div>
            <ArrowRight className="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary transition-colors" />
          </a>
        </div>

        {/* Why Use a REALTOR for New Construction */}
        <section>
          <h2 className="font-display text-xl font-semibold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" /> Why Use a REALTOR for New Construction?
          </h2>
          <div className="bg-card border border-border p-6 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>Many buyers assume they don't need a REALTOR when purchasing new construction — but the builder's on-site sales agents work for the <strong className="text-foreground">builder</strong>, not you. Here's what a REALTOR brings to your side:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><strong className="text-foreground">Negotiation power.</strong> A REALTOR negotiates upgrades, incentives, closing cost credits, and pricing — things builder agents won't offer unless pushed.</li>
              <li><strong className="text-foreground">Contract review & protection.</strong> Builder contracts are written in the builder's favor. Your REALTOR reviews every clause, flags risks, and ensures your interests are protected.</li>
              <li><strong className="text-foreground">Independent inspections.</strong> Your REALTOR ensures proper phased inspections (pre-pour, pre-drywall, final) — catching issues the builder's quality team may overlook.</li>
              <li><strong className="text-foreground">No extra cost.</strong> The builder's commission budget already accounts for a buyer's agent. Using a REALTOR typically costs you nothing extra — but not using one means you're leaving protection on the table.</li>
              <li><strong className="text-foreground">Market knowledge.</strong> Your REALTOR compares communities, builders, floor plans, and pricing across the entire market — not just one builder's inventory.</li>
            </ul>
          </div>
        </section>

        {/* Why Emily Russell */}
        <section>
          <h2 className="font-display text-xl font-semibold mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-primary" /> Why Emily Russell?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { title: "New Construction Specialist", desc: "Through her NuBuild partnership, Emily specializes exclusively in new construction across the San Antonio metro — from master-planned communities to custom-build lots." },
              { title: "Personalized Property Dossiers", desc: "Every client receives a custom-curated dossier with property analysis, expense breakdowns, payment estimates, and side-by-side comparisons — all in this portal." },
              { title: "Local Market Expertise", desc: "Deep knowledge of San Antonio's builders, communities, school districts, tax rates, and HOAs means Emily matches you with the right home in the right neighborhood." },
              { title: "Dedicated Client Portal", desc: "This isn't a generic MLS search. Your portal is built specifically for you — with ranked properties, investment analysis, and tools no other agent provides." },
            ].map((item) => (
              <div key={item.title} className="bg-card border border-border p-5">
                <div className="font-display text-sm font-semibold text-foreground mb-1">{item.title}</div>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How to Navigate */}
        <section>
          <h2 className="font-display text-xl font-semibold mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" /> How to Navigate Your Portal
          </h2>
          <div className="bg-card border border-border p-6 space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>Once your property dossier is ready, here's what you'll find:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><strong className="text-foreground">Tabbed Builder Views</strong> — Properties organized by builder, each with detailed specs, pricing, and Emily's agent notes.</li>
              <li><strong className="text-foreground">All Homes Tab</strong> — A combined view to filter, sort, and compare every property in your dossier at once.</li>
              <li><strong className="text-foreground">Payment Estimator</strong> — Adjust price, down payment, rate, taxes, insurance, and HOA to see your estimated monthly cost for any property.</li>
              <li><strong className="text-foreground">Comparison Tool</strong> — Select properties and compare them side-by-side on specs, costs, and rankings.</li>
              <li><strong className="text-foreground">Expense Breakdown</strong> — See itemized monthly costs including PITI, HOA, utilities, and maintenance estimates.</li>
              <li><strong className="text-foreground">Ranking System</strong> — Properties are scored on affordability, value, space, and investment potential to help you prioritize.</li>
            </ul>
          </div>
        </section>

        {/* Access Notice */}
        <section>
          <div className="flex items-start gap-4 bg-card border border-primary/30 p-6">
            <Users className="w-6 h-6 text-primary shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground leading-relaxed">
              <p className="font-display text-foreground font-semibold mb-2">Portal Access</p>
              <p>This portal is exclusively available to registered clients who have an active <strong className="text-foreground">Buyer Representation Agreement</strong> with Emily Russell. Your agreement ensures dedicated representation, confidentiality, and access to Emily's full suite of tools and expertise.</p>
              <Link to="/portal/agreement" className="inline-flex items-center gap-1 text-primary hover:underline mt-2 font-medium text-xs">
                Sign your Buyer Rep Agreement <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default PortalDashboard;

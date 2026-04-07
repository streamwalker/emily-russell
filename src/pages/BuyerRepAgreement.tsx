import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { CalendarIcon, ArrowLeft, Download, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import SignaturePad from "@/components/portal/SignaturePad";
import { toast } from "sonner";
import { useAdminCheck } from "@/hooks/useAdminCheck";

const BROKER = {
  name: "Fathom Realty",
  associate: "Emily Russell",
  address: "Virtual Office — San Antonio, TX",
  phone: "(210) 912-0806",
  email: "emily@streamwalkers.com",
  license: "791742",
};

const BuyerRepAgreement = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const [userId, setUserId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [configLoaded, setConfigLoaded] = useState(false);

  // Admin: client selector
  const [clients, setClients] = useState<{ user_id: string; full_name: string | null; email: string }[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  // Client fields
  const [clientName, setClientName] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [clientCityStateZip, setClientCityStateZip] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [marketArea, setMarketArea] = useState("San Antonio Metro & Surrounding Areas");
  const [termStart, setTermStart] = useState<Date | undefined>(new Date());
  const [termEnd, setTermEnd] = useState<Date | undefined>(undefined);
  const [brokerFeePct, setBrokerFeePct] = useState("3.0");
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [signatureType, setSignatureType] = useState<"draw" | "typed">("draw");

  // Initials
  const [clientInitials, setClientInitials] = useState("");
  const [client2Initials, setClient2Initials] = useState("");

  // Second client
  const [hasSecondClient, setHasSecondClient] = useState(false);
  const [client2Name, setClient2Name] = useState("");
  const [signature2Data, setSignature2Data] = useState<string | null>(null);
  const [signature2Type, setSignature2Type] = useState<"draw" | "typed">("draw");

  // Load user + admin client list
  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/portal/login"); return; }
      setUserId(user.id);
      setClientEmail(user.email || "");
      const { data: profile } = await supabase.from("profiles").select("full_name").eq("user_id", user.id).maybeSingle();
      if (profile?.full_name) setClientName(profile.full_name);
    };
    check();
  }, [navigate]);

  // Admin: load client list
  useEffect(() => {
    if (!isAdmin || adminLoading) return;
    const loadClients = async () => {
      const { data } = await supabase.from("profiles").select("user_id, full_name, email");
      if (data) setClients(data);
    };
    loadClients();
  }, [isAdmin, adminLoading]);

  // Load agreement_config for the relevant user
  useEffect(() => {
    const targetUserId = isAdmin ? selectedClientId : userId;
    if (!targetUserId || adminLoading) return;

    const loadConfig = async () => {
      const { data } = await supabase
        .from("agreement_config")
        .select("term_end, broker_fee_pct")
        .eq("client_user_id", targetUserId)
        .maybeSingle();

      if (data) {
        if (data.term_end) setTermEnd(new Date(data.term_end + "T00:00:00"));
        if (data.broker_fee_pct !== null) setBrokerFeePct(String(data.broker_fee_pct));
      }
      setConfigLoaded(true);
    };
    loadConfig();
  }, [isAdmin, adminLoading, userId, selectedClientId]);

  // Admin: save config for selected client
  const handleSaveConfig = async () => {
    if (!selectedClientId || !isAdmin) return;
    const { error } = await supabase.from("agreement_config").upsert({
      client_user_id: selectedClientId,
      term_end: termEnd ? format(termEnd, "yyyy-MM-dd") : null,
      broker_fee_pct: parseFloat(brokerFeePct) || 3.0,
      updated_by: userId,
    }, { onConflict: "client_user_id" });

    if (error) {
      toast.error("Failed to save agreement settings.");
    } else {
      toast.success("Agreement settings saved for this client.");
    }
  };

  const handleSignatureChange = useCallback((dataUrl: string | null, type: "draw" | "typed") => {
    setSignatureData(dataUrl);
    setSignatureType(type);
  }, []);

  const handleSignature2Change = useCallback((dataUrl: string | null, type: "draw" | "typed") => {
    setSignature2Data(dataUrl);
    setSignature2Type(type);
  }, []);

  const handleSubmit = async () => {
    if (!clientName.trim()) { toast.error("Please enter your full name."); return; }
    if (!clientInitials.trim()) { toast.error("Please enter your initials."); return; }
    if (hasSecondClient && !client2Initials.trim()) { toast.error("Please enter the second client's initials."); return; }
    if (!signatureData) { toast.error("Please provide your signature."); return; }
    if (!termEnd) { toast.error("Please select an agreement end date."); return; }
    if (!userId) return;

    setSaving(true);
    const formData = {
      clientName, clientAddress, clientCityStateZip, clientPhone, clientEmail,
      marketArea, termStart: termStart ? format(termStart, "yyyy-MM-dd") : null,
      termEnd: format(termEnd, "yyyy-MM-dd"), brokerFeePct,
      broker: BROKER, clientInitials,
      secondClient: hasSecondClient ? { name: client2Name, signatureData: signature2Data, signatureType: signature2Type, initials: client2Initials } : null,
    };

    const { error } = await supabase.from("signed_agreements").insert({
      user_id: userId,
      client_name: clientName,
      client_address: clientAddress,
      client_city_state_zip: clientCityStateZip,
      client_phone: clientPhone,
      client_email: clientEmail,
      market_area: marketArea,
      term_start: termStart ? format(termStart, "yyyy-MM-dd") : null,
      term_end: format(termEnd, "yyyy-MM-dd"),
      broker_fee_pct: parseFloat(brokerFeePct) || 3.0,
      signature_data: signatureData,
      signature_type: signatureType,
      form_data: formData as any,
    });

    if (error) {
      toast.error("Failed to save agreement. Please try again.");
      setSaving(false);
      return;
    }

    toast.success("Agreement signed and saved successfully!");
    setSaved(true);
    setSaving(false);
  };

  const handleDownloadPdf = async () => {
    if (pdfBlobUrl) {
      const a = document.createElement("a");
      a.href = pdfBlobUrl;
      a.download = "TXR-1501-Signed.pdf";
      a.click();
      return;
    }
    setGeneratingPdf(true);
    try {
      const formPayload = {
        clientName, clientAddress, clientCityStateZip, clientPhone, clientEmail,
        marketArea, termStart: termStart ? format(termStart, "yyyy-MM-dd") : "",
        termEnd: termEnd ? format(termEnd, "yyyy-MM-dd") : "",
        brokerFeePct, signatureData, broker: BROKER, clientInitials,
        client2Initials: hasSecondClient ? client2Initials : "",
        secondClient: hasSecondClient ? { name: client2Name, signatureData: signature2Data, signatureType: signature2Type, initials: client2Initials } : null,
      };
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const resp = await fetch(`https://${projectId}.supabase.co/functions/v1/generate-agreement-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}` },
        body: JSON.stringify(formPayload),
      });
      if (!resp.ok) throw new Error("PDF generation failed");
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      setPdfBlobUrl(url);
      const a = document.createElement("a");
      a.href = url;
      a.download = "TXR-1501-Signed.pdf";
      a.click();
    } catch {
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setGeneratingPdf(false);
    }
  };

  const inputClass = "w-full px-3 py-2 border border-border bg-white text-foreground font-body text-sm focus:outline-none focus:border-primary";
  const labelClass = "block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1";
  const sectionClass = "bg-card border border-border p-6 space-y-4";
  const headingClass = "font-display text-lg font-semibold text-foreground";
  const legalClass = "text-xs text-muted-foreground leading-relaxed";

  return (
    <div className="font-body min-h-screen bg-background text-foreground">
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)" }} className="text-white px-6 py-6 print:hidden">
        <div className="max-w-[800px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/portal/dashboard" className="text-white/60 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="text-[10px] tracking-[3px] uppercase opacity-45">Texas REALTORS® Form TXR-1501</div>
              <h1 className="font-display text-xl font-bold">Buyer Representation Agreement</h1>
            </div>
          </div>
          {saved && (
            <button onClick={handleDownloadPdf} disabled={generatingPdf} className="flex items-center gap-2 text-[11px] uppercase tracking-[2px] border border-white/30 text-white/70 px-4 py-2 hover:text-white hover:border-white/60 transition-colors bg-transparent cursor-pointer disabled:opacity-50">
              <Download className="w-3.5 h-3.5" /> {generatingPdf ? "Generating…" : "Download PDF"}
            </button>
          )}
        </div>
      </div>

      <div className="max-w-[800px] mx-auto px-6 py-8 space-y-6">
        {saved ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 text-green-600 rounded-full mb-4">
              <Check className="w-8 h-8" />
            </div>
            <h2 className="font-display text-2xl font-semibold mb-2">Agreement Signed</h2>
            <p className="text-sm text-muted-foreground mb-6">Your Buyer Representation Agreement has been saved. Download your signed PDF copy for your records.</p>
            <div className="flex items-center justify-center gap-3">
              <button onClick={handleDownloadPdf} disabled={generatingPdf} className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground font-body text-xs uppercase tracking-wider hover:opacity-90 transition-opacity cursor-pointer border-0 disabled:opacity-50">
                <Download className="w-3.5 h-3.5" /> {generatingPdf ? "Generating…" : "Download PDF"}
              </button>
              <Link to="/portal/dashboard" className="px-6 py-2.5 border border-border text-foreground font-body text-xs uppercase tracking-wider hover:border-primary transition-colors no-underline">
                Back to Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Admin: client selector */}
            {isAdmin && (
              <div className="bg-accent/30 border border-accent p-4 space-y-3">
                <div className="text-xs font-semibold text-primary uppercase tracking-wider">Agent Controls</div>
                <div>
                  <label className={labelClass}>Select Client</label>
                  <select
                    className={cn(inputClass, "cursor-pointer")}
                    value={selectedClientId || ""}
                    onChange={e => setSelectedClientId(e.target.value || null)}
                  >
                    <option value="">— Choose a client —</option>
                    {clients.map(c => (
                      <option key={c.user_id} value={c.user_id}>
                        {c.full_name || c.email} ({c.email})
                      </option>
                    ))}
                  </select>
                </div>
                {selectedClientId && (
                  <button
                    onClick={handleSaveConfig}
                    className="px-4 py-2 bg-primary text-primary-foreground text-xs uppercase tracking-wider hover:opacity-90 transition-opacity cursor-pointer border-0"
                  >
                    Save End Date & Fee for Client
                  </button>
                )}
              </div>
            )}

            {/* Non-admin: show message if config not set */}
            {!isAdmin && configLoaded && !termEnd && (
              <div className="bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
                Your agent needs to configure the agreement terms (end date and commission) before you can sign. Please contact your agent.
              </div>
            )}

            {/* Form Title for print */}
            <div className="hidden print:block text-center mb-8">
              <div className="text-xs tracking-wider uppercase mb-1">TEXAS REALTORS®</div>
              <h1 className="font-display text-xl font-bold">Residential Buyer/Tenant Representation Agreement</h1>
              <p className="text-[10px] text-muted-foreground">TXR-1501 · ©Texas Association of REALTORS®, Inc. 2024</p>
            </div>

            {/* Section 1 — Parties */}
            <div className={sectionClass}>
              <h2 className={headingClass}>1. Parties</h2>
              <p className={legalClass}>The parties to this agreement are:</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-primary uppercase tracking-wider">Client Information</div>
                  <div>
                    <label className={labelClass}>Full Name</label>
                    <input className={inputClass} value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Full legal name" />
                  </div>
                  <div>
                    <label className={labelClass}>Address</label>
                    <input className={inputClass} value={clientAddress} onChange={e => setClientAddress(e.target.value)} placeholder="Street address" />
                  </div>
                  <div>
                    <label className={labelClass}>City, State, Zip</label>
                    <input className={inputClass} value={clientCityStateZip} onChange={e => setClientCityStateZip(e.target.value)} placeholder="City, TX 78xxx" />
                  </div>
                  <div>
                    <label className={labelClass}>Phone</label>
                    <input className={inputClass} value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="(xxx) xxx-xxxx" />
                  </div>
                  <div>
                    <label className={labelClass}>Email</label>
                    <input className={inputClass} value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="email@example.com" />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-primary uppercase tracking-wider">Broker Information (Pre-filled)</div>
                  {[
                    ["Broker", BROKER.name],
                    ["Associate", BROKER.associate],
                    ["Address", BROKER.address],
                    ["Phone", BROKER.phone],
                    ["Email", BROKER.email],
                    ["License No.", BROKER.license],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <label className={labelClass}>{label}</label>
                      <div className="px-3 py-2 bg-muted text-foreground text-sm border border-border">{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Section 2 — Appointment */}
            <div className={sectionClass}>
              <h2 className={headingClass}>2. Appointment</h2>
              <p className={legalClass}>Client grants Broker the exclusive right to act as Client's real estate agent for the purpose of acquiring property in the market area.</p>
            </div>

            {/* Section 3 — Definitions */}
            <div className={sectionClass}>
              <h2 className={headingClass}>3. Definitions</h2>
              <div className={legalClass + " space-y-2"}>
                <p><strong>A. "Acquire"</strong> means to purchase or lease.</p>
                <p><strong>B. "Closing"</strong> in a sale transaction means the date legal title to a property is conveyed to a purchaser of property under a contract to buy. "Closing" in a lease transaction means the date a landlord and tenant enter into a binding lease of a property.</p>
                <p><strong>C. "Market area"</strong> means that area in the State of Texas specified as follows:</p>
              </div>
              <div>
                <label className={labelClass}>Market Area</label>
                <input className={inputClass} value={marketArea} onChange={e => setMarketArea(e.target.value)} placeholder="e.g., San Antonio Metro" />
              </div>
              <p className={legalClass}><strong>D. "Property"</strong> means any interest in real estate including but not limited to properties listed in a multiple listing service or other listing services, properties for sale by owners, and properties for sale by builders.</p>
            </div>

            {/* Section 4 — Term */}
            <div className={sectionClass}>
              <h2 className={headingClass}>4. Term</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Start Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className={cn(inputClass, "flex items-center justify-between cursor-pointer", !termStart && "text-muted-foreground")}>
                        {termStart ? format(termStart, "PPP") : "Select start date"}
                        <CalendarIcon className="w-4 h-4 opacity-50" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={termStart} onSelect={setTermStart} initialFocus className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <label className={labelClass}>End Date {!isAdmin && <span className="text-muted-foreground normal-case tracking-normal font-normal">(set by your agent)</span>}</label>
                  {isAdmin ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className={cn(inputClass, "flex items-center justify-between cursor-pointer", !termEnd && "text-muted-foreground")}>
                          {termEnd ? format(termEnd, "PPP") : "Select end date"}
                          <CalendarIcon className="w-4 h-4 opacity-50" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={termEnd} onSelect={setTermEnd} initialFocus className="p-3 pointer-events-auto" />
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <div className="px-3 py-2 bg-muted text-foreground text-sm border border-border">
                      {termEnd ? format(termEnd, "PPP") : <span className="text-muted-foreground italic">Pending — your agent will configure this</span>}
                    </div>
                  )}
                </div>
              </div>
              <p className={legalClass}>This agreement begins on the start date and ends at 11:59 p.m. on the end date.</p>
            </div>

            {/* Section 5 — Broker's Obligations */}
            <div className={sectionClass}>
              <h2 className={headingClass}>5. Broker's Obligations</h2>
              <p className={legalClass}>Broker will: (a) use Broker's best efforts to assist Client in acquiring property in the market area; (b) assist Client in negotiating the acquisition of property in the market area; and (c) comply with other provisions of this agreement.</p>
            </div>

            {/* Section 6 — Client's Obligations */}
            <div className={sectionClass}>
              <h2 className={headingClass}>6. Client's Obligations</h2>
              <p className={legalClass}>Client will: (a) work exclusively through Broker in acquiring property in the market area and negotiate the acquisition of property in the market area only through Broker; (b) inform other brokers, salespersons, sellers, and landlords with whom Client may have contact that Broker exclusively represents Client for the purpose of acquiring property in the market area and refer all such persons to Broker; and (c) comply with other provisions of this agreement.</p>
            </div>

            {/* Section 7 — Broker Compensation */}
            <div className={sectionClass}>
              <h2 className={headingClass}>7. Broker Compensation</h2>
              <p className={legalClass}>Broker compensation or the sharing of compensation between brokers is not set by law nor fixed, controlled, recommended, or suggested, by the Association of REALTORS®, MLS, or any listing service. Broker compensation is fully negotiable.</p>
              <div className="mt-3">
                <label className={labelClass}>Broker's Fee (% of sales price) {!isAdmin && <span className="text-muted-foreground normal-case tracking-normal font-normal">(set by your agent)</span>}</label>
                {isAdmin ? (
                  <input type="text" className={cn(inputClass, "w-32")} value={brokerFeePct} onChange={e => setBrokerFeePct(e.target.value)} />
                ) : (
                  <div className="px-3 py-2 bg-muted text-foreground text-sm border border-border w-32">
                    {brokerFeePct}%
                  </div>
                )}
              </div>
              <div className={legalClass + " space-y-2 mt-3"}>
                <p><strong>B. Source of Compensation:</strong> Broker will seek to obtain payment of the fees specified first from the seller, landlord, or their agents. If such persons refuse or fail to pay Broker the amount specified, Client will pay Broker the amount specified less any amounts Broker receives from such persons.</p>
                <p><strong>C. Earned and Payable:</strong> Broker's compensation is Earned when: (1) Client enters into a contract to buy or lease property in the market area; or (2) Client breaches this agreement. Broker's compensation is Payable upon the earlier of: (1) the closing of the transaction; (2) Client's breach of a contract to buy or lease; or (3) Client's breach of this agreement.</p>
                <p><strong>D. Acquisition of Broker's Listing:</strong> If Client acquires a property listed by Broker, any compensation Broker offers to other brokers will be credited towards Broker's Fee.</p>
                <p><strong>E. Additional Compensation:</strong> If Broker refers Client to a service provider, Broker may receive a fee from the service provider for the referral. Broker will disclose any bonus or other compensation offered by seller, landlord, or their agent.</p>
                <p><strong>F. Protection Period:</strong> "Protection period" means that time starting the day after this agreement ends and continuing for 10 days. If Client acquires a property identified in Broker's notice during the protection period, Client will pay Broker the amount Broker would have been entitled to receive.</p>
              </div>
            </div>

            {/* Sections 8-17 (display-only legal text) */}
            {[
              { num: 8, title: "Representations", text: "A. Each person signing this agreement represents that the person has the legal capacity and authority to bind the respective party.\n\nB. Client represents that Client is not now a party to another buyer or tenant representation agreement with another broker for the acquisition of property in the market area.\n\nC. Client represents that all information relating to Client's ability to acquire property in the market area Client gives to Broker is true and correct.\n\nE. Broker is not authorized to execute any document in the name of or on behalf of Client concerning the Property." },
              { num: 9, title: "Intermediary", text: "Client desires to see Broker's listings. If Client wishes to acquire one of Broker's listings, Client authorizes Broker to act as an intermediary and Broker will notify Client that Broker will service the parties in accordance with applicable alternatives. If Broker acts as an intermediary, Broker and Broker's associates: may not disclose to Client that the seller will accept a price less than the asking price unless otherwise instructed; may not disclose to the seller that Client will pay a price greater than the price submitted; may not disclose any confidential information; shall treat all parties honestly; and shall comply with the Real Estate License Act." },
              { num: 10, title: "Competing Clients", text: "Client acknowledges that Broker may represent other prospective buyers or tenants who may seek to acquire properties that may be of interest to Client. Client agrees that Broker may represent such other prospects, show them the same properties, and act as a real estate broker for such other prospects." },
              { num: 11, title: "Confidential Information", text: "During the term of this agreement or after its termination, Broker may not knowingly disclose information obtained in confidence from Client except as authorized by Client or required by law." },
              { num: 12, title: "Mediation", text: "The parties agree to negotiate in good faith in an effort to resolve any dispute. If the dispute cannot be resolved by negotiation, the parties will submit the dispute to mediation before resorting to arbitration or litigation and will equally share the costs of a mutually acceptable mediator." },
              { num: 13, title: "Default", text: "If either party fails to comply with this agreement, the non-complying party is in default. If Client is in default, Broker may terminate this agreement and Client will be liable for the amount of compensation Broker would have received. If Broker is in default, Client may exercise any remedy at law." },
              { num: 14, title: "Attorney's Fees", text: "If Client or Broker is a prevailing party in any legal proceeding brought as a result of a dispute under this agreement, such party will be entitled to recover from the non-prevailing party all costs and reasonable attorney's fees." },
              { num: 15, title: "Limitation of Liability", text: "Neither Broker nor any other broker, or their associates, is responsible or liable for any person's personal injuries or for any loss or damage to any person's property that is not caused by Broker. Client will indemnify Broker against any claims for injury or damage." },
              { num: 16, title: "Addenda", text: "Addenda and other related documents which are part of this agreement include: Information About Brokerage Services, General Information and Notice to Buyers and Sellers, Wire Fraud Warning, and other applicable disclosures." },
              { num: 17, title: "Special Provisions", text: "None." },
            ].map(s => (
              <div key={s.num} className={sectionClass}>
                <h2 className={headingClass}>{s.num}. {s.title}</h2>
                <p className={legalClass} style={{ whiteSpace: "pre-line" }}>{s.text}</p>
              </div>
            ))}

            {/* Section 18 — Additional Notices */}
            <div className={sectionClass}>
              <h2 className={headingClass}>18. Additional Notices</h2>
              <div className={legalClass + " space-y-2"}>
                <p>A. In accordance with fair housing laws and the National Association of REALTORS® Code of Ethics, Broker's services must be provided without regard to race, color, religion, national origin, sex, disability, familial status, sexual orientation, or gender identity.</p>
                <p>B. Broker is not a property inspector, pest inspector, appraiser, surveyor, engineer, environmental assessor, or compliance inspector. Client should seek experts to render such services.</p>
                <p>C. If Client purchases property, Client should have an abstract examined by an attorney or obtain a title policy.</p>
                <p>D. Client may purchase a residential service contract. The purchase is optional.</p>
                <p>E. When viewing a property, Client might be recorded or monitored without Client's knowledge or consent.</p>
                <p>F. To reduce risk of wire fraud, Client should verify the authenticity of any request to wire funds.</p>
              </div>
            </div>

            {/* Legal Notice */}
            <div className="bg-destructive/5 border border-destructive/20 p-5">
              <p className="text-xs text-destructive font-medium leading-relaxed">
                CONSULT AN ATTORNEY: Broker cannot give legal advice. This is a legally binding agreement. READ IT CAREFULLY. If you do not understand the effect of this agreement, consult your attorney BEFORE signing.
              </p>
            </div>

            {/* Signature Block */}
            <div className={sectionClass}>
              <h2 className={headingClass}>Signature</h2>

              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Client's Printed Name</label>
                  <div className="px-3 py-2 bg-muted text-foreground text-sm border border-border">{clientName || "—"}</div>
                </div>
                <div>
                  <label className={labelClass}>Date</label>
                  <div className="px-3 py-2 bg-muted text-foreground text-sm border border-border">{format(new Date(), "MMMM d, yyyy")}</div>
                </div>
                <div>
                  <label className={labelClass}>Your Initials (for page footers)</label>
                  <input
                    className={cn(inputClass, "w-24 text-center text-lg font-semibold uppercase tracking-widest")}
                    value={clientInitials}
                    onChange={e => setClientInitials(e.target.value.toUpperCase().slice(0, 4))}
                    placeholder="e.g. JD"
                    maxLength={4}
                  />
                </div>
                <div>
                  <label className={labelClass}>Client's Signature</label>
                  <SignaturePad onSignatureChange={handleSignatureChange} />
                </div>
              </div>

              {/* Second Client */}
              <div className="mt-6 pt-6 border-t border-border">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground">
                  <input type="checkbox" checked={hasSecondClient} onChange={e => setHasSecondClient(e.target.checked)} className="accent-primary" />
                  Add a second client/signer
                </label>
                {hasSecondClient && (
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className={labelClass}>Second Client's Printed Name</label>
                      <input className={inputClass} value={client2Name} onChange={e => setClient2Name(e.target.value)} placeholder="Full legal name" />
                    </div>
                    <div>
                      <label className={labelClass}>Second Client's Initials</label>
                      <input
                        className={cn(inputClass, "w-24 text-center text-lg font-semibold uppercase tracking-widest")}
                        value={client2Initials}
                        onChange={e => setClient2Initials(e.target.value.toUpperCase().slice(0, 4))}
                        placeholder="e.g. JS"
                        maxLength={4}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Second Client's Signature</label>
                      <SignaturePad onSignatureChange={handleSignature2Change} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Submit */}
            <div className="flex items-center justify-between print:hidden">
              <Link to="/portal/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors no-underline">
                ← Back to Dashboard
              </Link>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-8 py-3 bg-primary text-primary-foreground font-body text-xs uppercase tracking-wider hover:opacity-90 transition-opacity cursor-pointer border-0 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Sign Agreement"}
              </button>
            </div>
          </>
        )}
      </div>

    </div>
  );
};

export default BuyerRepAgreement;

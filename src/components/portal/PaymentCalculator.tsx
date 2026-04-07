import { useState, useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { ExternalLink, Save, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PaymentCalculatorProps {
  price: number;
  hoaFee?: number;
  propertyId?: string;
  userId?: string;
}

function calcPI(loanAmount: number, annualRate: number, years = 30): number {
  if (loanAmount <= 0 || annualRate <= 0) return 0;
  const r = annualRate / 100 / 12;
  const n = years * 12;
  return loanAmount * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

export default function PaymentCalculator({ price, hoaFee = 0, propertyId, userId }: PaymentCalculatorProps) {
  const [offerPrice, setOfferPrice] = useState(price);
  const [downPct, setDownPct] = useState(20);
  const [rate, setRate] = useState(6.5);
  const [taxRate, setTaxRate] = useState(2.2);
  const [insurance, setInsurance] = useState(150);
  const [hoa, setHoa] = useState(hoaFee);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Load saved estimate
  useEffect(() => {
    if (!propertyId || !userId || loaded) return;
    const load = async () => {
      const { data } = await supabase
        .from("saved_estimates")
        .select("*")
        .eq("user_id", userId)
        .eq("property_id", propertyId)
        .maybeSingle();
      if (data) {
        setOfferPrice(Number(data.offer_price));
        setDownPct(Number(data.down_pct));
        setRate(Number(data.rate));
        setTaxRate(Number(data.tax_rate));
        setInsurance(Number(data.insurance));
        setHoa(Number(data.hoa));
      }
      setLoaded(true);
    };
    load();
  }, [propertyId, userId, loaded]);

  const handleSave = async () => {
    if (!propertyId || !userId) return;
    setSaving(true);
    await supabase.from("saved_estimates").upsert(
      {
        user_id: userId,
        property_id: propertyId,
        offer_price: offerPrice,
        down_pct: downPct,
        rate,
        tax_rate: taxRate,
        insurance,
        hoa,
      },
      { onConflict: "user_id,property_id" }
    );
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const downAmt = Math.round(offerPrice * downPct / 100);
  const loanAmount = offerPrice - downAmt;

  const monthly = useMemo(() => {
    const pi = calcPI(loanAmount, rate);
    const taxes = (offerPrice * taxRate / 100) / 12;
    return Math.round(pi + taxes + insurance + hoa);
  }, [loanAmount, rate, offerPrice, taxRate, insurance, hoa]);

  const pi = useMemo(() => Math.round(calcPI(loanAmount, rate)), [loanAmount, rate]);

  const handleDownPct = (v: number) => {
    setDownPct(Math.min(100, Math.max(0, v)));
  };

  const handleDownAmt = (v: number) => {
    const pct = offerPrice > 0 ? (v / offerPrice) * 100 : 0;
    setDownPct(Math.min(100, Math.max(0, Math.round(pct * 10) / 10)));
  };

  return (
    <div className="mt-3 p-3.5 rounded border border-border bg-muted/30">
      <div className="text-[9px] uppercase tracking-[2px] text-muted-foreground mb-3 font-body font-semibold">
        Payment Estimator
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        {/* Offer Price */}
        <div>
          <label className="text-[10px] text-muted-foreground font-body block mb-1">Offer Price</label>
          <Input type="number" value={offerPrice} onChange={e => setOfferPrice(Number(e.target.value) || 0)} className="h-8 text-xs font-body" />
        </div>

        {/* Interest Rate */}
        <div>
          <label className="text-[10px] text-muted-foreground font-body block mb-1">Interest Rate %</label>
          <div className="flex items-center gap-2">
            <Slider value={[rate]} onValueChange={([v]) => setRate(Math.round(v * 100) / 100)} min={2} max={12} step={0.125} className="flex-1" />
            <Input type="number" value={rate} onChange={e => setRate(Number(e.target.value) || 0)} className="h-8 text-xs font-body w-16" step={0.125} />
          </div>
        </div>

        {/* Down Payment % */}
        <div>
          <label className="text-[10px] text-muted-foreground font-body block mb-1">Down Payment %</label>
          <div className="flex items-center gap-2">
            <Slider value={[downPct]} onValueChange={([v]) => handleDownPct(Math.round(v * 10) / 10)} min={0} max={100} step={0.5} className="flex-1" />
            <Input type="number" value={downPct} onChange={e => handleDownPct(Number(e.target.value) || 0)} className="h-8 text-xs font-body w-16" step={0.5} />
          </div>
        </div>

        {/* Down Payment $ */}
        <div>
          <label className="text-[10px] text-muted-foreground font-body block mb-1">Down Payment $</label>
          <Input type="number" value={downAmt} onChange={e => handleDownAmt(Number(e.target.value) || 0)} className="h-8 text-xs font-body" />
        </div>

        {/* Tax Rate */}
        <div>
          <label className="text-[10px] text-muted-foreground font-body block mb-1">Annual Tax Rate %</label>
          <div className="flex items-center gap-2">
            <Slider value={[taxRate]} onValueChange={([v]) => setTaxRate(Math.round(v * 100) / 100)} min={0} max={5} step={0.05} className="flex-1" />
            <Input type="number" value={taxRate} onChange={e => setTaxRate(Number(e.target.value) || 0)} className="h-8 text-xs font-body w-16" step={0.05} />
          </div>
        </div>

        {/* Insurance */}
        <div>
          <label className="text-[10px] text-muted-foreground font-body block mb-1">Monthly Insurance $</label>
          <Input type="number" value={insurance} onChange={e => setInsurance(Number(e.target.value) || 0)} className="h-8 text-xs font-body" />
        </div>

        {/* HOA */}
        <div>
          <label className="text-[10px] text-muted-foreground font-body block mb-1">Monthly HOA $</label>
          <Input type="number" value={hoa} onChange={e => setHoa(Number(e.target.value) || 0)} className="h-8 text-xs font-body" />
        </div>
      </div>

      {/* Result */}
      <div className="mt-4 p-3 rounded bg-card border border-border">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-[9px] uppercase tracking-[2px] text-muted-foreground font-body">Est. Monthly Payment</div>
            <div className="text-xl font-bold font-display text-foreground">${monthly.toLocaleString()}</div>
          </div>
          <div className="text-right text-[11px] font-body text-muted-foreground leading-relaxed">
            <div>P&I: ${pi.toLocaleString()}</div>
            <div>Taxes: ${Math.round((offerPrice * taxRate / 100) / 12).toLocaleString()}</div>
            <div>Ins: ${insurance.toLocaleString()} · HOA: ${hoa.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Actions row */}
      <div className="flex items-center justify-between mt-3">
        <a
          href="https://equiforge.ai/try/payment"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold font-body text-primary hover:opacity-80 transition-opacity"
        >
          Advanced Calculator on EquiForge <ExternalLink className="h-3 w-3" />
        </a>

        {propertyId && userId && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold font-body text-primary hover:opacity-80 transition-opacity bg-transparent border-none cursor-pointer disabled:opacity-50"
          >
            {saved ? (
              <>
                <Check className="h-3 w-3" /> Saved ✓
              </>
            ) : (
              <>
                <Save className="h-3 w-3" /> {saving ? "Saving…" : "Save Estimate"}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

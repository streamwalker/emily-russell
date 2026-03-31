import { useState, useEffect, useRef, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import CookieConsent from "@/components/CookieConsent";
import EmilyPhoto from "@/assets/Emily_Russell.png";
import NuBuildLogo from "@/assets/nubuild_logo.png";
import FathomEHO from "@/assets/fathom_eho.png";

/* ── Lead Sync Helper ── */
async function syncLead(data: Record<string, string>) {
  try {
    const { error } = await supabase.functions.invoke("sync-lead", { body: data });
    if (error) console.error("Lead sync error:", error);
  } catch (err) {
    console.error("Lead sync failed:", err);
  }
}

/* ── Data ── */
const RECENT_SALES = [
  { addr: "242 Wild Duck", city: "San Antonio, TX 78253", beds: 4, baths: 2, sqft: "1,901", date: "Nov 2024", role: "Buyer", img: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80" },
  { addr: "17010 Eaton Terrace", city: "San Antonio, TX 78247", beds: 4, baths: 3, sqft: "2,300", date: "Feb 2024", role: "Buyer", img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80" },
  { addr: "7703 Chancery Gate", city: "San Antonio, TX 78253", beds: 3, baths: 2, sqft: "1,129", date: "Nov 2023", role: "Buyer", img: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80" },
  { addr: "7627 Parish Pl", city: "San Antonio, TX 78253", beds: 3, baths: 2.5, sqft: "1,189", date: "Nov 2023", role: "Buyer", img: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600&q=80" },
  { addr: "4210 Amos Pollard", city: "San Antonio, TX 78253", beds: 4, baths: 4, sqft: "3,684", date: "Sep 2023", role: "Buyer", img: "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=600&q=80" },
];

const NEIGHBORHOODS = [
  { name: "Alamo Ranch / 78253", desc: "Family-friendly master-planned community with top-rated schools", img: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&q=80", highlight: "Emily's Top Area" },
  { name: "Stone Oak / 78258", desc: "Upscale dining, shopping, and highly sought-after school district", img: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=600&q=80", highlight: "Hot Market" },
  { name: "Helotes / Hill Country", desc: "Hill Country charm minutes from the city — acreage and custom homes", img: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=80", highlight: "Growing Fast" },
  { name: "Boerne / Fair Oaks", desc: "Small-town Texas feel with a booming real estate market", img: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&q=80", highlight: "Hidden Gem" },
];

const REVIEWS = [
  { name: "Verified Buyer", date: "July 2023", text: "Emily was dedicated to helping me not only find, but make the right choice in home. She asked detailed questions to make sure she tailored my search, working with me to help me find exactly what I was looking for.", stars: 5, src: "Zillow" },
  { name: "Verified Referral", date: "July 2023", text: "Emily is very knowledgeable and patient. She listened and understood my friend's needs and made sure her family secured their dream home. I highly recommend her to anyone looking for a dedicated and caring agent.", stars: 5, src: "Zillow" },
];

const BLOG_POSTS = [
  { title: "Why San Antonio's 78253 Zip Code Is One of the Hottest in Texas", cat: "Neighborhood Guide", date: "Mar 2026", read: "5 min", img: "https://images.unsplash.com/photo-1531218150217-54595bc2b934?w=400&q=80" },
  { title: "First-Time Buyer in San Antonio? Here's Your Complete Checklist", cat: "Buyer Tips", date: "Mar 2026", read: "7 min", img: "https://images.unsplash.com/photo-1560520031-3a4dc4e9de0c?w=400&q=80" },
  { title: "Relocating to San Antonio: Everything You Need to Know in 2026", cat: "Relocation", date: "Feb 2026", read: "8 min", img: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&q=80" },
];

const NEW_HOME_DEALS = [
  {
    name: "Redbird Ranch",
    price: "$217,000",
    location: "Northwest San Antonio",
    features: ["Brick, stone & siding exteriors", "Top-rated Northside ISD", "Community pool & parks"],
    img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80",
    tag: "Best Value",
  },
  {
    name: "Ladera",
    price: "$349,990",
    location: "Gated Master-Planned Community",
    features: ["Coventry Homes builder", "Resort-style amenities", "Hill Country views"],
    img: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80",
    tag: "Gated Community",
  },
  {
    name: "Stillwater Ranch",
    price: "$380,000",
    location: "Northwest San Antonio",
    features: ["Resort-style pool & splash pad", "Miles of hike & bike trails", "Highly rated schools"],
    img: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80",
    tag: "Resort Living",
  },
];

const NAV_ITEMS: [string, string][] = [["Home","home"],["About","about"],["Sales","sales"],["Areas","areas"],["New Homes","newhomes"],["Reviews","reviews"],["Blog","blog"],["Contact","contact"]];

const AFFILIATE_LINKS = [
  { label: "Streamwalkers", url: "https://streamwalkers.com" },
  { label: "DripSlayer", url: "https://dripslayer.streamwalkers.com" },
  { label: "Lead Genius", url: "https://leadgenius.equiforge.ai" },
  { label: "Relocation Compass", url: "https://relocate.boaster.io" },
  { label: "Herolic", url: "https://herolic.com" },
  { label: "OfferScope", url: "https://offerscope.io" },
  { label: "TCL", url: "https://tcl.streamwalkers.com" },
  { label: "OmniCredits", url: "https://omnicredits.streamwalkers.com" },
  { label: "EquiForge", url: "https://equiforge.ai" },
];

const AUTHORITY_LINKS = [
  { label: "Realtor.com — San Antonio", url: "https://www.realtor.com/realestateandhomes-search/San-Antonio_TX" },
  { label: "HAR.com", url: "https://www.har.com" },
  { label: "SABOR", url: "https://www.sabor.com" },
  { label: "Zillow San Antonio", url: "https://www.zillow.com/san-antonio-tx/" },
  { label: "NeighborhoodScout", url: "https://www.neighborhoodscout.com/tx/san-antonio" },
];

/* ── Helpers ── */
function AnimatedCounter({ end, suffix = "", prefix = "", duration = 2200 }: { end: number; suffix?: string; prefix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const s = performance.now();
        const tick = (now: number) => {
          const p = Math.min((now - s) / duration, 1);
          const ease = 1 - Math.pow(1 - p, 3);
          setCount(Math.floor(ease * end));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [end, duration]);
  return <span ref={ref}>{prefix}{count}{suffix}</span>;
}

function FadeIn({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVis(true); obs.disconnect(); }
    }, { threshold: 0.12 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={className} style={{
      opacity: vis ? 1 : 0,
      transform: vis ? "translateY(0)" : "translateY(28px)",
      transition: `opacity 0.7s cubic-bezier(.22,1,.36,1) ${delay}s, transform 0.7s cubic-bezier(.22,1,.36,1) ${delay}s`,
    }}>{children}</div>
  );
}

const scrollTo = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
};

/* ── Main Component ── */
export default function Index() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [valAddr, setValAddr] = useState("");
  const [valEmail, setValEmail] = useState("");
  const [valDone, setValDone] = useState(false);
  const [contactForm, setContactForm] = useState({ name: "", email: "", phone: "", intent: "", message: "" });
  const [contactDone, setContactDone] = useState(false);
  const [activeReview, setActiveReview] = useState(0);
  const [affiliateOpen, setAffiliateOpen] = useState(false);
  const [mobileAffiliateOpen, setMobileAffiliateOpen] = useState(false);
  const affiliateRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  useEffect(() => {
    const iv = setInterval(() => setActiveReview(p => (p + 1) % REVIEWS.length), 6000);
    return () => clearInterval(iv);
  }, []);

  const handleScrollTo = (id: string) => { setMenuOpen(false); scrollTo(id); };

  return (
    <div className="font-body text-charcoal bg-cream min-h-screen overflow-x-hidden">

      {/* ═══════════ NAVIGATION ═══════════ */}
      <nav
        className="fixed top-0 left-0 right-0 z-[1000] transition-all duration-300"
        style={{
          background: scrolled ? "rgba(28,28,28,.96)" : "transparent",
          backdropFilter: scrolled ? "blur(14px)" : "none",
          padding: scrolled ? "10px 0" : "18px 0",
          borderBottom: scrolled ? "1px solid hsla(27,35%,59%,.12)" : "none",
        }}
      >
        <div className="max-w-[1280px] mx-auto px-10 flex items-center justify-between">
          <div className="flex items-baseline gap-2 cursor-pointer" onClick={() => handleScrollTo("home")}>
            <span className="font-display text-[26px] font-normal text-white tracking-wide">Emily Russell</span>
            <span className="font-body text-[9px] tracking-[3.5px] uppercase text-gold-light font-normal">Realtor</span>
          </div>
          <div className="hidden md:flex gap-7 items-center">
            {NAV_ITEMS.map(([l, id]) => (
              <a key={id} className="nav-link" onClick={() => handleScrollTo(id)}>{l}</a>
            ))}
            {/* Affiliate Partner Network Dropdown */}
            <div className="relative" ref={affiliateRef}
              onMouseEnter={() => setAffiliateOpen(true)}
              onMouseLeave={() => setAffiliateOpen(false)}
            >
              <button
                className="nav-link cursor-pointer bg-transparent border-none flex items-center gap-1"
                onClick={() => setAffiliateOpen(o => !o)}
              >
                Partners
                <svg className={`w-3 h-3 transition-transform duration-200 ${affiliateOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {affiliateOpen && (
                <div className="absolute top-full right-0 mt-2 py-2 min-w-[220px] rounded-md shadow-xl" style={{ background: "rgba(28,28,28,.97)", backdropFilter: "blur(14px)", border: "1px solid rgba(196,149,106,.15)" }}>
                  <div className="px-3 py-1.5 mb-1">
                    <span className="font-body text-[9px] tracking-[2px] uppercase text-gold-light">Affiliate Partner Network</span>
                  </div>
                  {AFFILIATE_LINKS.map(a => (
                    <a key={a.url} href={a.url} target="_blank" rel="noopener noreferrer"
                      className="block px-3 py-1.5 font-body text-[12.5px] no-underline transition-colors duration-200 hover:text-gold-light"
                      style={{ color: "rgba(255,255,255,.65)" }}>
                      {a.label} ↗
                    </a>
                  ))}
                </div>
              )}
            </div>
            <a href="tel:2109120806" className="btn-er-primary !py-2.5 !px-5 no-underline">(210) 912-0806</a>
          </div>
          <button className="md:hidden cursor-pointer bg-transparent border-none p-2" onClick={() => setMenuOpen(!menuOpen)}>
            <span className="block w-[22px] h-[1.5px] bg-cream my-[5px]" />
            <span className="block w-[22px] h-[1.5px] bg-cream my-[5px]" />
            <span className="block w-[22px] h-[1.5px] bg-cream my-[5px]" />
          </button>
        </div>
        {menuOpen && (
          <div className="flex md:hidden flex-col items-center gap-4 py-5" style={{ background: "rgba(28,28,28,.98)", animation: "fadeDown .3s ease" }}>
            {NAV_ITEMS.map(([l, id]) => (
              <a key={id} className="nav-link" onClick={() => handleScrollTo(id)}>{l}</a>
            ))}
            {/* Mobile Affiliate Accordion */}
            <button className="nav-link cursor-pointer bg-transparent border-none flex items-center gap-1"
              onClick={() => setMobileAffiliateOpen(o => !o)}>
              Partners
              <svg className={`w-3 h-3 transition-transform duration-200 ${mobileAffiliateOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {mobileAffiliateOpen && (
              <div className="flex flex-col items-center gap-2">
                {AFFILIATE_LINKS.map(a => (
                  <a key={a.url} href={a.url} target="_blank" rel="noopener noreferrer"
                    className="font-body text-[12px] no-underline transition-colors duration-200 hover:text-gold-light"
                    style={{ color: "rgba(255,255,255,.55)" }}>
                    {a.label} ↗
                  </a>
                ))}
              </div>
            )}
            <a href="tel:2109120806" className="text-gold-light font-body text-sm no-underline">(210) 912-0806</a>
          </div>
        )}
      </nav>

      {/* ═══════════ HERO ═══════════ */}
      <section
        id="home"
        className="relative min-h-[700px] h-screen flex items-center"
        style={{
          background: `linear-gradient(150deg,rgba(28,28,28,.78) 0%,rgba(28,28,28,.4) 45%,rgba(28,28,28,.62) 100%),url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&q=85') center/cover no-repeat`,
        }}
      >
        <div className="max-w-[1280px] mx-auto px-10 md:px-10 px-6 w-full">
          <FadeIn>
            <div className="flex items-center gap-3 mb-5">
              <div className="gold-bar" />
              <span className="font-body text-[10.5px] tracking-[4px] uppercase text-gold-light font-normal">
                Fathom Realty · San Antonio, TX
              </span>
            </div>
          </FadeIn>
          <FadeIn delay={0.12}>
            <h1 className="font-display font-normal leading-[1.06] text-white max-w-[680px] mb-5" style={{ fontSize: "clamp(40px,6.5vw,76px)" }}>
              Finding Your<br />
              <span className="text-gold-light italic font-normal">Perfect Home</span><br />
              in San Antonio
            </h1>
          </FadeIn>
          <FadeIn delay={0.24}>
            <p className="font-body text-base font-light max-w-[500px] leading-[1.75] mb-9" style={{ color: "rgba(255,255,255,.72)" }}>
              Buyer's agent. Listing specialist. Relocation expert. I'm dedicated to asking the right questions, understanding your needs, and making sure you find exactly the right home.
            </p>
          </FadeIn>
          <FadeIn delay={0.36}>
            <div className="flex gap-3.5 flex-wrap">
              <button className="btn-er-primary" onClick={() => handleScrollTo("contact")}>Work With Emily</button>
              <button className="btn-outline-light" onClick={() => handleScrollTo("valuation")}>What's My Home Worth?</button>
            </div>
          </FadeIn>
          <FadeIn delay={0.5}>
            <div className="flex items-center gap-2 mt-10">
              <div className="flex">
                {[...Array(5)].map((_, i) => <span key={i} className="text-gold text-sm mr-0.5">★</span>)}
              </div>
              <span className="font-body text-[13px]" style={{ color: "rgba(255,255,255,.6)" }}>5.0 Rating on Zillow · San Antonio's Trusted Agent</span>
            </div>
            <div className="mt-3">
              <Link to="/trec" className="font-body text-[11px] tracking-[1px] no-underline transition-colors duration-300 hover:text-gold-light" style={{ color: "rgba(255,255,255,.45)" }}>
                TREC: Information About Brokerage Services | Consumer Protection Notice
              </Link>
            </div>
          </FadeIn>
        </div>
        <div className="absolute bottom-9 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5" style={{ animation: "pulse-scroll 2.5s infinite" }}>
          <span className="font-body text-[9.5px] tracking-[3px] uppercase" style={{ color: "rgba(255,255,255,.4)" }}>Discover</span>
          <div className="w-px h-9" style={{ background: "linear-gradient(to bottom,hsla(27,35%,59%,.5),transparent)" }} />
        </div>
      </section>

      {/* ═══════════ STATS ═══════════ */}
      <section className="bg-charcoal py-11 px-10">
        <div className="max-w-[1100px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { n: 7, s: "", label: "Homes Closed" },
            { n: 5, s: "", label: "Star Zillow Rating" },
            { n: 4, s: "+", label: "Years Experience" },
            { n: 100, s: "%", label: "Client Satisfaction" },
          ].map((s, i) => (
            <div key={i}>
              <div className="font-display font-light text-gold-light" style={{ fontSize: "clamp(34px,4vw,48px)" }}>
                <AnimatedCounter end={s.n} suffix={s.s} />
              </div>
              <div className="font-body text-[10.5px] tracking-[2.5px] uppercase mt-1" style={{ color: "rgba(255,255,255,.45)" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════ HOME VALUATION ═══════════ */}
      <section id="valuation" className="py-[76px] px-10" style={{ background: "linear-gradient(140deg,#2e2722 0%,#1c1c1c 100%)" }}>
        <div className="max-w-[780px] mx-auto text-center">
          <FadeIn>
            <div className="er-label !text-gold-light">Free Home Valuation</div>
            <h2 className="font-display font-normal text-white mb-3.5" style={{ fontSize: "clamp(26px,4vw,42px)" }}>
              What's Your Home <span className="text-gold-light italic">Really</span> Worth?
            </h2>
            <p className="font-body text-[14.5px] font-light max-w-[520px] mx-auto mb-9" style={{ color: "rgba(255,255,255,.55)" }}>
              Get a complimentary, no-obligation market analysis from Emily — personalized with real neighborhood data for the San Antonio market.
            </p>
          </FadeIn>
          {!valDone ? (
            <FadeIn delay={0.1}>
              <div className="flex flex-col md:flex-row gap-2.5">
                <input className="er-input flex-[2]" placeholder="Your property address" value={valAddr} onChange={e => setValAddr(e.target.value)}
                  style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.12)", color: "#fff" }} />
                <input className="er-input flex-1" placeholder="Email address" value={valEmail} onChange={e => setValEmail(e.target.value)}
                  style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.12)", color: "#fff" }} />
                <button className="btn-er-primary" onClick={() => {
                  if (valAddr && valEmail) {
                    setValDone(true);
                    syncLead({ name: "Home Valuation Request", email: valEmail, address: valAddr, form_type: "valuation", intent: "Free Home Valuation" });
                  }
                }}>Get My Value</button>
              </div>
              <p className="font-body text-[11px] mt-2.5" style={{ color: "rgba(255,255,255,.3)" }}>100% free · No obligation · Personalized by Emily</p>
            </FadeIn>
          ) : (
            <FadeIn>
              <div className="p-7" style={{ background: "rgba(196,149,106,.08)", border: "1px solid rgba(196,149,106,.25)" }}>
                <div className="text-[28px] mb-2">✓</div>
                <h3 className="font-display text-[22px] text-white mb-1.5">Request Received!</h3>
                <p className="font-body text-[13.5px]" style={{ color: "rgba(255,255,255,.55)" }}>Emily will prepare your custom home valuation and reach out within 24 hours.</p>
              </div>
            </FadeIn>
          )}
        </div>
      </section>

      {/* ═══════════ ABOUT EMILY ═══════════ */}
      <section id="about" className="py-[92px] px-10 bg-warm">
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-[5fr_7fr] gap-14 items-center">
          <FadeIn>
            <div className="relative">
              <div className="w-full overflow-hidden relative" style={{ aspectRatio: "3/4" }}>
                <img src={EmilyPhoto} alt="Emily Russell - San Antonio Real Estate Agent"
                  className="w-full h-full object-cover block" />
              </div>
              <div className="absolute -bottom-5 -right-5 bg-gold py-5 px-7 max-w-[260px]">
                <p className="font-display text-base text-white italic leading-[1.4]">
                  "Every client deserves a dedicated advocate."
                </p>
              </div>
            </div>
          </FadeIn>
          <FadeIn delay={0.15}>
            <div>
              <div className="er-label">About Emily Russell</div>
              <h2 className="er-heading mb-5">
                Dedicated to Helping You<br />
                <span className="text-blush italic">Find the Right Home</span>
              </h2>
              <p className="er-body mb-4">
                As a licensed REALTOR® with Fathom Realty, I specialize in helping buyers find their perfect home in the Greater San Antonio area. From first-time homebuyers to families relocating to Texas, I bring the same personal dedication and attention to detail to every client.
              </p>
              <p className="er-body mb-4">
                I believe in asking the right questions, truly listening to your needs, and working tirelessly until we find exactly what you're looking for — not just a house, but a home where your story unfolds.
              </p>
              <p className="er-body mb-7">
                Based in San Antonio (78257), I have deep expertise in the northwest corridor — Alamo Ranch, Helotes, Stone Oak, and the surrounding Hill Country communities.
              </p>
              <div className="flex gap-4 flex-wrap mb-7">
                {["Buyer's Agent", "Listing Agent", "Relocation Specialist"].map(b => (
                  <div key={b} className="py-1.5 px-4 border border-solid font-body text-[10.5px] tracking-[1.5px] uppercase text-gold" style={{ borderColor: "hsl(var(--gold))" }}>{b}</div>
                ))}
              </div>
              <div className="flex gap-3 flex-wrap">
                <a href="tel:2109120806" className="btn-er-primary no-underline">Call (210) 912-0806</a>
                <a href="mailto:emily@streamwalkers.com" className="btn-er-dark no-underline">Email Emily</a>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══════════ RECENT SALES ═══════════ */}
      <section id="sales" className="py-[92px] px-10 bg-cream">
        <div className="max-w-[1280px] mx-auto">
          <FadeIn>
            <div className="text-center mb-12">
              <div className="er-label">Proven Results</div>
              <h2 className="er-heading">Recent <span className="italic text-gold">Sales</span></h2>
              <p className="er-body max-w-[500px] mx-auto mt-3">
                7 closed transactions ranging from $194K to $441K — homes that matched real families with their perfect fit in San Antonio.
              </p>
            </div>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-[22px]">
            {RECENT_SALES.slice(0, 3).map((s, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div className="card-hover bg-white cursor-pointer overflow-hidden" title="Click to inquire about similar homes" onClick={() => handleScrollTo("contact")}>
                  <div className="relative overflow-hidden">
                    <img className="img-zoom w-full h-60 object-cover block" src={s.img} alt={s.addr} />
                    <div className="absolute top-3.5 left-3.5 bg-gold text-white py-1 px-3 font-body text-[9.5px] tracking-[2px] uppercase font-medium">
                      {s.role} · Sold
                    </div>
                  </div>
                  <div className="py-[18px] px-[22px]">
                    <div className="font-body text-[13.5px] font-medium text-charcoal mb-0.5">{s.addr}</div>
                    <div className="font-body text-xs text-slate-er mb-2.5">{s.city}</div>
                    <div className="flex gap-3.5 font-body text-[11.5px] text-slate-er">
                      <span>{s.beds} bd</span><span style={{ color: "#d4cfc7" }}>|</span>
                      <span>{s.baths} ba</span><span style={{ color: "#d4cfc7" }}>|</span>
                      <span>{s.sqft} sqft</span><span style={{ color: "#d4cfc7" }}>|</span>
                      <span className="text-gold">{s.date}</span>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[22px] mt-[22px]">
            {RECENT_SALES.slice(3).map((s, i) => (
              <FadeIn key={i} delay={(i + 3) * 0.1}>
                <div className="card-hover bg-white cursor-pointer overflow-hidden flex flex-col md:flex-row" title="Click to inquire about similar homes" onClick={() => handleScrollTo("contact")}>
                  <div className="w-full md:w-[200px] min-h-[180px] overflow-hidden shrink-0">
                    <img className="img-zoom w-full h-full object-cover block" src={s.img} alt={s.addr} />
                  </div>
                  <div className="py-[22px] px-6 flex flex-col justify-center">
                    <div className="font-body text-[9.5px] tracking-[2px] uppercase text-gold font-medium mb-1.5">{s.role} · Sold {s.date}</div>
                    <div className="font-body text-sm font-medium text-charcoal mb-1">{s.addr}</div>
                    <div className="font-body text-xs text-slate-er mb-2">{s.city}</div>
                    <div className="flex gap-3 font-body text-[11.5px] text-slate-er">
                      <span>{s.beds} bd</span><span style={{ color: "#d4cfc7" }}>|</span>
                      <span>{s.baths} ba</span><span style={{ color: "#d4cfc7" }}>|</span>
                      <span>{s.sqft} sqft</span>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ NEIGHBORHOODS ═══════════ */}
      <section id="areas" className="py-[92px] px-10 bg-warm">
        <div className="max-w-[1280px] mx-auto">
          <FadeIn>
            <div className="text-center mb-12">
              <div className="er-label">San Antonio Neighborhoods</div>
              <h2 className="er-heading">Areas I <span className="italic text-gold">Know Best</span></h2>
              <p className="er-body max-w-[520px] mx-auto mt-3">
                Deep local knowledge of San Antonio's most desirable communities — from master-planned neighborhoods to Hill Country retreats.
              </p>
            </div>
          </FadeIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[18px]">
            {NEIGHBORHOODS.map((n, i) => (
              <FadeIn key={i} delay={i * 0.08}>
                <div className="relative overflow-hidden cursor-pointer h-[300px] card-hover">
                  <img className="img-zoom w-full h-full object-cover" src={n.img} alt={n.name} />
                  <div className="absolute inset-0 flex flex-col justify-end p-5" style={{ background: "linear-gradient(to top,rgba(0,0,0,.72) 0%,rgba(0,0,0,.08) 55%)" }}>
                    <div className="font-body text-[9px] tracking-[2px] uppercase text-gold-light font-medium mb-1.5">{n.highlight}</div>
                    <h3 className="font-display text-[22px] font-normal text-white mb-1">{n.name}</h3>
                    <p className="font-body text-xs leading-[1.5]" style={{ color: "rgba(255,255,255,.6)" }}>{n.desc}</p>
                    <span className="font-body text-[10px] tracking-[2px] uppercase text-gold-light mt-2.5 cursor-pointer" onClick={() => handleScrollTo("contact")}>Explore Area →</span>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ FEATURED NEW HOME DEALS ═══════════ */}
      <section id="newhomes" className="py-[92px] px-10 bg-cream">
        <div className="max-w-[1280px] mx-auto">
          <FadeIn>
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-4">
                <img src={NuBuildLogo} alt="NuBuild Homes" className="h-10 object-contain" />
              </div>
              <div className="er-label">In Partnership with NuBuild</div>
              <h2 className="er-heading">Featured New Home <span className="italic text-gold">Deals</span></h2>
              <p className="er-body max-w-[540px] mx-auto mt-3">
                Exclusive new construction opportunities in San Antonio's most sought-after communities — curated by Emily with builder incentives you won't find anywhere else.
              </p>
            </div>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-[22px]">
            {NEW_HOME_DEALS.map((deal, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div className="card-hover bg-white overflow-hidden flex flex-col h-full">
                  <div className="relative overflow-hidden">
                    <img className="img-zoom w-full h-56 object-cover block" src={deal.img} alt={deal.name} />
                    <div className="absolute top-3.5 left-3.5 bg-gold text-white py-1 px-3 font-body text-[9.5px] tracking-[2px] uppercase font-medium">
                      {deal.tag}
                    </div>
                  </div>
                  <div className="py-[22px] px-[22px] flex flex-col flex-1">
                    <div className="font-body text-[10px] tracking-[2px] uppercase text-gold font-medium mb-1">{deal.location}</div>
                    <h3 className="font-display text-xl font-medium text-charcoal mb-1">{deal.name}</h3>
                    <div className="font-display text-2xl text-gold mb-3">Starting from {deal.price}</div>
                    <ul className="flex-1 mb-5">
                      {deal.features.map((f, j) => (
                        <li key={j} className="font-body text-[13px] text-slate-er mb-1.5 flex items-start gap-2">
                          <span className="text-gold mt-0.5 text-xs">✦</span>
                          {f}
                        </li>
                      ))}
                    </ul>
                    <a
                      href="https://nubuildhomes.com/markets/san-antonio/#get-deal"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-er-primary no-underline text-center block"
                    >
                      Get This Deal
                    </a>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ REVIEWS ═══════════ */}
      <section id="reviews" className="py-[92px] px-10" style={{ background: "linear-gradient(140deg,#2e2722 0%,#1c1c1c 100%)" }}>
        <div className="max-w-[760px] mx-auto text-center">
          <FadeIn>
            <div className="er-label !text-gold-light">Client Reviews</div>
            <h2 className="font-display font-normal text-white mb-11" style={{ fontSize: "clamp(26px,4vw,42px)" }}>
              What Clients <span className="italic text-gold-light">Say</span>
            </h2>
          </FadeIn>
          <div className="relative min-h-[220px]">
            {REVIEWS.map((r, i) => (
              <div key={i} style={{
                position: i === activeReview ? "relative" : "absolute", top: 0, left: 0, right: 0,
                opacity: i === activeReview ? 1 : 0, transform: i === activeReview ? "translateY(0)" : "translateY(14px)",
                transition: "all .6s cubic-bezier(.22,1,.36,1)", pointerEvents: i === activeReview ? "auto" : "none",
              }}>
                <div className="mb-3.5">
                  {[...Array(r.stars)].map((_, j) => <span key={j} className="text-gold text-[17px] mr-0.5">★</span>)}
                </div>
                <p className="font-display font-normal italic leading-[1.6] mb-[22px]" style={{ fontSize: "clamp(18px,2.8vw,26px)", color: "rgba(255,255,255,.88)" }}>
                  "{r.text}"
                </p>
                <p className="font-body text-[12.5px] font-medium text-gold-light tracking-wide">{r.name}</p>
                <p className="font-body text-[11px] mt-1" style={{ color: "rgba(255,255,255,.35)" }}>via {r.src} · {r.date}</p>
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-2.5 mt-7">
            {REVIEWS.map((_, i) => (
              <button key={i} onClick={() => setActiveReview(i)} className="border-none cursor-pointer transition-all duration-300" style={{
                width: i === activeReview ? 28 : 8, height: 8, borderRadius: 4,
                background: i === activeReview ? "hsl(var(--gold))" : "rgba(255,255,255,.18)",
              }} />
            ))}
          </div>
          <div className="mt-9">
            <a href="https://www.zillow.com/profile/Emily%20Russell%20Realtor" target="_blank" rel="noopener noreferrer"
              className="font-body text-[11px] tracking-[2px] uppercase text-gold-light no-underline">
              See All Reviews on Zillow →
            </a>
          </div>
        </div>
      </section>

      {/* ═══════════ BLOG ═══════════ */}
      <section id="blog" className="py-[92px] px-10 bg-cream">
        <div className="max-w-[1280px] mx-auto">
          <FadeIn>
            <div className="flex justify-between items-end flex-wrap gap-5 mb-11">
              <div>
                <div className="er-label">Local Insights</div>
                <h2 className="er-heading">San Antonio <span className="italic text-sage">Market Guide</span></h2>
              </div>
              <button className="btn-er-dark" onClick={() => handleScrollTo("contact")}>All Articles</button>
            </div>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-[22px]">
            {BLOG_POSTS.map((b, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div className="card-hover bg-white overflow-hidden cursor-pointer" title="Click to learn more" onClick={() => handleScrollTo("contact")}>
                  <div className="overflow-hidden"><img className="img-zoom w-full h-[190px] object-cover block" src={b.img} alt={b.title} /></div>
                  <div className="py-[18px] px-[22px]">
                    <div className="flex gap-2.5 mb-2.5">
                      <span className="font-body text-[9.5px] tracking-[1.5px] uppercase text-blush font-medium">{b.cat}</span>
                      <span className="font-body text-[9.5px]" style={{ color: "#b5ada4" }}>{b.read}</span>
                    </div>
                    <h3 className="font-display text-lg font-medium leading-[1.3] text-charcoal mb-1.5">{b.title}</h3>
                    <span className="font-body text-[11.5px]" style={{ color: "#b5ada4" }}>{b.date}</span>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ CTA BANNER ═══════════ */}
      <section className="py-[72px] px-10 text-center" style={{
        background: `linear-gradient(rgba(28,28,28,.82),rgba(28,28,28,.82)),url('https://images.unsplash.com/photo-1531218150217-54595bc2b934?w=1400&q=80') center/cover`,
      }}>
        <FadeIn>
          <div className="er-label !text-gold-light">Ready?</div>
          <h2 className="font-display font-normal text-white mb-3.5" style={{ fontSize: "clamp(26px,4.5vw,46px)" }}>
            Let's Find Your <span className="italic text-gold-light">San Antonio Home</span>
          </h2>
          <p className="font-body text-[14.5px] max-w-[480px] mx-auto mb-8" style={{ color: "rgba(255,255,255,.55)" }}>
            Whether you're buying your first home or relocating to Texas, Emily Russell is here to guide you every step of the way.
          </p>
          <div className="flex gap-3.5 justify-center flex-wrap">
            <a href="tel:2109120806" className="btn-er-primary no-underline">Call Emily Now</a>
            <button className="btn-outline-light" onClick={() => handleScrollTo("contact")}>Send a Message</button>
          </div>
          <div className="flex gap-5 justify-center mt-7">
            <a href="https://leadgenius.equiforge.ai/" target="_blank" rel="noopener noreferrer"
              className="font-body text-[11px] tracking-[2px] uppercase text-gold-light no-underline hover:text-white transition-colors">
              AI Lead Insights →
            </a>
            <a href="https://relocate.boaster.io/" target="_blank" rel="noopener noreferrer"
              className="font-body text-[11px] tracking-[2px] uppercase text-gold-light no-underline hover:text-white transition-colors">
              Relocation Guide →
            </a>
          </div>
        </FadeIn>
      </section>

      {/* ═══════════ CONTACT ═══════════ */}
      <section id="contact" className="py-[92px] px-10 bg-warm">
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-14">
          <FadeIn>
            <div>
              <div className="er-label">Get in Touch</div>
              <h2 className="er-heading mb-5">
                Let's Start<br /><span className="italic text-blush">Your Search</span>
              </h2>
              <p className="er-body mb-8">
                Whether buying, selling, or just exploring your options in San Antonio — I'd love to hear from you. Every great real estate story starts with a conversation.
              </p>
              <div className="flex flex-col gap-[22px]">
                {[
                  { icon: "📞", label: "Call or Text", val: "(210) 912-0806", href: "tel:2109120806" },
                  { icon: "✉️", label: "Email", val: "emily@streamwalkers.com", href: "mailto:emily@streamwalkers.com" },
                  { icon: "📍", label: "Office", val: "San Antonio, TX 78257" },
                  { icon: "🏢", label: "Brokerage", val: "Fathom Realty" },
                ].map((c, i) => (
                  <div key={i} className="flex gap-3.5 items-start">
                    <span className="text-lg mt-0.5">{c.icon}</span>
                    <div>
                      <div className="font-body text-[10px] tracking-[2px] uppercase text-gold mb-0.5">{c.label}</div>
                      {c.href ? (
                        <a href={c.href} className="font-body text-[14.5px] text-charcoal no-underline">{c.val}</a>
                      ) : (
                        <div className="font-body text-[14.5px] text-charcoal">{c.val}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-4 mt-7">
                <a href="http://facebook.com/EmilyRussellRealtor" target="_blank" rel="noopener noreferrer"
                  className="font-body text-[10.5px] tracking-[2px] uppercase text-gold no-underline">Facebook</a>
                <a href="https://www.zillow.com/profile/Emily%20Russell%20Realtor" target="_blank" rel="noopener noreferrer"
                  className="font-body text-[10.5px] tracking-[2px] uppercase text-gold no-underline">Zillow</a>
              </div>
            </div>
          </FadeIn>
          <FadeIn delay={0.12}>
            {!contactDone ? (
              <div className="flex flex-col gap-3.5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <input className="er-input" placeholder="Your name" value={contactForm.name} onChange={e => setContactForm(p => ({ ...p, name: e.target.value }))} />
                  <input className="er-input" placeholder="Email address" value={contactForm.email} onChange={e => setContactForm(p => ({ ...p, email: e.target.value }))} />
                </div>
                <input className="er-input" placeholder="Phone number" value={contactForm.phone} onChange={e => setContactForm(p => ({ ...p, phone: e.target.value }))} />
                <select className="er-input" value={contactForm.intent} onChange={e => setContactForm(p => ({ ...p, intent: e.target.value }))} style={{ color: contactForm.intent ? "hsl(var(--charcoal))" : "#b5ada4" }}>
                  <option value="">I'm interested in...</option>
                  <option>Buying a Home in San Antonio</option>
                  <option>Selling My Home</option>
                  <option>Relocating to San Antonio</option>
                  <option>Free Home Valuation</option>
                  <option>Investment Property</option>
                  <option>Just Exploring Options</option>
                </select>
                <textarea className="er-input" placeholder="Tell me about what you're looking for..." rows={4} value={contactForm.message}
                  onChange={e => setContactForm(p => ({ ...p, message: e.target.value }))} style={{ resize: "vertical" }} />
                <button className="btn-er-blush self-start" onClick={() => {
                  setContactDone(true);
                  syncLead({ name: contactForm.name, email: contactForm.email, phone: contactForm.phone, intent: contactForm.intent, message: contactForm.message, form_type: "contact" });
                }}>Send to Emily</button>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-center p-9 bg-white">
                <div>
                  <div className="text-[42px] mb-3">💌</div>
                  <h3 className="font-display text-2xl mb-2">Message Sent!</h3>
                  <p className="er-body">Emily will personally reach out to you shortly. Looking forward to connecting!</p>
                </div>
              </div>
            )}
          </FadeIn>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="bg-charcoal pt-14 pb-7 px-10" style={{ color: "rgba(255,255,255,.45)" }}>
        <div className="max-w-[1280px] mx-auto grid grid-cols-2 md:grid-cols-[2.5fr_1fr_1fr_1fr_1fr_1fr] gap-10 mb-10 text-center md:text-left">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-baseline gap-2 mb-3.5 justify-center md:justify-start">
              <span className="font-display text-2xl font-normal text-white">Emily Russell</span>
              <span className="font-body text-[9px] tracking-[3px] uppercase text-gold-light">Realtor</span>
            </div>
            <p className="font-body text-[13px] leading-[1.7] max-w-[280px] mx-auto md:mx-0 mb-5">
              Licensed REALTOR® with Fathom Realty, serving the Greater San Antonio area. Your trusted partner in finding the perfect Texas home.
            </p>
            <img src={FathomEHO} alt="Fathom Realty - Equal Housing Opportunity" className="h-12 object-contain mx-auto md:mx-0" />
          </div>
          {/* Scroll-link columns */}
          {[
            { title: "Quick Links", items: [["About Emily", "about"], ["Recent Sales", "sales"], ["Neighborhoods", "areas"], ["New Homes", "newhomes"], ["Reviews", "reviews"], ["Contact", "contact"]] },
            { title: "San Antonio Areas", items: [["Alamo Ranch", "areas"], ["Stone Oak", "areas"], ["Helotes", "areas"], ["Boerne", "areas"], ["Hill Country", "areas"]] },
            { title: "Services", items: [["Buy a Home", "contact"], ["Sell Your Home", "contact"], ["Home Valuation", "valuation"], ["New Construction", "newhomes"], ["Relocation", "contact"]] },
          ].map((col, i) => (
            <div key={i}>
              <h4 className="font-body text-[10px] tracking-[2.5px] uppercase text-gold mb-3.5">{col.title}</h4>
              {col.items.map(([item, id]) => (
                <div key={item} className="font-body text-[12.5px] mb-2 cursor-pointer transition-colors duration-300 hover:text-gold-light"
                  onClick={() => handleScrollTo(id)}>{item}</div>
              ))}
            </div>
          ))}
          {/* Partner Network column */}
          <div>
            <h4 className="font-body text-[10px] tracking-[2.5px] uppercase text-gold mb-3.5">Partner Network</h4>
            {AFFILIATE_LINKS.map(a => (
              <a key={a.url} href={a.url} target="_blank" rel="noopener noreferrer"
                className="block font-body text-[12.5px] mb-2 no-underline transition-colors duration-300 hover:text-gold-light" style={{ color: "rgba(255,255,255,.45)" }}>
                {a.label} ↗
              </a>
            ))}
          </div>
          {/* Resources column */}
          <div>
            <h4 className="font-body text-[10px] tracking-[2.5px] uppercase text-gold mb-3.5">Resources</h4>
            {AUTHORITY_LINKS.map(a => (
              <a key={a.url} href={a.url} target="_blank" rel="noopener noreferrer"
                className="block font-body text-[12.5px] mb-2 no-underline transition-colors duration-300 hover:text-gold-light" style={{ color: "rgba(255,255,255,.45)" }}>
                {a.label} ↗
              </a>
            ))}
          </div>
        </div>
        <div className="border-t border-white/[.07] pt-5 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="font-body text-[11px]">© 2026 Emily Russell Realtor · Fathom Realty · San Antonio, TX</p>
          <div className="flex gap-5">
            <Link to="/terms" className="font-body text-[10px] tracking-[1.5px] uppercase no-underline transition-colors duration-300 hover:text-gold-light" style={{ color: "rgba(255,255,255,.45)" }}>Terms</Link>
            <Link to="/privacy" className="font-body text-[10px] tracking-[1.5px] uppercase no-underline transition-colors duration-300 hover:text-gold-light" style={{ color: "rgba(255,255,255,.45)" }}>Privacy</Link>
            <Link to="/trec" className="font-body text-[10px] tracking-[1.5px] uppercase no-underline transition-colors duration-300 hover:text-gold-light" style={{ color: "rgba(255,255,255,.45)" }}>TREC Disclosures</Link>
            {[["Facebook", "http://facebook.com/EmilyRussellRealtor"], ["Zillow", "https://www.zillow.com/profile/Emily%20Russell%20Realtor"]].map(([s, url]) => (
              <a key={s} href={url} target="_blank" rel="noopener noreferrer"
                className="font-body text-[10px] tracking-[1.5px] uppercase no-underline transition-colors duration-300 hover:text-gold-light" style={{ color: "rgba(255,255,255,.45)" }}>{s}</a>
            ))}
          </div>
        </div>
      </footer>

      <CookieConsent />
    </div>
  );
}

import { Fragment } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import FairHousingNotice from "@/components/FairHousingNotice";
import CookieConsent from "@/components/CookieConsent";
import buyerGuides from "@/data/buyerGuides.json";

export type Guide = (typeof buyerGuides)[number];

export default function BuyerGuide({ guide }: { guide: Guide }) {
  const canonical = `https://alamocitydesigns.com/${guide.slug}`;
  const relatedKeys: Record<string, string[]> = {
    historic: ["permits", "title"], permits: ["historic", "inspections"],
    cps: ["water", "solar"], tax: ["inspections", "insurance"],
    inspections: ["permits", "drainage"], drainage: ["water", "inspections"],
    insurance: ["solar", "tax"], title: ["hoa", "permits"],
    solar: ["insurance", "cps"], water: ["cps", "drainage"], hoa: ["title", "historic"],
  };
  const related = buyerGuides.filter((item) => relatedKeys[guide.key]?.includes(item.key));
  return (
    <div className="min-h-screen bg-background text-foreground font-body">
      <Helmet>
        <title>{guide.title}</title>
        <meta name="description" content={guide.description} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={guide.title} />
        <meta property="og:description" content={guide.description} />
        <meta property="og:url" content={canonical} />
        <meta property="og:type" content="article" />
        <meta property="article:published_time" content={guide.published} />
        <meta property="article:modified_time" content={guide.published} />
        <meta name="twitter:title" content={guide.title} />
        <meta name="twitter:description" content={guide.description} />
      </Helmet>
      <a href="#article" className="sr-only focus:not-sr-only focus:block focus:bg-background focus:p-4 focus:text-foreground">Skip to article</a>
      <header className="bg-charcoal text-white py-5 px-5 sm:px-6">
        <div className="max-w-[900px] mx-auto flex flex-wrap items-center justify-between gap-3">
          <Link to="/" className="font-display text-xl sm:text-2xl text-white hover:text-gold-light">Emily Russell</Link>
          <a href="tel:2109120806" className="text-sm text-gold-light min-h-[44px] flex items-center hover:text-white">(210) 912-0806</a>
        </div>
      </header>
      <main id="article" className="max-w-[900px] mx-auto px-5 sm:px-6 py-10 sm:py-14">
        <nav aria-label="Breadcrumb" className="mb-7 text-sm text-muted-foreground">
          <Link to="/" className="underline hover:text-foreground">Home</Link>
          <span aria-hidden="true" className="mx-2">/</span>
          <a href="/#blog" className="underline hover:text-foreground">Market guide</a>
        </nav>
        <p className="text-[11px] tracking-[2.5px] uppercase text-gold mb-3">Buyer education · San Antonio</p>
        <h1 className="font-display text-[32px] leading-[1.15] sm:text-4xl md:text-[48px] max-w-[24ch] mb-5">{guide.title}</h1>
        <p className="text-sm text-muted-foreground mb-10">Published <time dateTime={guide.published}>October 25, 2026</time></p>
        <article aria-label={guide.title} className="max-w-[70ch] text-base leading-[1.85] space-y-5">
          {guide.blocks.map((block, index) => (
            <Fragment key={index}>
              {block.kind === "heading" ? <h2 className="font-display text-[25px] sm:text-[29px] leading-[1.3] !mt-10">{block.text}</h2> :
                block.kind === "list" ? <ul className="list-disc pl-6 space-y-2">{block.items?.map((item) => <li key={item}>{item}</li>)}</ul> :
                  block.text ? <p className="text-foreground/90">{block.text}</p> : null}
              {block.links && block.links.length > 0 && <ul aria-label="Sources" className="list-none space-y-2 text-sm">
                {block.links.map(({ label, url }) => <li key={url}><a href={url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 text-gold hover:text-foreground break-words">{label} <span aria-hidden="true">↗</span></a></li>)}
              </ul>}
            </Fragment>
          ))}
          <aside aria-label="Related buyer guides" className="border-t border-border !mt-10 pt-7">
            <h2 className="font-display text-2xl mb-4">Related buyer guides</h2>
            <ul className="space-y-3 text-sm">
              {related.map((item) => <li key={item.slug}><Link className="underline underline-offset-4" to={`/${item.slug}`}>{item.title}</Link></li>)}
              <li><Link className="underline underline-offset-4" to="/san-antonio-property-tax-escrow-checklist">Property taxes and escrow: an October checklist</Link></li>
            </ul>
          </aside>
          <aside aria-label="Talk with Emily" className="border-t border-border !mt-10 pt-8 space-y-4">
            <h2 className="font-display text-2xl">Planning your San Antonio move?</h2>
            <p>Contact Emily to discuss your home search and organize the property-specific questions that matter to you.</p>
            <div className="flex flex-wrap gap-4">
              <a href="tel:2109120806" className="inline-flex min-h-[44px] items-center bg-charcoal text-white px-5 py-3 text-sm hover:bg-foreground">Call Emily</a>
              <a href="mailto:emily@streamwalkers.com" className="inline-flex min-h-[44px] items-center border border-border px-5 py-3 text-sm underline">Email Emily</a>
            </div>
          </aside>
        </article>
      </main>
      <footer className="bg-charcoal text-white/70 px-5 sm:px-6 py-8">
        <div className="max-w-[900px] mx-auto">
          <p className="font-display text-xl text-white mb-3">Emily Russell</p>
          <p className="text-sm mb-5">San Antonio, Texas · <a className="underline text-gold-light" href="tel:2109120806">(210) 912-0806</a></p>
          <nav aria-label="Site policies" className="flex flex-wrap gap-x-5 gap-y-3 text-xs leading-relaxed">
            {[["Terms", "/terms"], ["Privacy", "/privacy"], ["Fair Housing", "/fair-housing"], ["Information About Brokerage Services", "/trec#iabs"], ["Consumer Protection Notice", "/trec#cn"]].map(([label, to]) => <Link key={to} to={to} className="underline hover:text-white">{label}</Link>)}
          </nav>
        </div>
        <FairHousingNotice variant="dark" />
      </footer>
      <CookieConsent />
    </div>
  );
}

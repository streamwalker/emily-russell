import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import FairHousingNotice from "@/components/FairHousingNotice";
import CookieConsent from "@/components/CookieConsent";

const SITE = "https://alamocitydesigns.com";

/** "2026-08-07" → "August 7, 2026". Falls back to the raw string. */
export function formatVerifiedDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  const [, y, m, d] = match;
  return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

interface CommunityArticleLayoutProps {
  title: string;
  description: string;
  /** Route path, e.g. "/communities/redbird-ranch-school-zones". */
  canonicalPath: string;
  /** Absolute or site-relative OG image path. */
  ogImage?: string;
  /** ISO date (YYYY-MM-DD) the page's facts were last verified. */
  lastVerified: string;
  /** Small kicker above the H1, e.g. "Redbird Ranch · New Construction". */
  eyebrow?: string;
  heading?: string;
  children: ReactNode;
}

export default function CommunityArticleLayout({
  title,
  description,
  canonicalPath,
  ogImage,
  lastVerified,
  eyebrow,
  heading,
  children,
}: CommunityArticleLayoutProps) {
  const canonical = `${SITE}${canonicalPath}`;
  const image = ogImage ? (ogImage.startsWith("http") ? ogImage : `${SITE}${ogImage}`) : undefined;

  return (
    <div className="min-h-screen bg-background text-foreground font-body">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
        <meta property="og:site_name" content="Emily Russell Realtor" />
        <meta property="og:locale" content="en_US" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonical} />
        <meta property="og:type" content="article" />
        {image && <meta property="og:image" content={image} />}
        {image && <meta property="og:image:secure_url" content={image} />}
        {image && <meta property="og:image:type" content="image/jpeg" />}
        {image && <meta property="og:image:width" content="1200" />}
        {image && <meta property="og:image:height" content="630" />}
        {image && <meta property="og:image:alt" content={title} />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@EmilyRussellRealtor" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        {image && <meta name="twitter:image" content={image} />}
        {image && <meta name="twitter:image:alt" content={title} />}
      </Helmet>

      {/* ── Header (matches the site's interior-page header) ── */}
      <header className="bg-charcoal text-white py-5 px-5 sm:px-6">
        <div className="max-w-[900px] mx-auto flex items-center justify-between gap-4">
          <Link
            to="/"
            className="font-display text-xl sm:text-2xl text-white no-underline hover:text-gold-light transition-colors"
          >
            Emily Russell{" "}
            <span className="font-body text-[9px] tracking-[3px] uppercase text-gold-light">Realtor</span>
          </Link>
          <a
            href="tel:2109120806"
            className="font-body text-[12px] sm:text-[13px] tracking-[1.5px] uppercase text-gold-light no-underline min-h-[44px] flex items-center hover:text-white transition-colors"
          >
            (210) 912-0806
          </a>
        </div>
      </header>

      <main className="max-w-[900px] mx-auto px-5 sm:px-6 py-10 sm:py-14">
        {eyebrow && (
          <p className="font-body text-[10px] sm:text-[11px] tracking-[2.5px] uppercase text-gold mb-3">{eyebrow}</p>
        )}
        <h1 className="font-display text-[30px] leading-[1.2] sm:text-4xl md:text-[44px] mb-3">
          {heading ?? title}
        </h1>
        <p className="font-body text-[13px] text-muted-foreground mb-8 sm:mb-10">
          Last verified: <time dateTime={lastVerified}>{formatVerifiedDate(lastVerified)}</time>
        </p>

        <div className="font-body text-[16px] leading-[1.85] space-y-8">{children}</div>
      </main>

      {/* ── Footer (single, shared compliance footer) ── */}
      <footer className="bg-charcoal pt-10 pb-6 px-5 sm:px-10" style={{ color: "rgba(255,255,255,.45)" }}>
        <div className="max-w-[900px] mx-auto">
          <div className="flex items-baseline gap-2 mb-3">
            <span className="font-display text-xl text-white">Emily Russell</span>
            <span className="font-body text-[9px] tracking-[3px] uppercase text-gold-light">Realtor</span>
          </div>
          <p className="font-body text-[12.5px] leading-[1.7] max-w-[520px] mb-6">
            Licensed REALTOR® with Fathom Realty, serving the Greater San Antonio area. TREC License #791742.
          </p>
          <div className="border-t border-white/[.07] pt-5 flex flex-col md:flex-row md:justify-between md:items-center gap-3">
            <p className="font-body text-[11px]">© 2026 Emily Russell Realtor · Fathom Realty · San Antonio, TX</p>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {[
                ["Terms", "/terms"],
                ["Privacy", "/privacy"],
                ["Fair Housing", "/fair-housing"],
                ["Information About Brokerage Services", "/trec#iabs"],
                ["Consumer Protection Notice", "/trec#cn"],
              ].map(([label, to]) => (
                <Link
                  key={to}
                  to={to}
                  className="font-body text-[10px] tracking-[1.5px] uppercase no-underline transition-colors duration-300 hover:text-gold-light"
                  style={{ color: "rgba(255,255,255,.45)" }}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
        <FairHousingNotice variant="dark" />
      </footer>

      <CookieConsent />
    </div>
  );
}

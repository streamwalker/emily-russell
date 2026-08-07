import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import CommunityArticleLayout from "@/components/communities/CommunityArticleLayout";
import { VerifiedRow } from "@/components/communities/VerifiedFact";
import { COMMUNITIES, verifiedValue, type Community } from "@/data/communities";

const SITE = "https://alamocitydesigns.com";
const CANONICAL_PATH = "/communities";

const TITLE = "New Construction Communities in San Antonio";
const DESCRIPTION =
  "Verified guides to San Antonio's new-construction communities — school district lines, builder incentives, and what to confirm before you sign.";

/**
 * Articles are keyed by community slug so adding a second community is only a
 * new entry in COMMUNITIES plus (optionally) an entry here.
 */
const ARTICLES: Record<string, { to: string; tag: string; title: string; desc: string }[]> = {
  "redbird-ranch": [
    {
      to: "/redbird-ranch-school-district",
      tag: "School Zones",
      title: "Redbird Ranch Is Zoned to Two School Districts",
      desc: "Northside ISD or Medina Valley ISD depends on your section. How to confirm the district for your specific lot before you sign.",
    },
    {
      to: "/pcs-lackland-redbird-ranch",
      tag: "PCS to JBSA-Lackland",
      title: "Buying New Construction on Orders to Lackland",
      desc: "BAH reality, what changed with VA loans on new construction, and the builder registration mistake that costs PCS buyers the most.",
    },
  ],
};

function mostRecentVerifiedOn(): string {
  const dates = COMMUNITIES.flatMap((c) =>
    Object.values(c)
      .map((f) => (f as { verifiedOn?: string })?.verifiedOn)
      .filter((d): d is string => typeof d === "string"),
  ).sort();
  return dates[dates.length - 1] ?? new Date().toISOString().slice(0, 10);
}

const usd = (n: number) => `$${n.toLocaleString("en-US")}`;

function CommunityCard({ community }: { community: Community }) {
  const c = community;
  const slug = verifiedValue(c.slug) ?? "";
  const name = verifiedValue(c.name) ?? "Community";
  const heroImage = verifiedValue(c.heroImage);
  const articles = ARTICLES[slug] ?? [];

  return (
    <section className="border border-border rounded-lg overflow-hidden bg-warm/40">
      {heroImage && (
        <img
          src={heroImage}
          alt={`New construction homes in the ${name} community, ${verifiedValue(c.area) ?? "San Antonio"}`}
          width={1200}
          height={675}
          loading="lazy"
          className="w-full object-cover aspect-[16/9]"
        />
      )}

      <div className="p-5 sm:p-7 space-y-6">
        <div>
          <p className="font-body text-[11px] tracking-[2px] uppercase text-gold mb-1.5">
            {verifiedValue(c.builder) ?? "Builder"} · {verifiedValue(c.zip) ?? "San Antonio"}
          </p>
          <h2 className="font-display text-[26px] sm:text-[30px] leading-[1.25] text-foreground">{name}</h2>
        </div>

        <dl className="not-prose">
          <VerifiedRow label="Area" fact={c.area} omitWhenPending />
          <VerifiedRow label="Sales office" fact={c.salesOfficeAddress} omitWhenPending />
          <VerifiedRow label="Starting price" fact={c.startingPrice} format={usd} omitWhenPending />
          <VerifiedRow
            label="Size range"
            fact={c.sqftMin}
            format={(min) => `${min.toLocaleString()}–${(verifiedValue(c.sqftMax) ?? min).toLocaleString()} sq ft`}
            omitWhenPending
          />
          <VerifiedRow label="Floor plans" fact={c.floorPlanCount} format={(n) => `${n} plans`} omitWhenPending />
          <VerifiedRow
            label="School districts"
            fact={c.schoolDistricts}
            format={(d) => d.join(" and ")}
            omitWhenPending
          />
        </dl>

        {articles.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {articles.map((a) => (
              <Link
                key={a.to}
                to={a.to}
                className="block border border-border rounded-lg p-5 bg-background no-underline transition-colors hover:border-gold"
              >
                <span className="block font-body text-[10px] tracking-[2px] uppercase text-gold mb-2">{a.tag}</span>
                <span className="block font-display text-[19px] leading-[1.3] text-foreground mb-2">{a.title}</span>
                <span className="block font-body text-[14px] leading-relaxed text-muted-foreground">{a.desc}</span>
                <span className="block mt-3 font-body text-[10px] tracking-[2px] uppercase text-gold">
                  Read the guide →
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default function Communities() {
  const lastVerified = mostRecentVerifiedOn();

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
      { "@type": "ListItem", position: 2, name: "Communities", item: `${SITE}${CANONICAL_PATH}` },
    ],
  };

  const listSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: TITLE,
    itemListElement: COMMUNITIES.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: verifiedValue(c.name),
    })),
  };

  return (
    <CommunityArticleLayout
      title={TITLE}
      description={DESCRIPTION}
      canonicalPath={CANONICAL_PATH}
      ogImage="/og-redbird-school-zones.jpg"
      lastVerified={lastVerified}
      eyebrow="San Antonio · New Construction"
      heading="New Construction Communities We Cover"
    >
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(listSchema)}</script>
      </Helmet>

      <p className="max-w-[70ch] text-foreground/90">
        These are the communities I know well enough to write about honestly. Every number on these pages is either
        confirmed against a named source on a specific date, or it isn't published at all. Where you see a placeholder
        instead of a figure, that's deliberate — I'd rather tell you I'm still confirming it than hand you a number that
        turns out to be wrong at the closing table.
      </p>

      <div className="space-y-10">
        {COMMUNITIES.map((c) => (
          <CommunityCard key={verifiedValue(c.slug) ?? verifiedValue(c.name)} community={c} />
        ))}
      </div>

      <p className="max-w-[70ch] text-[15px] text-muted-foreground">
        Looking at a community that isn't listed here? Tell me which one and I'll put the same treatment on it —
        district lines, tax rate, HOA, MUD or PID, and what the builder's incentive is actually worth. Call or text{" "}
        <a href="tel:2109120806" className="underline hover:text-gold transition-colors">
          (210) 912-0806
        </a>
        .
      </p>
    </CommunityArticleLayout>
  );
}

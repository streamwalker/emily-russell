import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import CommunityArticleLayout, { formatVerifiedDate } from "@/components/communities/CommunityArticleLayout";
import CommunityLeadForm from "@/components/communities/CommunityLeadForm";
import { VerifiedFact } from "@/components/communities/VerifiedFact";
import { REDBIRD_RANCH, isVerified, verifiedValue } from "@/data/communities";
import { BAH_JBSA } from "@/data/bah";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const SITE = "https://alamocitydesigns.com";
const CANONICAL_PATH = "/pcs-lackland-redbird-ranch";

/** Single source of truth for the page's verification date. */
const VERIFIED_ON = REDBIRD_RANCH.name.verifiedOn ?? "";

const TITLE = "PCS to Lackland: Buying New Construction at Redbird Ranch";
const DESCRIPTION =
  "Orders to JBSA-Lackland? Here's what to know about buying new construction at Redbird Ranch before you arrive — BAH math, VA loans, and one costly mistake.";

const FAQS: { q: string; a: string }[] = [
  {
    q: "Can I buy a house before I physically arrive in San Antonio?",
    a: "Yes. It's routine for PCS buyers. Video walkthroughs, remote notarization where permitted, and a power of attorney if you'll be in transit at closing. Set the POA up early — it's the thing that trips people at the last minute.",
  },
  {
    q: "Is Redbird Ranch a good fit for military families?",
    a: "The price point, the VA-friendly zero-down math, and the west-side location relative to Lackland make it a common choice. Whether it's right for you depends on your commute, your school situation, and how long you expect to hold it. Ask me for the honest version.",
  },
  {
    q: "What if I get orders again in two years?",
    a: "Then resale liquidity matters more than square footage, and floor plan selection matters more than almost anything. That's a real conversation and it changes which house you should buy.",
  },
  {
    q: "Do I need an agent if the builder has their own sales rep?",
    a: "The builder's sales rep works for the builder. That's not a criticism — it's their job, and most of them do it honorably. It just means nobody in that room is obligated to you unless you bring them.",
  },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "PCS to Lackland: What to Know Before You Buy at Redbird Ranch",
  description: DESCRIPTION,
  mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE}${CANONICAL_PATH}` },
  author: {
    "@type": "Person",
    name: "Emily Russell",
    jobTitle: "REALTOR®",
    worksFor: { "@type": "Organization", name: "Fathom Realty" },
  },
  publisher: { "@type": "Organization", name: "Emily Russell Realtor", url: SITE },
  image: `${SITE}/communities/redbird-ranch.jpg`,
  dateModified: VERIFIED_ON,
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
    { "@type": "ListItem", position: 2, name: "Communities", item: `${SITE}/communities` },
    { "@type": "ListItem", position: 3, name: "PCS to Lackland", item: `${SITE}${CANONICAL_PATH}` },
  ],
};

const H2 = ({ children, id }: { children: React.ReactNode; id?: string }) => (
  <h2 id={id} className="font-display text-[26px] sm:text-[32px] leading-[1.25] text-foreground pt-4">
    {children}
  </h2>
);

const H3 = ({ children }: { children: React.ReactNode }) => (
  <h3 className="font-display text-[20px] sm:text-[23px] leading-[1.3] text-foreground pt-2">{children}</h3>
);

const P = ({ children }: { children: React.ReactNode }) => (
  <p className="max-w-[70ch] text-foreground/90">{children}</p>
);

const TIMELINE: { when: string; what: React.ReactNode }[] = [
  {
    when: "T-minus 120 days",
    what: (
      <>
        <span className="text-muted-foreground">(or as soon as you have orders)</span> — Get pre-approved. Not
        pre-qualified — pre-approved, with a lender who has closed VA loans on new construction. Confirm your COE. Nail
        down your actual BAH for your rank, dependent status, and JBSA.
      </>
    ),
  },
  {
    when: "T-minus 90 days",
    what: (
      <>
        Narrow to two or three communities. Get on video walkthroughs — a real person walking the actual standing
        inventory with a phone, answering your questions live, not a marketing video. Verify the school zone for any
        specific lot you're serious about.
      </>
    ),
  },
  {
    when: "T-minus 60–75 days",
    what: (
      <>
        This is the window where standing inventory is most negotiable and still deliverable by your report date. Homes
        sitting past 90 days are where the room is.
      </>
    ),
  },
  {
    when: "T-minus 45–60 days",
    what: <>Under contract. Order your independent inspection. Yes, on new construction.</>,
  },
  {
    when: "T-minus 30 days",
    what: (
      <>
        Final walkthrough — in person if you're here, by video with someone you trust if you're not. Punch list before
        closing, not after. Leverage disappears at funding.
      </>
    ),
  },
  {
    when: "Arrival",
    what: <>Close. Move in. Start the warranty clock knowing what's on it.</>,
  },
];

export default function PcsLackland() {
  const c = REDBIRD_RANCH;
  const heroImage = verifiedValue(c.heroImage);
  const communityName = verifiedValue(c.name) ?? "Redbird Ranch";

  const usd = (n: number) => `$${n.toLocaleString("en-US")}`;

  const specRows: { label: string; node: React.ReactNode }[] = [
    { label: "Builder", node: isVerified(c.builder) ? <VerifiedFact fact={c.builder} /> : null },
    {
      label: "Starting price",
      node: isVerified(c.startingPrice) ? <VerifiedFact fact={c.startingPrice} format={usd} /> : null,
    },
    {
      label: "Size range",
      node:
        isVerified(c.sqftMin) && isVerified(c.sqftMax)
          ? `${c.sqftMin.value.toLocaleString()}–${c.sqftMax.value.toLocaleString()} sq ft`
          : null,
    },
    {
      label: "Configurations",
      node:
        isVerified(c.bedsMin) && isVerified(c.bedsMax) && isVerified(c.bathsMin) && isVerified(c.bathsMax)
          ? `${c.bedsMin.value}–${c.bedsMax.value} bedrooms · ${c.bathsMin.value}–${c.bathsMax.value} baths`
          : null,
    },
    {
      label: "Floor plans offered",
      node: isVerified(c.floorPlanCount) ? `${c.floorPlanCount.value} plans` : null,
    },
    {
      label: "Homes currently available",
      node: isVerified(c.homesAvailable) ? `${c.homesAvailable.value} homes` : null,
    },
    {
      label: "Amenities",
      node: isVerified(c.amenities) ? (
        <ul className="list-disc pl-4 space-y-1">
          {c.amenities.value.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      ) : null,
    },
    {
      label: "School districts",
      node: isVerified(c.schoolDistricts) ? c.schoolDistricts.value.join(" and ") : null,
    },
  ].filter((r) => r.node !== null);

  return (
    <CommunityArticleLayout
      title={TITLE}
      description={DESCRIPTION}
      canonicalPath={CANONICAL_PATH}
      ogImage="/og-pcs-lackland.jpg"
      lastVerified={VERIFIED_ON}
      eyebrow={`${communityName} · PCS to JBSA-Lackland`}
      heading="PCS to Lackland: What to Know Before You Buy at Redbird Ranch"
    >
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>

      {heroImage && (
        <figure className="m-0">
          <img
            src={heroImage}
            alt={`New construction homes in the ${communityName} community off Potranco Road in San Antonio, TX ${verifiedValue(c.zip) ?? ""}`.trim()}
            width={1200}
            height={675}
            loading="eager"
            className="w-full rounded-lg object-cover aspect-[16/9]"
          />
        </figure>
      )}

      <P>
        If you're reading this from Ramstein, Kadena, Minot, or a barracks room three time zones from here, this page is
        written for you specifically.
      </P>
      <P>
        You have orders. You have a report date. You have a housing decision to make about a city you may have never set
        foot in, using a phone, on a schedule that isn't yours. And every search you run turns up the same three portals
        showing you the same photos of the same houses with no way to tell what any of it actually means.
      </P>
      <P>Let me give you the parts that matter.</P>

      <H2>First: where Redbird Ranch actually is</H2>
      <P>
        {communityName} is a <VerifiedFact fact={c.builder} /> community at <VerifiedFact fact={c.salesOfficeAddress} />{" "}
        — far west side, off the Potranco Road corridor, west of Loop 1604.
      </P>
      <P>
        I'm being that specific because there is bad information circulating. At least one community guide currently
        ranking in Google places {communityName} on San Antonio's far south side near Pleasanton Road and zones it to
        North East ISD. That's wrong on both counts, and if you're planning a move from overseas you cannot afford to
        build your commute math on it.
      </P>
      <P>
        West side. <VerifiedFact fact={c.zip} />. Potranco corridor. That geography is the entire reason this community
        shows up in your search results at all — it's one of the closer large new-construction neighborhoods to
        Lackland.
      </P>

      <div className="max-w-[70ch] border border-border rounded-lg bg-warm p-5">
        <p className="font-body text-[11px] tracking-[1.5px] uppercase text-gold mb-2">Drive times</p>
        <div className="font-body text-[15px] text-foreground mb-2">
          <VerifiedFact
            fact={c.driveTimes}
            format={(times) => (times ?? []).map(formatDriveTime).join(" · ")}
          />
        </div>
        <p className="font-body text-[14px] leading-[1.8] text-muted-foreground">
          I measure these myself rather than repeating a builder estimate. Ask me and I'll send you real peak and
          off-peak times for the specific section you're considering.
        </p>
      </div>


      <H2>The community, in plain numbers</H2>
      <div className="not-prose">
        <Table>
          <TableCaption className="text-left">
            Community details as published by <VerifiedFact fact={c.builder} />, verified {formatVerifiedDate(VERIFIED_ON)}.
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[210px]">Detail</TableHead>
              <TableHead>{communityName}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {specRows.map((r) => (
              <TableRow key={r.label}>
                <TableCell className="font-medium align-top">{r.label}</TableCell>
                <TableCell>{r.node}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <P>
        That last row is not a footnote. {communityName} straddles two districts and the assignment changes by section.
        If you have school-age kids,{" "}
        <Link to="/redbird-ranch-school-district" className="underline text-gold hover:text-foreground transition-colors">
          read the school zone breakdown
        </Link>{" "}
        before you pick a lot, not after.
      </P>

      <H2>Your BAH, honestly</H2>
      <P>{BAH_JBSA.pendingSummary}</P>
      <P>
        Nobody is going to lead with that. It matters, because if you built your budget off a 2025 number someone quoted
        you last year, you're working with a figure that no longer exists.
      </P>

      {isVerified(BAH_JBSA.rows) ? (
        <div className="not-prose">
          <Table>
            <TableCaption className="text-left">
              {BAH_JBSA.location} monthly BAH, {BAH_JBSA.asOf} rates.
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">Rank</TableHead>
                <TableHead>With dependents</TableHead>
                <TableHead>Without</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {BAH_JBSA.rows.value.map((r) => (
                <TableRow key={r.rank}>
                  <TableCell className="font-medium">{r.rank}</TableCell>
                  <TableCell>{r.withDependents}</TableCell>
                  <TableCell>{r.withoutDependents}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="max-w-[70ch] border border-border rounded-lg bg-warm/60 p-5 space-y-3">
          <p className="font-body text-[11px] tracking-[2px] uppercase text-gold">
            {BAH_JBSA.location} · {BAH_JBSA.asOf} rates
          </p>
          <p className="text-foreground/90">
            I'm not publishing a rank-by-rank rate table here. The {BAH_JBSA.asOf} figures I have came from a published
            housing source I haven't yet confirmed at the source, and a BAH number that's off by a hundred dollars a
            month is the difference between a payment that works and one that doesn't.
          </p>
          <p className="text-foreground/90">
            Look yours up directly at the{" "}
            <a
              href={BAH_JBSA.officialCalculatorUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-gold hover:text-foreground transition-colors"
            >
              {BAH_JBSA.officialCalculatorLabel}
            </a>{" "}
            — or send me your rank, dependent status, and duty ZIP and I'll run it with you and show you what it buys
            after taxes, insurance, and HOA.
          </p>
        </div>
      )}

      <p className="max-w-[70ch] text-[13.5px] leading-[1.7] text-muted-foreground border-l-2 border-border pl-4">
        {BAH_JBSA.sourceNote}
      </p>


      <H3>What the math actually has to include</H3>
      <P>BAH is not your budget. Your budget is BAH minus the things a rental didn't charge you for:</P>
      <ul className="max-w-[70ch] list-disc pl-5 space-y-2 text-foreground/90">
        <li>
          <strong>Property taxes</strong> — Texas has no state income tax and the property taxes reflect that. This is
          the line that surprises people moving from most other states, and it's escrowed into your monthly payment.{" "}
          <span className="text-muted-foreground italic">
            Rate for this community: <VerifiedFact fact={c.taxRate} />
          </span>
        </li>
        <li>
          <strong>HOA dues</strong>{" "}
          <span className="text-muted-foreground italic">
            — <VerifiedFact fact={c.hoaMonthlyDues} />
          </span>
        </li>
        <li>
          <strong>Any MUD or PID assessment on the section</strong>{" "}
          <span className="text-muted-foreground italic">
            — <VerifiedFact fact={c.mudOrPidAssessment} />
          </span>
        </li>
        <li>
          <strong>Homeowner's insurance</strong>
        </li>
        <li>
          <strong>The maintenance that used to be a phone call to the landlord</strong>
        </li>
      </ul>
      <P>
        At the {isVerified(c.startingPrice) ? usd(c.startingPrice.value) : "entry"} entry point with a VA loan at zero
        down, a lot of JBSA ranks can make this work. But make it work on the real number, not the sticker price.
      </P>

      <H2>VA loans and new construction: what changed, and what the builder will push</H2>

      <H3>The good news most people haven't heard</H3>
      <P>
        VA eliminated the requirement that builders obtain a VA-issued builder identification number for VA-guaranteed
        loans on new construction (
        <a
          href="https://www.benefits.va.gov/HOMELOANS/documents/circulars/26-25-01.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="underline text-gold hover:text-foreground transition-colors"
        >
          VA Circular 26-25-1
        </a>
        ). It's no longer necessary for issuing the Notice of Value or processing the loan. If someone tells you a
        builder “isn't VA approved,” that framing is out of date for a standard purchase.
      </P>

      <H3>Two things that did not change</H3>
      <ul className="max-w-[70ch] list-disc pl-5 space-y-3 text-foreground/90">
        <li>
          VA stopped doing its own construction compliance inspections back in 2006. It relies on local building
          inspections and the 1- or 10-year construction warranty instead. Your protection on build quality is the local
          inspector and the warranty — not the VA. Which is exactly why you should have your own independent inspection
          done, on a brand-new house, before closing. Yes, on a new house. Especially on a new house.
        </li>
        <li>
          VA also no longer intervenes in builder complaints. If something goes wrong after closing, you're directed to
          the local building department, the licensing board, or your own attorney.
        </li>
      </ul>

      <H3>The part where they'll lean on you</H3>
      <P>
        Builders commonly attach their best incentive — a rate buydown, closing cost credit, or both — to using their
        affiliated lender. <VerifiedFact fact={c.builder} /> has an affiliated mortgage company. This is legal and
        completely normal, and the incentive can be genuinely worth taking.
      </P>
      <P>
        It can also be worth less than it looks. A buydown isn't free money; it's priced somewhere. The only way to know
        is to get one competing quote from an outside lender and compare the total cost over the years you'll actually
        own the house — which, on a PCS timeline, might be three years, not thirty.
      </P>
      <P>
        You are allowed to shop the loan. Get one outside quote. If the builder's offer wins, take it with confidence.
        If it doesn't, you just found real money.
      </P>

      <H2>The one mistake that costs you the most, and it happens before you ever get here</H2>

      <section className="max-w-[70ch] border-2 border-gold rounded-lg bg-warm p-5 sm:p-7 space-y-4">
        <p className="font-body text-[11px] tracking-[2px] uppercase text-gold">Read this part twice</p>
        <p className="font-display text-[21px] sm:text-[25px] leading-[1.35] text-foreground">
          Do not fill out the builder's online inquiry form, and do not walk into the model home, before you have your
          own representation in place.
        </p>
        <p className="text-foreground/90">
          Here's the mechanic, stated plainly. Builders register buyers. Whoever is registered as bringing you — you
          alone, or you with an agent — is locked in on that first contact, and for most builders it's locked in for
          that community for a set period. Register yourself, and you have permanently given up having anyone in the
          transaction whose obligation runs to you.
        </p>
        <div>
          <p className="font-body font-semibold text-foreground mb-2">What you lose:</p>
          <ul className="list-disc pl-5 space-y-2 text-foreground/90">
            <li>
              Nobody reviewing the builder's contract on your behalf. Builder contracts are written by the builder's
              attorneys. They are not neutral documents.
            </li>
            <li>
              Nobody telling you which of those{" "}
              {isVerified(c.floorPlanCount) ? c.floorPlanCount.value : "many"} floor plans holds value on resale and
              which ones don't — which matters enormously when your next set of orders arrives in three years.
            </li>
            <li>Nobody pushing back on the lot premium, the upgrade pricing, or the incentive structure.</li>
            <li>Nobody who knows the school district line runs through this community.</li>
          </ul>
        </div>
        <p className="text-foreground/90">
          And here's the part that makes people angry when they find out later: it costs you nothing. In new
          construction the builder's marketing budget covers the buyer's agent side. You are not saving money by walking
          in alone. You are giving up representation for free.
        </p>
        <p className="text-foreground/90">
          If you have already registered yourself somewhere, tell me. I'll tell you straight whether anything can be
          done, and if it can't, I'll say so instead of wasting your time.
        </p>
        <p className="text-foreground/90">
          If you're still overseas or still at your losing base, you're in the best possible position. You haven't
          registered anywhere. Nothing is locked. Everything is still available to you. That window closes the first
          weekend you're in town with nothing to do and a rental car.
        </p>
      </section>

      <H2>Working backward from your report date</H2>
      <ol className="max-w-[70ch] relative border-l-2 border-border pl-6 space-y-6 list-none">
        {TIMELINE.map((t) => (
          <li key={t.when} className="relative">
            <span
              aria-hidden="true"
              className="absolute -left-[31px] top-1.5 h-3 w-3 rounded-full bg-gold ring-4 ring-background"
            />
            <p className="font-body text-[11px] tracking-[1.5px] uppercase text-gold mb-1">{t.when}</p>
            <p className="text-foreground/90">{t.what}</p>
          </li>
        ))}
      </ol>

      <div className="max-w-[70ch] border-l-4 border-gold bg-warm/60 px-5 py-4 rounded-r-md text-foreground/90">
        A caveat I'd rather say now than later: buying on a PCS is not automatically the right move. If your tour is two
        years, if your career field is volatile, or if you're not confident about the neighborhood, renting first is a
        legitimate and often smarter answer. I'll tell you that if I think it, and I'd rather lose the sale than put you
        in a house you have to unload from another continent.
      </div>

      <H2>Frequently asked</H2>
      <Accordion type="single" collapsible className="max-w-[70ch]">
        {FAQS.map((f, i) => (
          <AccordionItem key={f.q} value={`faq-${i}`}>
            <AccordionTrigger className="text-left font-display text-[18px]">{f.q}</AccordionTrigger>
            <AccordionContent className="font-body text-[15px] leading-[1.8] text-foreground/90">{f.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <p className="max-w-[70ch] text-[15px] text-muted-foreground">
        Tell me your report date, your rank, and whether you have kids in school. I'll tell you what's realistically
        available in your window, and I'll look up your actual BAH and pull the current tax rate and HOA for the specific
        section you're considering — then we'll see whether buying even makes sense for your situation. If the answer is “rent first,” I'll say that.
      </p>

      <CommunityLeadForm
        source="pcs-lackland"
        offerLabel="Schedule a PCS call"
        heading="Free 20-minute PCS call — no pitch"
      />

      <aside
        aria-label="Disclaimer"
        className="max-w-[70ch] border border-border rounded-lg bg-muted/40 p-5 font-body text-[13px] leading-[1.75] text-muted-foreground"
      >
        Emily Russell is a licensed Texas REALTOR®. She is not a lender, mortgage broker, tax advisor, or attorney, and
        nothing on this page is lending, tax, or legal advice. This site is not affiliated with, endorsed by, or
        sponsored by the U.S. Department of Veterans Affairs, the Department of Defense, the U.S. Air Force, or Joint
        Base San Antonio. BAH figures and loan program details are current as of the date shown and are subject to
        change — verify your entitlement and loan eligibility with official sources.
      </aside>
    </CommunityArticleLayout>
  );
}

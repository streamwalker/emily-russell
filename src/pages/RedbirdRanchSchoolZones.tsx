import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import CommunityArticleLayout from "@/components/communities/CommunityArticleLayout";
import CommunityLeadForm from "@/components/communities/CommunityLeadForm";
import { VerifiedFact } from "@/components/communities/VerifiedFact";
import { REDBIRD_RANCH, verifiedValue, type SchoolDistrictPath } from "@/data/communities";
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
const CANONICAL_PATH = "/redbird-ranch-school-district";

const TITLE = "Redbird Ranch School Zones: Northside vs. Medina Valley ISD";
const DESCRIPTION =
  "Redbird Ranch is split between two school districts. Here's how to tell which one your lot is zoned to — before you sign a contract with the builder.";

const FAQS: { q: string; a: string }[] = [
  {
    q: "Is Redbird Ranch in Northside ISD?",
    a: "Partly. Some sections are zoned to Northside ISD (Boldt Elementary, Bernal Middle, Harlan High). Others are zoned to Medina Valley ISD (Potranco Elementary, Loma Alta Middle, Medina Valley High). You must verify the specific lot.",
  },
  {
    q: "Can I request a transfer to the other district?",
    a: "Both districts have transfer policies, but inter-district transfers are discretionary, often capped, usually require reapplication each year, and generally do not include transportation. Do not buy a house on the assumption that a transfer will be approved.",
  },
  {
    q: "Does the school zone affect my property taxes?",
    a: "Yes — the school district portion of your tax bill is set by whichever district you're in, and the rates differ. Confirm the total rate for your specific lot with the appraisal district before you budget your payment.",
  },
  {
    q: "Which district is better?",
    a: "That depends entirely on what your family needs — program offerings, campus size, commute, activities. I'll walk you through both honestly, including the parts that don't favor whichever house you're standing in.",
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

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
    { "@type": "ListItem", position: 2, name: "Communities", item: `${SITE}/communities` },
    { "@type": "ListItem", position: 3, name: "Redbird Ranch School Zones", item: `${SITE}${CANONICAL_PATH}` },
  ],
};

const H2 = ({ children, id }: { children: React.ReactNode; id?: string }) => (
  <h2 id={id} className="font-display text-[26px] sm:text-[32px] leading-[1.25] text-foreground pt-4">
    {children}
  </h2>
);

const P = ({ children }: { children: React.ReactNode }) => (
  <p className="max-w-[70ch] text-foreground/90">{children}</p>
);

const Quote = ({ children }: { children: React.ReactNode }) => (
  <blockquote className="max-w-[70ch] border-l-4 border-gold bg-warm/60 px-5 py-4 rounded-r-md font-display text-[19px] sm:text-[21px] leading-[1.5] text-foreground italic">
    {children}
  </blockquote>
);

export default function RedbirdRanchSchoolZones() {
  const paths = verifiedValue(REDBIRD_RANCH.schoolPaths) ?? [];
  const nisd = paths.find((p) => p.district === "Northside ISD");
  const mvisd = paths.find((p) => p.district === "Medina Valley ISD");
  const levels: Array<SchoolDistrictPath["schools"][number]["level"]> = [
    "Elementary",
    "Middle",
    "High",
  ];
  const builder = verifiedValue(REDBIRD_RANCH.builder) ?? "the builder";
  const heroImage = verifiedValue(REDBIRD_RANCH.heroImage);
  const communityName = verifiedValue(REDBIRD_RANCH.name) ?? "This community";

  const cell = (path: SchoolDistrictPath | undefined, level: string) => {
    const school = path?.schools.find((s) => s.level === level);
    if (!school) return <span className="italic text-muted-foreground">—</span>;
    return (
      <span>
        {school.name}
        <span className="block text-muted-foreground text-[13px]">{school.distanceMiles} mi</span>
      </span>
    );
  };

  return (
    <CommunityArticleLayout
      title={TITLE}
      description={DESCRIPTION}
      canonicalPath={CANONICAL_PATH}
      ogImage="/og-redbird-school-zones.jpg"
      lastVerified="August 7, 2026"
      eyebrow={`${communityName} · New Construction`}
      heading="Redbird Ranch Is Zoned to Two Different School Districts. Here's How to Tell Which One You're Buying Into."
    >
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>

      {heroImage && (
        <figure className="m-0">
          <img
            src={heroImage}
            alt={`New construction homes in the ${communityName} community off Potranco Road in San Antonio, TX 78253`}
            width={1200}
            height={675}
            loading="eager"
            className="w-full rounded-lg object-cover aspect-[16/9]"
          />
        </figure>
      )}

      <P>Most people find this out at the closing table. Some find out in August, when they call to enroll.</P>
      <P>
        {communityName} — the {builder} community off Potranco Road on San Antonio's far west side — is not served by
        one school district. It's served by two: Northside ISD and Medina Valley ISD. Which one your children attend
        depends on which section of the community your home sits in.
      </P>
      <P>
        Nobody puts this on a yard sign. The builder's website lists schools from both districts side by side without
        explaining that they're alternatives, not options. And the listing portals inherit whatever the MLS field says,
        which is frequently wrong for new construction because the data gets entered before the section is platted.
      </P>
      <P>So here is the page nobody else has bothered to write.</P>

      <H2>The short answer</H2>
      <P>There are two possible school paths from {communityName}, and they are not equivalent.</P>

      <div className="not-prose">
        <Table>
          <TableCaption className="text-left">
            Distances as published by <VerifiedFact fact={REDBIRD_RANCH.builder} /> for the {communityName} community.
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[110px]">
                <span className="sr-only">School level</span>
              </TableHead>
              <TableHead>{nisd?.district ?? "—"} path</TableHead>
              <TableHead>{mvisd?.district ?? "—"} path</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {levels.map((level) => (
              <TableRow key={level}>
                <TableCell className="font-medium">{level}</TableCell>
                <TableCell>{cell(nisd, level)}</TableCell>
                <TableCell>{cell(mvisd, level)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <P>
        Look at the high school row.{" "}
        {nisd?.schools.find((s) => s.level === "High")?.distanceMiles} miles versus{" "}
        {mvisd?.schools.find((s) => s.level === "High")?.distanceMiles} miles. That is the difference between a
        fifteen-minute morning and a real commute, every school day, for however many years you have a teenager in the
        house. It is also the difference between two entirely different districts — different sizes, different programs,
        different UIL classifications, different bond packages, different everything.
      </P>
      <P>
        This is not a small detail buried in the fine print. For a family with kids, it may be the single most
        consequential thing about the lot you pick. And it can change from one street to the next.
      </P>

      <CommunityLeadForm
        source="redbird-school-zones"
        offerLabel="Send me the school zone sheet"
        heading="Want the lot-by-lot school zone sheet?"
        className="my-2"
      />

      <H2>Why a single neighborhood ends up in two districts</H2>
      <P>
        School district boundaries in Texas were drawn a long time ago and they do not follow city limits, ZIP codes, or
        county lines. Northside ISD and Medina Valley ISD share a boundary that runs through far west Bexar County.
        Medina Valley ISD is headquartered in Castroville, out in Medina County — but its attendance zone reaches east,
        into Bexar County, into <VerifiedFact fact={REDBIRD_RANCH.zip} />.
      </P>
      <P>{communityName} was developed across that line.</P>
      <P>
        When a community gets built out in phases over many years — and {communityName} has been building since the
        mid-2000s — the later phases can land on the other side of a line the earlier phases never crossed. Two houses
        that look identical, built by the same builder, on streets that connect, can feed different high schools.
      </P>

      <H2>How to check your specific lot in about five minutes</H2>
      <P>
        Do not take this from a listing site. Do not take it from a blog. Do not take it from me. Check it yourself, at
        the source, using the address of the specific lot — not the community's sales office address.
      </P>

      <div className="grid gap-4 sm:grid-cols-2">
        {[
          {
            district: nisd,
            label: "School Zone Locator",
            blurb: "Enter the property address. If NISD returns assigned schools, you're on the Northside side.",
          },
          {
            district: mvisd,
            label: "Attendance Zones",
            blurb: "Check the published attendance zone maps against your lot.",
          },
        ].map(({ district, label, blurb }) =>
          district ? (
            <a
              key={district.district}
              href={district.boundaryLookupUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block border border-border rounded-lg p-5 bg-warm no-underline transition-colors hover:border-gold"
            >
              <span className="block font-display text-[20px] text-foreground mb-1">
                {district.district} — {label}
              </span>
              <span className="block font-body text-[14px] leading-relaxed text-muted-foreground">{blurb}</span>
              <span className="block mt-3 font-body text-[11px] tracking-[1.5px] uppercase text-gold">
                Open the official lookup ↗
              </span>
            </a>
          ) : null,
        )}
      </div>

      <div className="max-w-[70ch]">
        <p className="font-body font-semibold text-foreground mb-2">Two cautions:</p>
        <ol className="list-decimal pl-5 space-y-3 text-foreground/90">
          <li>
            <strong>Use the lot address, not the model home address.</strong> The sales office is one specific point in
            the community. Your lot may be a half mile away and on the other side of the line. This is the single most
            common way people get this wrong.
          </li>
          <li>
            <strong>A lot that hasn't been platted yet may not return a result.</strong> If you're buying dirt in a new
            section, the address may not exist in either district's system yet. In that case you need it in writing from
            the district.
          </li>
        </ol>
      </div>

      <p className="max-w-[70ch] text-[14px] text-muted-foreground border-l-2 border-border pl-4">
        Lot-level boundary detail for this community:{" "}
        <VerifiedFact fact={REDBIRD_RANCH.lotLevelSchoolBoundary} />
      </p>

      <H2>Get it in writing</H2>
      <P>
        If the online locator can't resolve your lot, or if the answer matters enough that you want certainty, contact
        the district's student services or registration office directly with the legal description — subdivision, unit,
        block, lot — and ask for written confirmation of the assigned campuses.
      </P>
      <P>
        Ask for the answer by email. A phone call is worth nothing in six months when the person you spoke to has moved
        on.
      </P>
      <P>Also ask this second question, which almost nobody thinks to ask:</P>
      <Quote>
        “Is this attendance zone under review, and is there a bond or boundary study that could reassign it before my
        child enrolls?”
      </Quote>
      <P>
        Districts rezone. Fast-growing districts rezone often. A boundary that's accurate today can move when the next
        elementary opens. You want to know if you're buying into a stable zone or one that's about to be redrawn.
      </P>

      <H2>What to ask the builder's sales rep — word for word</H2>
      <P>
        New home sales reps are not trying to mislead you about this. Most of them genuinely aren't sure, because the
        answer varies by section and they sell across sections. But “I think it's Northside” is not an answer you can
        enroll a child with.
      </P>
      <P>Ask exactly this:</P>
      <Quote>
        “For this specific lot — not the community, this lot — which school district and which campuses is it assigned
        to? Can you put that in writing or point me to the district's confirmation?”
      </Quote>
      <P>
        If the answer is anything other than a specific district and specific campuses, treat it as unanswered.
      </P>
      <P>
        And do not let it go. A sales rep's honest guess is not a warranty, and no builder contract I've seen makes any
        representation about school assignment. That risk is entirely yours.
      </P>

      <H2>The mistake this page exists to prevent</H2>
      <P>Here is how it usually goes wrong.</P>
      <P>
        A family relocating from out of state does their research. They find a blog post or a listing page that names
        one district. They fall in love with a floor plan. They sign. Six months later they call to enroll and discover
        their address feeds a different high school eleven miles away, in a district they never looked at, never toured,
        and never chose.
      </P>
      <P>
        Nothing was hidden from them. Nobody lied. They just relied on a source that had no obligation to be right.
      </P>
      <P>
        One more thing worth knowing: at least one widely-circulated “Redbird Ranch community guide” currently ranking
        in Google places this community on San Antonio's far south side near Pleasanton Road and zones it to North East
        ISD. All three are wrong. {communityName} is far west side, off Potranco Road in{" "}
        <VerifiedFact fact={REDBIRD_RANCH.zip} />, and North East ISD does not serve it at all.
      </P>
      <P>
        I'm not pointing that out to dunk on anyone. I'm pointing it out because it's the clearest possible illustration
        of why you should verify this at the district, not at a website — including this one.
      </P>
      <P>
        Moving in on military orders?{" "}
        <Link to="/pcs-lackland-redbird-ranch" className="underline text-gold hover:text-foreground transition-colors">
          Read the PCS to Lackland guide
        </Link>{" "}
        — BAH math, VA loan rules for new construction, and the builder-registration mistake that costs relocating
        families the most.
      </P>

      <p className="max-w-[70ch] text-[15px] text-muted-foreground">
        I keep a working sheet of which sections and streets fall on which side of the line, cross-checked against both
        districts, plus the current tax rate and HOA for each section. It's free, it takes ten seconds to request, and
        it will take you about four minutes to read.
      </p>
      <CommunityLeadForm
        source="redbird-school-zones"
        offerLabel="Send me the school zone sheet"
        heading="Get the Redbird Ranch lot-by-lot school zone sheet"
      />

      <H2>Frequently asked</H2>
      <Accordion type="single" collapsible className="max-w-[70ch]">
        {FAQS.map((f, i) => (
          <AccordionItem key={f.q} value={`faq-${i}`}>
            <AccordionTrigger className="text-left font-display text-[18px]">{f.q}</AccordionTrigger>
            <AccordionContent className="font-body text-[15px] leading-[1.8] text-foreground/90">
              {f.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </CommunityArticleLayout>
  );
}

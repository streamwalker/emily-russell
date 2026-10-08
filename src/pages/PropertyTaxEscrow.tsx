import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import FairHousingNotice from "@/components/FairHousingNotice";
import CookieConsent from "@/components/CookieConsent";

const TITLE = "San Antonio Property Taxes & Escrow: October Checklist";
const DESCRIPTION = "Review Bexar County tax records, homestead eligibility, escrow assumptions, and closing paperwork before a mortgage payment change catches you off guard.";
const CANONICAL = "https://alamocitydesigns.com/san-antonio-property-tax-escrow-checklist";
const sections: { heading?: string; paras?: string[]; bullets?: string[]; links?: string[][] }[] = [
  {
    "paras": [
      "A fixed mortgage rate does not lock every part of your housing payment. Property taxes and homeowners insurance can change the amount collected through escrow. For Bexar County buyers and homeowners, October is a useful time to review the numbers: the county says tax statements are mailed that month unless a mortgage company or agent has requested the notice.",
      "Use this checkup to organize questions for your lender, mortgage servicer, appraisal district or tax office."
    ],
    "links": [
      [
        "Bexar County property-tax information",
        "https://www.bexar.org/1529/Property-Tax"
      ]
    ]
  },
  {
    "heading": "1. Start with the property’s own records",
    "paras": [
      "Use the Property Tax Search link on Bexar County’s official property-tax page. Review the property description, mailing address, exemptions and balance, and keep the statement with your records.",
      "The appraisal district handles values and exemptions. The tax office assesses and collects taxes using certified values, approved exemptions and adopted rates. Ask BCAD about appraisal or exemption records and the tax office about billing or payment. For a home outside Bexar County, use that county’s official resources."
    ],
    "links": [
      [
        "Bexar County’s process overview",
        "https://www.bexar.org/1529/Property-Tax"
      ]
    ]
  },
  {
    "heading": "2. Separate the loan payment from the whole budget",
    "paras": [
      "Review your mortgage statement or written loan estimate. Principal and interest are only part of the picture. Mortgage insurance, when applicable, and escrow for property taxes and homeowners insurance may also be included.",
      "HOA dues are often paid separately. Add utilities, maintenance and other ownership expenses as their own budget lines. Comparing properties is easier when each cost has a place, rather than treating the advertised mortgage payment as the complete monthly budget."
    ],
    "links": [
      [
        "CFPB: principal, interest and total payment",
        "https://www.consumerfinance.gov/ask-cfpb/on-a-mortgage-whats-the-difference-between-my-principal-and-interest-payment-and-my-total-monthly-payment-en-1941/"
      ]
    ]
  },
  {
    "heading": "3. Check the assumptions behind escrow",
    "paras": [
      "Compare your tax statement and insurance renewal with the figures your servicer uses. Ask which bills it expects to pay, when payment is scheduled and whether updated costs change the amount it needs to collect.",
      "The CFPB explains that property-tax and insurance changes can move monthly payments up or down. If yours changes, review the itemized charges and ask your servicer to explain the difference. An increase does not automatically mean your interest rate changed."
    ],
    "links": [
      [
        "CFPB: why a mortgage payment changes",
        "https://www.consumerfinance.gov/ask-cfpb/why-did-my-monthly-mortgage-payment-go-up-or-change-en-213/"
      ]
    ]
  },
  {
    "heading": "4. Verify your own homestead eligibility",
    "paras": [
      "BCAD’s September 2026 guidance says the general residence homestead exemption requires an ownership interest, use as your primary residence and no homestead exemption claimed on another residence.",
      "If you bought after January 1, you may qualify for the remainder of the year when the previous owner was not already claiming the exemption. Ask BCAD how the rules apply to your purchase and review its documentation requirements.",
      "Applying directly through the appraisal district is free. Confirm the application’s approval and the property record rather than assuming the purchase automatically established your exemption."
    ],
    "links": [
      [
        "BCAD: homestead eligibility and applying",
        "https://help.bcad.org/hc/en-us/articles/39968491816595-Homestead-Exemption-How-to-Apply"
      ]
    ]
  },
  {
    "heading": "5. Compare the closing paperwork",
    "paras": [
      "If you are still buying, compare the Estimated Total Monthly Payment on your Closing Disclosure with your latest Loan Estimate. Check the separate section for taxes, insurance and assessments, including expenses that will not be escrowed.",
      "Ask your lender to explain differences before closing. Save the written assumptions for comparison with your first tax statement, insurance renewal or escrow review."
    ],
    "links": [
      [
        "CFPB: Closing Disclosure guide",
        "https://www.consumerfinance.gov/owning-a-home/closing-disclosure/"
      ]
    ]
  },
  {
    "heading": "Your October checklist",
    "bullets": [
      "Find the official property-tax account and current statement.",
      "Confirm the mailing address and exemption information.",
      "Check who is responsible for each bill and its applicable deadline.",
      "Compare tax and insurance figures with your escrow information.",
      "Budget separately for HOA dues and ongoing home upkeep."
    ],
    "paras": [
      "Bexar County warns that not receiving a tax notice does not remove the obligation or change the applicable deadline. Checking now can help you identify questions before a bill or payment change becomes urgent.",
      "Planning a move to San Antonio? Contact Emily to discuss your home search, and bring this checklist to your lender when comparing properties.",
      "General educational information, reviewed October 8, 2026. Confirm property-specific tax, insurance and loan details with the appropriate professionals."
    ],
    "links": [
      [
        "Bexar County notice guidance",
        "https://www.bexar.org/1529/Property-Tax"
      ]
    ]
  }
];

export default function PropertyTaxEscrow() {
  return (
    <div className="min-h-screen bg-background text-foreground font-body">
      <Helmet>
        <title>{TITLE}</title>
        <meta name="description" content={DESCRIPTION} />
        <link rel="canonical" href={CANONICAL} />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={DESCRIPTION} />
        <meta property="og:url" content={CANONICAL} />
        <meta property="og:type" content="article" />
        <meta property="article:published_time" content="2026-10-08" />
        <meta name="twitter:title" content={TITLE} />
        <meta name="twitter:description" content={DESCRIPTION} />
      </Helmet>
      <a href="#article" className="sr-only focus:not-sr-only focus:block focus:bg-background focus:p-4 focus:text-foreground">Skip to article</a>
      <header className="bg-charcoal text-white py-5 px-5 sm:px-6">
        <div className="max-w-[900px] mx-auto flex flex-wrap items-center justify-between gap-3">
          <Link to="/" className="font-display text-xl sm:text-2xl text-white hover:text-gold-light transition-colors">Emily Russell</Link>
          <a href="tel:2109120806" className="text-sm tracking-wide text-gold-light min-h-[44px] flex items-center hover:text-white">(210) 912-0806</a>
        </div>
      </header>
      <main id="article" className="max-w-[900px] mx-auto px-5 sm:px-6 py-10 sm:py-14">
        <nav aria-label="Breadcrumb" className="mb-7 text-sm text-muted-foreground">
          <Link to="/" className="underline hover:text-foreground">Home</Link>
          <span aria-hidden="true" className="mx-2">/</span>
          <a href="/#blog" className="underline hover:text-foreground">Market guide</a>
        </nav>
        <p className="text-[11px] tracking-[2.5px] uppercase text-gold mb-3">Homeownership · San Antonio</p>
        <h1 className="font-display text-[32px] leading-[1.15] sm:text-4xl md:text-[48px] max-w-[18ch] mb-4">Why Your San Antonio Mortgage Payment Can Change</h1>
        <p className="font-display text-2xl text-muted-foreground mb-4">An October Checkup</p>
        <p className="text-sm text-muted-foreground mb-10">Reviewed <time dateTime="2026-10-08">October 8, 2026</time> · 5-minute read</p>
        <article aria-label="Property tax and escrow checklist" className="max-w-[70ch] text-[16px] leading-[1.85] space-y-9">
          {sections.map((section, index) => (
            <section key={section.heading ?? "introduction"} aria-labelledby={section.heading ? `section-${index}` : undefined} className={section.bullets ? "rounded-lg border border-border bg-warm p-5 sm:p-7 space-y-4" : "space-y-4"}>
              {section.heading && <h2 id={`section-${index}`} className="font-display text-[25px] sm:text-[29px] leading-[1.3] text-foreground">{section.heading}</h2>}
              {section.bullets && <ul className="list-disc pl-5 space-y-2">{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>}
              {section.paras?.map((paragraph) => <p key={paragraph} className="text-foreground/90">{paragraph}</p>)}
              {section.links && <ul aria-label="Official sources" className="list-none space-y-2 text-sm">{section.links.map(([label, href]) => <li key={href}><a href={href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 text-gold hover:text-foreground break-words">{label} <span aria-hidden="true">↗</span></a></li>)}</ul>}
            </section>
          ))}
          <aside aria-label="Talk with Emily" className="border-t border-border pt-8 space-y-4">
            <h2 className="font-display text-2xl">Planning your San Antonio move?</h2>
            <p>Bring the checklist to your lender, and contact Emily to discuss your home search.</p>
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

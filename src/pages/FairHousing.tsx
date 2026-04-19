import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

export default function FairHousing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>Fair Housing Policy | Emily Russell, REALTOR® San Antonio</title>
        <meta
          name="description"
          content="Emily Russell's Fair Housing policy and commitment to compliance with the federal Fair Housing Act and HUD anti-discrimination requirements in San Antonio, Texas."
        />
        <link rel="canonical" href="https://alamocitydesigns.com/fair-housing" />
        <meta property="og:title" content="Fair Housing Policy | Emily Russell, REALTOR®" />
        <meta
          property="og:description"
          content="Emily Russell's commitment to the federal Fair Housing Act and HUD anti-discrimination requirements."
        />
        <meta property="og:url" content="https://alamocitydesigns.com/fair-housing" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://alamocitydesigns.com/og-fair-housing.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Fair Housing Policy — Emily Russell, REALTOR®" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Fair Housing Policy | Emily Russell, REALTOR®" />
        <meta
          name="twitter:description"
          content="Emily Russell's commitment to the federal Fair Housing Act and HUD anti-discrimination requirements."
        />
        <meta name="twitter:image" content="https://alamocitydesigns.com/og-fair-housing.jpg" />
      </Helmet>

      <header className="bg-charcoal text-white py-6 px-6">
        <div className="max-w-[900px] mx-auto flex items-center justify-between">
          <Link
            to="/"
            className="font-display text-2xl text-white no-underline hover:text-gold-light transition-colors"
          >
            Emily Russell{" "}
            <span className="font-body text-[9px] tracking-[3px] uppercase text-gold-light">
              Realtor
            </span>
          </Link>
        </div>
      </header>

      <main className="max-w-[900px] mx-auto px-6 py-14">
        <Link
          to="/"
          className="font-body text-[12px] tracking-[2px] uppercase text-charcoal/60 hover:text-gold transition-colors mb-8 inline-block"
        >
          ← Back to Home
        </Link>

        <h1 className="font-display text-4xl md:text-5xl text-charcoal mb-3">
          Fair Housing Policy
        </h1>
        <p className="font-body text-sm text-charcoal/60 mb-10">
          Last updated: April 2026
        </p>

        <div className="prose prose-charcoal max-w-none font-body text-[15px] leading-relaxed text-charcoal/85 space-y-6">
          <section>
            <h2 className="font-display text-2xl text-charcoal mt-8 mb-3">
              Equal Housing Opportunity Commitment
            </h2>
            <p>
              Emily Russell, a licensed Texas REALTOR® with Fathom Realty (TREC #791742),
              is committed to full compliance with the federal{" "}
              <a
                href="https://www.hud.gov/program_offices/fair_housing_equal_opp/fair_housing_act_overview"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold underline hover:text-gold-dark"
              >
                Fair Housing Act
              </a>
              , the Texas Fair Housing Act, and all applicable state and local fair
              housing laws. We provide equal professional service to all clients and
              prospective clients without regard to protected class status.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-charcoal mt-8 mb-3">
              Protected Classes
            </h2>
            <p>
              Under the federal Fair Housing Act, it is illegal to discriminate in
              the sale, rental, financing, or advertising of housing on the basis of:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Race</li>
              <li>Color</li>
              <li>National origin</li>
              <li>Religion</li>
              <li>Sex (including gender identity and sexual orientation)</li>
              <li>Familial status (presence of children under 18, pregnancy)</li>
              <li>Disability</li>
            </ul>
            <p>
              Texas state law and the National Association of REALTORS® Code of Ethics
              extend these protections to additional classes. Emily Russell honors all
              federal, state, and local protected-class requirements without exception.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-charcoal mt-8 mb-3">
              No Steering, No Subjective Quality Claims
            </h2>
            <p>
              In keeping with Fair Housing best practices and Texas Real Estate
              Commission (TREC) guidance, Emily Russell does <strong>not</strong>:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Make subjective claims about school quality, school ratings, or
                school-district desirability
              </li>
              <li>
                Characterize neighborhoods by the demographic composition of their
                residents
              </li>
              <li>
                Steer prospective buyers toward or away from any community based on
                protected-class characteristics
              </li>
              <li>
                Use coded language (e.g., "good schools," "safe neighborhood," "right
                fit") that may imply demographic preference
              </li>
            </ul>
            <p>
              Instead, we describe neighborhoods using factual, verifiable
              attributes — such as school-district zoning, lot size, HOA structure,
              commute distance, and amenities — and we direct buyers to neutral
              third-party resources for any subjective evaluation.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-charcoal mt-8 mb-3">
              Independent Research Resources
            </h2>
            <p>
              For school ratings, attendance zones, crime statistics, and community
              demographics, we encourage buyers to consult independent third-party
              resources, including:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <a
                  href="https://www.niche.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gold underline hover:text-gold-dark"
                >
                  Niche.com
                </a>{" "}
                — school ratings and neighborhood reviews
              </li>
              <li>
                <a
                  href="https://www.greatschools.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gold underline hover:text-gold-dark"
                >
                  GreatSchools.org
                </a>{" "}
                — school performance data
              </li>
              <li>
                The relevant school district's official website for current
                attendance-zone boundaries
              </li>
              <li>
                <a
                  href="https://www.census.gov/quickfacts"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gold underline hover:text-gold-dark"
                >
                  U.S. Census QuickFacts
                </a>{" "}
                — community demographics
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl text-charcoal mt-8 mb-3">
              Reasonable Accommodations
            </h2>
            <p>
              If you have a disability and need a reasonable accommodation to
              participate in the home-buying process, please contact Emily directly.
              We will make every reasonable effort to accommodate your needs at no
              additional cost to you.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-charcoal mt-8 mb-3">
              Reporting a Fair Housing Violation
            </h2>
            <p>
              If you believe you have been the victim of housing discrimination, you
              may file a complaint with the U.S. Department of Housing and Urban
              Development (HUD):
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>HUD Fair Housing Hotline:</strong>{" "}
                <a
                  href="tel:+18006699777"
                  className="text-gold underline hover:text-gold-dark"
                >
                  1-800-669-9777
                </a>{" "}
                (TTY: 1-800-927-9275)
              </li>
              <li>
                <strong>Online complaint:</strong>{" "}
                <a
                  href="https://www.hud.gov/program_offices/fair_housing_equal_opp/online-complaint"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gold underline hover:text-gold-dark"
                >
                  hud.gov/fairhousing
                </a>
              </li>
              <li>
                <strong>Texas Workforce Commission Civil Rights Division:</strong>{" "}
                <a
                  href="https://www.twc.texas.gov/programs/civil-rights"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gold underline hover:text-gold-dark"
                >
                  twc.texas.gov/civil-rights
                </a>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl text-charcoal mt-8 mb-3">
              Contact
            </h2>
            <p>
              Questions about this policy or Emily's Fair Housing practices? Reach out:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Email:{" "}
                <a
                  href="mailto:emily@streamwalkers.com"
                  className="text-gold underline hover:text-gold-dark"
                >
                  emily@streamwalkers.com
                </a>
              </li>
              <li>
                Phone:{" "}
                <a
                  href="tel:+12109120806"
                  className="text-gold underline hover:text-gold-dark"
                >
                  (210) 912-0806
                </a>
              </li>
            </ul>
          </section>

          <div className="border-t border-charcoal/10 pt-6 mt-10 text-xs text-charcoal/60">
            <p>
              Emily Russell · Licensed REALTOR® · Fathom Realty · TREC #791742 ·
              San Antonio, TX
            </p>
            <p className="mt-1">
              Equal Housing Opportunity. We do business in accordance with the
              federal Fair Housing Law.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

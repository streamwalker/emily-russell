import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const TRECDisclosures = () => (
  <div className="min-h-screen bg-charcoal text-white">
    <Helmet>
      <title>TREC Disclosures | Emily Russell, REALTOR® San Antonio</title>
      <meta name="description" content="Texas Real Estate Commission required disclosures: Information About Brokerage Services (IABS) and Consumer Protection Notice for Emily Russell, Fathom Realty." />
      <link rel="canonical" href="https://alamocitydesigns.com/trec" />
      <meta property="og:title" content="TREC Disclosures | Emily Russell, REALTOR®" />
      <meta property="og:description" content="Texas Real Estate Commission required disclosures for Emily Russell, Fathom Realty — San Antonio." />
      <meta property="og:url" content="https://alamocitydesigns.com/trec" />
      <meta property="og:type" content="website" />
      <meta property="og:image" content="https://alamocitydesigns.com/og-trec.jpg" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="TREC Disclosures — Emily Russell, REALTOR®" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="TREC Disclosures | Emily Russell, REALTOR®" />
      <meta name="twitter:description" content="Texas Real Estate Commission required disclosures for Emily Russell, Fathom Realty — San Antonio." />
      <meta name="twitter:image" content="https://alamocitydesigns.com/og-trec.jpg" />
    </Helmet>
    <div className="max-w-[900px] mx-auto px-6 py-16">
      <Link to="/" className="font-body text-[12px] tracking-[2px] uppercase text-gold-light hover:text-gold transition-colors mb-8 inline-block">
        ← Back to Home
      </Link>

      <h1 className="font-display text-4xl md:text-5xl mb-4">Texas Real Estate Commission Disclosures</h1>
      <p className="font-body text-sm leading-relaxed mb-12" style={{ color: "rgba(255,255,255,.6)" }}>
        As required by the Texas Real Estate Commission (TREC), the following disclosures are provided for your review.
        For more information, visit{" "}
        <a href="https://www.trec.texas.gov" target="_blank" rel="noopener noreferrer" className="text-gold-light underline hover:text-gold">
          www.trec.texas.gov
        </a>.
      </p>

      <section className="mb-16">
        <h2 className="font-display text-2xl mb-2 text-gold-light">Information About Brokerage Services (IABS)</h2>
        <p className="font-body text-xs mb-5" style={{ color: "rgba(255,255,255,.5)" }}>TREC Form IABS 1-0</p>
        <div className="bg-white rounded-lg overflow-hidden">
          <img src="/images/IABS.jpg" alt="Texas Real Estate Commission - Information About Brokerage Services (IABS) Form" className="w-full h-auto" />
        </div>
      </section>

      <section className="mb-16">
        <h2 className="font-display text-2xl mb-2 text-gold-light">Consumer Protection Notice</h2>
        <p className="font-body text-xs mb-5" style={{ color: "rgba(255,255,255,.5)" }}>TREC No. CN 1-5</p>
        <div className="bg-white rounded-lg overflow-hidden">
          <img src="/images/TREC_Consumer_Protection_Notice.png" alt="Texas Real Estate Commission - Consumer Protection Notice" className="w-full h-auto" />
        </div>
      </section>

      <div className="border-t border-white/10 pt-6 font-body text-xs" style={{ color: "rgba(255,255,255,.4)" }}>
        <p>Emily Russell · Licensed REALTOR® · Fathom Realty · San Antonio, TX</p>
        <p className="mt-1">
          Questions? Contact TREC at{" "}
          <a href="tel:+15129360001" className="text-gold-light hover:text-gold">(512) 936-3000</a> or visit{" "}
          <a href="https://www.trec.texas.gov" target="_blank" rel="noopener noreferrer" className="text-gold-light hover:text-gold">www.trec.texas.gov</a>
        </p>
      </div>
    </div>
  </div>
);

export default TRECDisclosures;

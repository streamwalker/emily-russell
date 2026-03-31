import { Link } from "react-router-dom";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="bg-charcoal text-white py-6 px-6">
        <div className="max-w-[900px] mx-auto flex items-center justify-between">
          <Link to="/" className="font-display text-2xl text-white no-underline hover:text-gold-light transition-colors">Emily Russell <span className="font-body text-[9px] tracking-[3px] uppercase text-gold-light">Realtor</span></Link>
        </div>
      </header>

      <main className="max-w-[900px] mx-auto px-6 py-14">
        <h1 className="font-display text-4xl mb-2">Terms of Service</h1>
        <p className="text-muted-foreground text-sm mb-10">Last updated: March 31, 2026</p>

        <div className="prose prose-neutral max-w-none font-body text-[15px] leading-[1.85] space-y-8">
          <section>
            <h2 className="font-display text-xl mb-3">1. Agreement to Terms</h2>
            <p>By accessing or using the Emily Russell Realtor website ("Site"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not access or use the Site. These Terms constitute a legally binding agreement between you and Emily Russell Realtor ("we," "us," or "our").</p>
          </section>

          <section>
            <h2 className="font-display text-xl mb-3">2. Services Description</h2>
            <p>This Site provides information about real estate services in the Greater San Antonio, Texas area, including property listings, neighborhood guides, market insights, and contact forms for prospective buyers and sellers. The Site does not facilitate online transactions, payment processing, or account creation.</p>
          </section>

          <section>
            <h2 className="font-display text-xl mb-3">3. Data Collection via Lead Forms</h2>
            <p>When you submit information through our lead forms (home valuation requests, contact forms), you voluntarily provide personal information including your name, email address, phone number, and details about your real estate needs. By submitting a lead form, you consent to Emily Russell Realtor contacting you regarding your inquiry via the contact methods provided. For full details on data handling, please review our <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.</p>
          </section>

          <section>
            <h2 className="font-display text-xl mb-3">4. Intellectual Property</h2>
            <p>All content on this Site — including text, graphics, logos, images, design elements, and the compilation thereof — is the property of Emily Russell Realtor or its content suppliers and is protected by United States and international copyright laws. You may not reproduce, distribute, modify, create derivative works of, publicly display, or exploit any content from this Site without prior written consent.</p>
          </section>

          <section>
            <h2 className="font-display text-xl mb-3">5. Accuracy of Information</h2>
            <p>While we strive to ensure all property information, market data, and neighborhood descriptions are accurate and current, we make no warranties or representations regarding the completeness, accuracy, or reliability of any information on this Site. Property details, pricing, and availability are subject to change without notice. All information is provided for general informational purposes only and does not constitute professional real estate advice.</p>
          </section>

          <section>
            <h2 className="font-display text-xl mb-3">6. Third-Party Links</h2>
            <p>This Site contains links to third-party websites, including affiliate partners, real estate platforms, and industry resources. These links are provided for convenience and informational purposes. We do not endorse, control, or assume responsibility for the content, privacy policies, or practices of any third-party sites. Your use of third-party websites is at your own risk.</p>
          </section>

          <section>
            <h2 className="font-display text-xl mb-3">7. Limitation of Liability</h2>
            <p>To the fullest extent permitted by applicable law, Emily Russell Realtor shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, arising out of your use of the Site or reliance on any information provided herein. Our total aggregate liability shall not exceed one hundred dollars ($100).</p>
          </section>

          <section>
            <h2 className="font-display text-xl mb-3">8. Indemnification</h2>
            <p>You agree to indemnify, defend, and hold harmless Emily Russell Realtor, its agents, affiliates, and partners from and against any claims, liabilities, damages, losses, and expenses (including reasonable attorneys' fees) arising out of or in any way connected with your access to or use of the Site, or your violation of these Terms.</p>
          </section>

          <section>
            <h2 className="font-display text-xl mb-3">9. Dispute Resolution</h2>
            <p>Any disputes arising out of or relating to these Terms or the use of the Site shall be resolved through good-faith negotiations. If a resolution cannot be reached, disputes shall be submitted to binding arbitration in Bexar County, Texas, in accordance with the rules of the American Arbitration Association. You agree to waive any right to a jury trial.</p>
          </section>

          <section>
            <h2 className="font-display text-xl mb-3">10. Governing Law</h2>
            <p>These Terms shall be governed by and construed in accordance with the laws of the State of Texas, without regard to its conflict of law provisions. You consent to the exclusive jurisdiction of the courts located in Bexar County, Texas.</p>
          </section>

          <section>
            <h2 className="font-display text-xl mb-3">11. Modifications to Terms</h2>
            <p>We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting to the Site. Your continued use of the Site following the posting of revised Terms constitutes your acceptance of those changes.</p>
          </section>

          <section>
            <h2 className="font-display text-xl mb-3">12. Contact Information</h2>
            <p>If you have questions about these Terms of Service, please contact us:</p>
            <ul className="list-none pl-0 mt-3 space-y-1">
              <li><strong>Emily Russell Realtor</strong></li>
              <li>Email: <a href="mailto:emily@streamwalkers.com" className="text-primary hover:underline">emily@streamwalkers.com</a></li>
              <li>Phone: <a href="tel:+12109120806" className="text-primary hover:underline">(210) 912-0806</a></li>
              <li>San Antonio, TX 78257</li>
            </ul>
          </section>
        </div>
      </main>

      <footer className="bg-charcoal text-center py-6 px-6" style={{ color: "rgba(255,255,255,.45)" }}>
        <p className="font-body text-[11px]">© 2026 Emily Russell Realtor · <Link to="/privacy" className="hover:text-gold-light transition-colors" style={{ color: "inherit" }}>Privacy Policy</Link> · <Link to="/" className="hover:text-gold-light transition-colors" style={{ color: "inherit" }}>Home</Link></p>
      </footer>
    </div>
  );
}

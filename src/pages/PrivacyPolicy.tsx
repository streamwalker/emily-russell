import { Link } from "react-router-dom";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="bg-charcoal text-white py-6 px-6">
        <div className="max-w-[900px] mx-auto flex items-center justify-between">
          <Link to="/" className="font-display text-2xl text-white no-underline hover:text-gold-light transition-colors">Emily Russell <span className="font-body text-[9px] tracking-[3px] uppercase text-gold-light">Realtor</span></Link>
        </div>
      </header>

      <main className="max-w-[900px] mx-auto px-6 py-14">
        <h1 className="font-display text-4xl mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground text-sm mb-10">Last updated: March 31, 2026</p>

        <div className="prose prose-neutral max-w-none font-body text-[15px] leading-[1.85] space-y-8">
          <section>
            <h2 className="font-display text-xl mb-3">1. Information We Collect</h2>
            <p>We collect information you voluntarily provide through our lead forms, including:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Full name</li>
              <li>Email address</li>
              <li>Phone number</li>
              <li>Property address (for home valuations)</li>
              <li>Real estate interests and preferences</li>
              <li>Any additional details you provide in message fields</li>
            </ul>
            <p className="mt-3">We also automatically collect certain technical information when you visit our Site, including your IP address, browser type, device type, pages visited, and referring URL. This information is collected through standard web server logs and cookies.</p>
          </section>

          <section>
            <h2 className="font-display text-xl mb-3">2. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Respond to your real estate inquiries</li>
              <li>Provide personalized property recommendations</li>
              <li>Send market updates and relevant real estate information</li>
              <li>Improve our website and services</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl mb-3">3. Third-Party Sharing</h2>
            <p>We may share your information with:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Fathom Realty</strong> — our brokerage, as required for real estate transactions</li>
              <li><strong>Service providers</strong> — technology platforms that help us manage leads and communications</li>
              <li><strong>Legal authorities</strong> — when required by law, court order, or regulatory requirement</li>
            </ul>
            <p className="mt-3">We do not sell your personal information to third parties for marketing purposes.</p>
          </section>

          <section>
            <h2 className="font-display text-xl mb-3">4. Cookies & Tracking Technologies</h2>
            <p>This Site uses cookies and similar technologies to enhance your browsing experience. Cookies are small text files stored on your device that help us remember your preferences and understand how you interact with our Site. You can control cookie preferences through the cookie consent banner displayed on your first visit, or through your browser settings. Disabling cookies may affect certain Site functionality.</p>
          </section>

          <section>
            <h2 className="font-display text-xl mb-3">5. Data Retention</h2>
            <p>We retain your personal information for as long as necessary to fulfill the purposes for which it was collected, including to satisfy any legal, accounting, or reporting requirements. Lead form submissions are typically retained for up to 36 months unless you request earlier deletion.</p>
          </section>

          <section>
            <h2 className="font-display text-xl mb-3">6. Your Rights</h2>
            <p>Depending on your jurisdiction, you may have the following rights regarding your personal information:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Access</strong> — request a copy of the personal data we hold about you</li>
              <li><strong>Correction</strong> — request correction of inaccurate data</li>
              <li><strong>Deletion</strong> — request deletion of your personal data</li>
              <li><strong>Opt-out</strong> — unsubscribe from marketing communications at any time</li>
            </ul>
            <p className="mt-3">To exercise any of these rights, please contact us using the information below.</p>
          </section>

          <section>
            <h2 className="font-display text-xl mb-3">7. Data Security</h2>
            <p>We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.</p>
          </section>

          <section>
            <h2 className="font-display text-xl mb-3">8. Children's Privacy</h2>
            <p>This Site is not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us and we will promptly delete it.</p>
          </section>

          <section>
            <h2 className="font-display text-xl mb-3">9. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated revision date. We encourage you to review this page periodically.</p>
          </section>

          <section>
            <h2 className="font-display text-xl mb-3">10. Contact Us</h2>
            <p>If you have questions about this Privacy Policy or wish to exercise your data rights, please contact us:</p>
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
        <p className="font-body text-[11px]">© 2026 Emily Russell Realtor · <Link to="/terms" className="hover:text-gold-light transition-colors" style={{ color: "inherit" }}>Terms of Service</Link> · <Link to="/" className="hover:text-gold-light transition-colors" style={{ color: "inherit" }}>Home</Link></p>
      </footer>
    </div>
  );
}

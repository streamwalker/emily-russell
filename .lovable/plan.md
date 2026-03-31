
## Emily Russell Realty — Full Website Build

### Overview
Build a complete, polished real estate website for Emily Russell, a San Antonio-based REALTOR®, based on the provided JSX component. Emily's uploaded photo will be used in the About section.

### Pages & Sections (Single-Page Scrolling Site)
1. **Fixed Navigation** — Transparent → dark on scroll, mobile hamburger menu, phone CTA button
2. **Hero Section** — Full-viewport with background image, headline, tagline, two CTAs ("Work With Emily" / "What's My Home Worth?"), 5-star rating badge
3. **Stats Bar** — Dark background with animated counters (7 Homes Closed, 5 Star Rating, 4+ Years Experience, 100% Client Satisfaction)
4. **Home Valuation CTA** — Dark section with address + email form, success state
5. **About Emily** — Two-column layout with Emily's real uploaded photo (replacing stock image), bio text, specialty badges, contact buttons, gold quote overlay
6. **Recent Sales** — Grid of 5 sold properties with images, details (beds/baths/sqft), dates, and role badges
7. **Neighborhoods** — 4-card grid with overlay text for Alamo Ranch, Stone Oak, Helotes, Boerne
8. **Client Reviews** — Auto-rotating testimonial carousel with Zillow reviews, star ratings, pagination dots
9. **Blog/Market Guide** — 3-card grid of article previews
10. **CTA Banner** — Full-width call-to-action with background image
11. **Contact Section** — Two-column with contact info (phone, email, office, brokerage, social links) and contact form with dropdown intent selector
12. **Footer** — Branding, nav links, legal disclaimers, social links

### Design System
- **Fonts**: Playfair Display (headings) + DM Sans (body) via Google Fonts
- **Colors**: Gold (#c4956a), Charcoal (#1c1c1c), Cream (#faf8f5), Blush (#d4868e), Sage (#7d8c6e)
- **Animations**: Fade-in on scroll (IntersectionObserver), animated counters, hover card lifts, image zooms, pulsing scroll indicator

### Assets
- Copy Emily's uploaded photo to `src/assets/Emily_Russell.png` and use it in the About section instead of the stock photo

### Key Interactions
- Smooth scroll navigation between sections
- Home valuation form with success confirmation state
- Contact form with success confirmation state
- Review carousel with auto-rotation and manual dot navigation
- Responsive design with mobile menu and grid breakpoints

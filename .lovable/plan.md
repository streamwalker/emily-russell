

## Activate All Links and Buttons

After reviewing the full `Index.tsx`, most phone (`tel:`) and email (`mailto:`) links are already wired correctly. The following items are **not functional** and need to be activated:

### Items to Fix

1. **"Explore Area →" in Neighborhoods section** (line 421)
   - Currently a plain `<span>` with no link or action
   - Fix: Make it scroll to the Contact section so users can inquire about that area

2. **"All Articles" button in Blog section** (line 536)
   - Currently a `<button>` with no `onClick`
   - Fix: Scroll to the blog section or link to a relevant resource

3. **Blog post cards** (lines 542-553)
   - Have `cursor-pointer` but no click action
   - Fix: Make each card scroll to the Contact section (since there are no actual blog pages)

4. **Recent Sales cards** (lines 355, 379)
   - Have `cursor-pointer` but no action
   - Fix: Make them scroll to Contact to inquire about similar homes

### Already Working (no changes needed)
- Phone links: `tel:2109120806` (nav, about, CTA banner)
- Email link: `mailto:emily@streamwalkers.com` (about section)
- Contact info links (phone + email in contact section)
- All NuBuild "Get This Deal" links
- Zillow review link
- Facebook and Zillow social links
- All nav scroll links
- Footer scroll links and partner tool links
- Form submission buttons (valuation + contact)

### Technical Details
- **File**: `src/pages/Index.tsx`
- Neighborhood "Explore Area →" spans become `<a>` or get `onClick={() => handleScrollTo("contact")}` 
- Blog "All Articles" button gets `onClick={() => handleScrollTo("blog")}`
- Blog cards and sales cards get `onClick={() => handleScrollTo("contact")}` to drive inquiries
- All interactive elements will have proper `role` or semantic HTML for accessibility


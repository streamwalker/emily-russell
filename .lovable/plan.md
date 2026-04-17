

## Plan: Expert-Guided Tooltips on Both Calculators

### Goal
Add an info-icon (ⓘ) tooltip beside every input label in the Renter and Buyer calculators inside `public/rent-vs-buy.html`. Each tooltip teaches **What / How / Why it matters / What it means** so users finish the calculator as knowledgeable buyers — and reinforce Emily's authority on high-stakes fields.

### Approach (purely additive — no calculator logic changes)

1. **Reusable tooltip pattern** (CSS + tiny vanilla JS — no libs, no React)
   - Gold ⓘ icon next to each label
   - White card with navy border, subtle shadow, arrow pointer
   - Capped ~280px wide, auto-flips above/below to stay on-screen
   - Hover on desktop, tap-to-toggle on mobile, tap-outside-to-close

2. **Helper banner** at the top of each calculator panel:
   > 💡 Hover any ⓘ icon for expert guidance on that field

3. **Tooltip coverage** — every input/control:

   **Renter Calculator (15 fields)**
   Monthly Rent · Monthly Utilities · # of Pets · Pet Rent · Renter's Insurance · Parking · Valet Trash · Pest Control · First Month's Rent · Last Month's Rent · Security Deposit · Admin Fee · Application Fee · Pet Deposit · Non-Refundable Pet Fee

   **Buyer Calculator (16 fields)**
   Loan Type · Conventional Down Payment · VA Status · VA Disability Rating · Veteran Age · Offer Price · Interest Rate · Down Payment % · Down Payment $ · Annual Tax Rate · Monthly Insurance · Monthly HOA · Monthly Utilities · Loan Term · plus contextual tips on the **Total Monthly Obligation**, **Year-1 Equity Built**, and **Total Interest** result blocks.

4. **Conversion hooks** — high-stakes fields (Loan Type, Down Payment, Interest Rate, Tax Rate, Pet Fees) get a soft micro-CTA at the bottom of the tooltip:
   > Not sure? Emily can walk you through this in 5 minutes → (links to existing contact anchor)

### Tooltip content style (each one ~3–5 short lines)

```text
WHAT: Plain-English definition
HOW: How to find/estimate the number
WHY: Financial impact
MEANS: How it changes the buy-vs-rent picture
[optional CTA for high-stakes fields]
```

### Files Changed

| File | Change |
|------|--------|
| `public/rent-vs-buy.html` | Add `<style>` rules for `.tooltip` / `.tip-icon` / `.tip-card`; add ⓘ spans + tooltip content next to each of the 31 field labels and 3 result blocks; add tiny `<script>` for tap-to-toggle and outside-click-to-close; add 2 helper banners |

No other files touched. Calculator math, Recharts, JSON-LD schema, OG tags, and overall layout remain untouched.


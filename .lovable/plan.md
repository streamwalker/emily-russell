

## AI-Powered Property Research Agent

### What it does

When you type an address like "11310 Coppola, San Antonio, TX 78254" into Smart Add, the system will automatically search the web for that property's listing, find the best matching URL (Realtor.com, Zillow, builder sites, etc.), scrape the page content, and extract all available details (price, beds, baths, sqft, builder, community, etc.) — all before showing you the preview.

### How it works

The `parse-properties` edge function gets a new **research step** before the existing extraction step:

1. **Detect if input is just an address** (no URLs present)
2. **Use Firecrawl Search API** to search the web for that address + "listing" — returns ranked results with URLs
3. **Scrape the top 2-3 results** using Firecrawl Scrape to get full page content (markdown format, much cleaner than raw HTML stripping)
4. **Feed the scraped content** into the existing AI extraction pipeline, which already knows how to parse property data

This requires connecting the **Firecrawl connector** (already available in your workspace) to the project so the edge function can use the Firecrawl API.

### Files

| File | Action |
|------|--------|
| Firecrawl connector | Link to project (already in workspace) |
| `supabase/functions/parse-properties/index.ts` | Add research step: detect address-only input → Firecrawl search → Firecrawl scrape top results → feed to AI extraction |

### Technical details

- **When research triggers**: If the input has no URLs (`URL_REGEX` finds nothing), the function assumes it's an address/description and triggers the research agent
- **Firecrawl search query**: The AI first generates an optimal search query from the input (e.g., `"11310 Coppola San Antonio TX 78254 property listing"`), then calls `https://api.firecrawl.dev/v1/search` with domain filters for real estate sites
- **Scraping**: Top 2-3 search results are scraped via `https://api.firecrawl.dev/v1/scrape` with `formats: ['markdown']` and `onlyMainContent: true` — much better content extraction than the current raw HTML stripping
- **Existing URL flow**: If the user pastes a URL directly, the existing flow still works but upgrades to use Firecrawl scrape instead of basic `fetch()` for better content extraction
- **The preview modal** still appears before anything is saved, so the admin can verify and edit


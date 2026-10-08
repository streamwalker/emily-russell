import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { describe, expect, it } from "vitest";
import PropertyTaxEscrow from "./PropertyTaxEscrow";

function renderArticle() {
  return render(<HelmetProvider><MemoryRouter><PropertyTaxEscrow /></MemoryRouter></HelmetProvider>);
}

describe("Property tax and escrow article", () => {
  it("renders the exact article headings and puts the checklist before closing paragraphs", () => {
    const { container } = renderArticle();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Why Your San Antonio Mortgage Payment Can Change");
    const article = screen.getByRole("article");
    const headings = within(article).getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    expect(headings.slice(0, 6)).toEqual([
      "1. Start with the property’s own records",
      "2. Separate the loan payment from the whole budget",
      "3. Check the assumptions behind escrow",
      "4. Verify your own homestead eligibility",
      "5. Compare the closing paperwork",
      "Your October checklist",
    ]);
    const checklist = within(article).getByText("Your October checklist").closest("section")!;
    expect(checklist.children[1].tagName).toBe("UL");
    expect(checklist.children[2].tagName).toBe("P");
    expect(checklist.children[1].children).toHaveLength(5);
    expect(container).not.toHaveTextContent("Fathom");
    expect(container).not.toHaveTextContent("Article for Emily’s review");
  });

  it("includes official sources and preserves notice destinations without a signup form", () => {
    renderArticle();
    const article = screen.getByRole("article");
    const sources = within(article).getAllByRole("link").filter((a) => a.getAttribute("target") === "_blank");
    expect(sources).toHaveLength(7);
    sources.forEach((a) => {
      expect(a.getAttribute("rel")).toBe("noopener noreferrer");
      expect(new URL(a.getAttribute("href")!).hostname).toMatch(/^(www\.(bexar\.org|consumerfinance\.gov)|help\.bcad\.org)$/);
    });
    expect(screen.getByRole("link", { name: "Information About Brokerage Services" })).toHaveAttribute("href", "/trec#iabs");
    expect(screen.getByRole("link", { name: "Consumer Protection Notice" })).toHaveAttribute("href", "/trec#cn");
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Call Emily" })).toHaveAttribute("href", "tel:2109120806");
  });
});

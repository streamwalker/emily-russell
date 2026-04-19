import { Link } from "react-router-dom";

interface FairHousingNoticeProps {
  variant?: "light" | "dark";
}

const FairHousingNotice = ({ variant = "light" }: FairHousingNoticeProps) => {
  const isDark = variant === "dark";
  const containerClass = isDark
    ? "py-5 px-6 border-t border-white/10"
    : "py-5 px-6 border-t border-border bg-warm";
  const textStyle = isDark ? { color: "rgba(255,255,255,.55)" } : undefined;
  const textClass = isDark
    ? "max-w-[820px] mx-auto text-[11px] italic text-center leading-relaxed font-body"
    : "max-w-[820px] mx-auto text-xs italic text-muted-foreground text-center leading-relaxed font-body";
  const linkClass = isDark
    ? "underline hover:text-gold-light transition-colors not-italic"
    : "underline hover:text-primary transition-colors not-italic";

  return (
    <aside aria-label="Fair Housing Notice" className={containerClass}>
      <p className={textClass} style={textStyle}>
        <span className="font-semibold not-italic">Fair Housing Notice:</span>{" "}
        Equal Housing Opportunity. Emily Russell does not make subjective claims about school quality or community demographics.
        Verify school information at{" "}
        <a href="https://www.niche.com" target="_blank" rel="noopener noreferrer" className={linkClass}>niche.com</a>{" "}or{" "}
        <a href="https://www.greatschools.org" target="_blank" rel="noopener noreferrer" className={linkClass}>GreatSchools.org</a>.{" "}
        <Link to="/fair-housing" className={linkClass}>Read full policy →</Link>
      </p>
    </aside>
  );
};

export default FairHousingNotice;

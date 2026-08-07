import type { ReactNode } from "react";
import { isVerified, PENDING_PLACEHOLDER, type Verified } from "@/data/communities";

interface VerifiedFactProps<T> {
  fact: Verified<T> | undefined | null;
  /** Format a verified value for display. Defaults to String(value). */
  format?: (value: T) => string;
  /** Render nothing at all when the fact is pending (instead of a placeholder). */
  omitWhenPending?: boolean;
  /** Custom neutral placeholder copy. */
  placeholder?: ReactNode;
  className?: string;
}

/**
 * Renders a community fact ONLY when it is verified.
 * Pending facts render a neutral placeholder or nothing — never a stated fact.
 */
export function VerifiedFact<T>({
  fact,
  format,
  omitWhenPending = false,
  placeholder,
  className,
}: VerifiedFactProps<T>) {
  if (isVerified(fact)) {
    return <span className={className}>{format ? format(fact.value) : String(fact.value)}</span>;
  }
  if (omitWhenPending) return null;
  return (
    <span className={`italic text-muted-foreground ${className ?? ""}`}>
      {placeholder ?? PENDING_PLACEHOLDER}
    </span>
  );
}

interface VerifiedRowProps<T> extends VerifiedFactProps<T> {
  label: string;
}

/** A label/value row that disappears entirely when the fact is pending. */
export function VerifiedRow<T>({ label, ...rest }: VerifiedRowProps<T>) {
  if (rest.omitWhenPending && !isVerified(rest.fact)) return null;
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 py-2 border-b border-border last:border-b-0">
      <dt className="font-body text-[11px] tracking-[1.5px] uppercase text-gold shrink-0 sm:w-52">{label}</dt>
      <dd className="font-body text-[15px] leading-relaxed text-foreground">
        <VerifiedFact {...rest} />
      </dd>
    </div>
  );
}

export default VerifiedFact;

import { Sparkles, ExternalLink } from "lucide-react";

interface Props {
  /** Optional fallback message; the title/instructions stay the same. */
  message?: string;
  className?: string;
}

/**
 * Dedicated empty state shown in place of the generic error text when an
 * AI extraction fails because the workspace AI credits are exhausted.
 */
export const CreditsExhaustedNotice = ({ message, className = "" }: Props) => {
  return (
    <div
      className={`rounded-lg border border-amber-300/60 bg-amber-50 p-5 my-3 font-body ${className}`}
      role="status"
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 rounded-full bg-amber-100 p-2">
          <Sparkles className="h-5 w-5 text-amber-700" aria-hidden />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-heading text-base font-semibold text-amber-900">
            AI credits exhausted
          </h3>
          <p className="text-sm text-amber-900/80 mt-1">
            {message ||
              "Smart extraction is paused until more AI credits are added to this workspace."}
          </p>
          <ol className="text-sm text-amber-900/90 mt-3 space-y-1 list-decimal pl-5">
            <li>Open <span className="font-medium">Workspace Settings → Plans &amp; Credits</span>.</li>
            <li>Top up the AI balance (or upgrade the plan).</li>
            <li>Return here and click <span className="font-medium">Extract</span> again.</li>
          </ol>
          <a
            href="https://docs.lovable.dev/introduction/plans-and-credits"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm font-medium text-amber-800 hover:text-amber-900 mt-3 underline-offset-2 hover:underline"
          >
            Learn about credits
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </a>
        </div>
      </div>
    </div>
  );
};

/** Heuristic: does this error message indicate exhausted AI credits? */
export const isCreditsExhaustedError = (msg?: string | null) =>
  !!msg && /credits?\s+exhausted|add\s+funds/i.test(msg);

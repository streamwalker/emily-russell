import { AlertTriangle, CheckCircle2, Sparkles, ZapOff } from "lucide-react";
import { useAiCreditStatus, clearAiStatus } from "@/lib/aiCreditStatus";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Header badge showing live AI Gateway status, observed from edge-function
 * responses. Click to dismiss a transient state once you've added credits.
 */
export default function AiCreditsBadge() {
  const { status, message, updatedAt } = useAiCreditStatus();

  const config = (() => {
    switch (status) {
      case "exhausted":
        return {
          icon: ZapOff,
          label: "AI Credits Exhausted",
          className: "bg-red-500/15 text-red-300 border-red-500/40 hover:bg-red-500/25",
          tooltip: message || "AI credits depleted. Add funds in Settings → Workspace → Usage.",
        };
      case "rate_limited":
        return {
          icon: AlertTriangle,
          label: "AI Rate Limited",
          className: "bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25",
          tooltip: message || "AI gateway is rate limiting requests. Try again shortly.",
        };
      case "error":
        return {
          icon: AlertTriangle,
          label: "AI Error",
          className: "bg-orange-500/15 text-orange-300 border-orange-500/40 hover:bg-orange-500/25",
          tooltip: message || "Last AI request failed.",
        };
      default:
        return {
          icon: updatedAt ? CheckCircle2 : Sparkles,
          label: "AI Healthy",
          className: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20",
          tooltip: updatedAt
            ? "Last AI request succeeded."
            : "AI gateway status will appear here after the next AI call.",
        };
    }
  })();

  const Icon = config.icon;
  const dismissable = status === "rate_limited" || status === "exhausted" || status === "error";

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => dismissable && clearAiStatus()}
            className={`font-body text-[10px] uppercase tracking-[1.5px] inline-flex items-center gap-1.5 border px-2.5 py-1.5 rounded transition-colors cursor-${dismissable ? "pointer" : "default"} ${config.className}`}
            aria-label={config.label}
          >
            <Icon className="h-3 w-3" />
            <span>{config.label}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs text-xs">
          <div>{config.tooltip}</div>
          {dismissable && (
            <div className="mt-1 text-muted-foreground">Click to dismiss after fixing.</div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

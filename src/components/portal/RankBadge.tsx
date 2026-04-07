interface Props {
  rank: number;
  summary: string;
  sourceTab: string;
  color: string;
}

export default function RankBadge({ rank, summary, sourceTab, color }: Props) {
  return (
    <div className="flex items-center gap-2 mb-1">
      <span
        className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold font-body text-primary-foreground"
        style={{ background: color }}
      >
        {rank}
      </span>
      <span className="text-[10px] font-semibold font-body px-2 py-0.5 rounded bg-muted text-muted-foreground">
        {summary}
      </span>
      <span className="text-[9px] font-body text-muted-foreground opacity-70">
        {sourceTab}
      </span>
    </div>
  );
}

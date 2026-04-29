interface HeadcountBarProps {
  confirmedCount: number;
  targetHeadcount: number;
}

export function HeadcountBar({ confirmedCount, targetHeadcount }: HeadcountBarProps) {
  const ratio = targetHeadcount > 0 ? Math.min(confirmedCount / targetHeadcount, 1) : 0;

  return (
    <div>
      <p className="mb-1 text-xs text-graphite">
        {confirmedCount} of {targetHeadcount} confirmed
      </p>
      <div className="h-2 w-full bg-paper">
        <div className="h-full bg-navy transition-all" style={{ width: `${Math.round(ratio * 100)}%` }} />
      </div>
    </div>
  );
}

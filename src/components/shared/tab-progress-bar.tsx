"use client";

interface Props {
  loading: boolean;
}

export function TabProgressBar({ loading }: Props) {
  if (!loading) return null;

  return (
    <div className="absolute inset-x-0 top-0 h-[2px] overflow-hidden">
      <div className="animate-tab-progress h-full bg-navy" />
    </div>
  );
}

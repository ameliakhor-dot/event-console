import { Button } from "@/components/ui/button";
import Link from "next/link";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}

export function EmptyState({ title, description, actionLabel, actionHref }: EmptyStateProps) {
  return (
    <div className="border border-border bg-surface px-8 py-14 text-center">
      <h2 className="font-serif text-3xl text-ink">{title}</h2>
      <p className="mt-2 text-sm text-graphite">{description}</p>
      {actionLabel && actionHref ? (
        <Button asChild className="mt-6 bg-navy text-white hover:bg-navy-hover">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      ) : null}
    </div>
  );
}

import { EmptyState } from "@/components/shared/empty-state";

export default function NewEventPage() {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <EmptyState
        title="New event form comes next."
        description="Phase 2 adds the full event form and save flow."
        actionLabel="Back to dashboard"
        actionHref="/"
      />
    </div>
  );
}

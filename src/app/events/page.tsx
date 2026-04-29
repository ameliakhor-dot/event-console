import { EmptyState } from "@/components/shared/empty-state";

export default function EventsPage() {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <EmptyState
        title="No events yet."
        description="Create your first event to start building your pipeline."
        actionLabel="New Event"
        actionHref="/events/new"
      />
    </div>
  );
}

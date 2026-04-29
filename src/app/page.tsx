import { EmptyState } from "@/components/shared/empty-state";
import { TriageList } from "@/components/dashboard/triage-list";

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
      <EmptyState
        title="No events yet."
        description="Let's start with one."
        actionLabel="Create your first event"
        actionHref="/events/new"
      />

      <TriageList />

      <section className="space-y-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-graphite uppercase">This week</p>
          <h2 className="font-serif text-2xl text-ink">Upcoming in the next seven days</h2>
        </div>
        <EmptyState
          title="No events this week."
          description="Create an event and it'll show up here."
        />
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-graphite uppercase">Future</p>
          <h2 className="font-serif text-2xl text-ink">Two weeks out and beyond</h2>
        </div>
        <EmptyState
          title="Nothing in the future yet."
          description="Future events will appear once they're scheduled."
        />
      </section>
    </div>
  );
}

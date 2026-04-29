import { EmptyState } from "@/components/shared/empty-state";

export function TriageList() {
  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs font-semibold tracking-[0.14em] text-graphite uppercase">On fire today</p>
        <h2 className="font-serif text-2xl text-ink">Needs your attention</h2>
      </div>
      <EmptyState
        title="Nothing on fire today."
        description="When events need attention, they'll show up here."
      />
    </section>
  );
}

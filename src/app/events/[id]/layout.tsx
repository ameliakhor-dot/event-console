import { EventDetailHeader } from "@/components/events/event-detail-header";

export default async function EventDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <EventDetailHeader eventId={id} />
      {children}
    </div>
  );
}

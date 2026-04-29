import type { EventStatus } from "@/types";

const statusClassByValue: Record<EventStatus, string> = {
  planning: "text-pending",
  active: "text-tentative",
  completed: "text-confirmed",
};

export function StatusBadge({ status }: { status: EventStatus }) {
  return (
    <span className={`text-[0.65rem] font-semibold tracking-[0.14em] uppercase ${statusClassByValue[status]}`}>
      {status}
    </span>
  );
}

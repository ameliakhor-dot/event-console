export type GuestStatus = "confirmed" | "pending" | "declined" | "tentative";
export type EventType = "dinner" | "lunch" | "reception" | "breakfast" | "other";
export type EventStatus = "planning" | "active" | "completed";

export interface Guest {
  id: string;
  name: string;
  company: string;
  role: string;
  status: GuestStatus;
  email?: string;
  notes: string;
  position: number | null;
}

export interface BriefingCardGuest {
  guestId: string;
  name: string;
  company: string;
  role: string;
  bioLine: string;
  workingOn: string;
  askThemAbout: string;
}

export interface BriefingCard {
  eventSummary: string;
  guests: BriefingCardGuest[];
  generatedAt: string;
}

export interface SeatingOption {
  layoutType: "long_table" | "rounds";
  /** flat string[] for long_table; string[][] (one per round table) for rounds */
  seats: string[] | string[][];
  rationale: string;
  keyPairings: { pair: [string, string]; reasoning: string }[];
}

/** long_table: flat seat index; rounds: { roundIndex, seatIndex } */
export type PinnedSeatPosition = number | { roundIndex: number; seatIndex: number };

export interface SeatingChart {
  options: SeatingOption[];
  activeOptionIndex: number | null;
  /** chart-level layout type — all options share this; drives pin interpretation */
  layoutType: "long_table" | "rounds";
  pinnedSeats: Record<string, PinnedSeatPosition>;
  generatedAt: string;
}

export interface NudgeVariants {
  warm: string;
  neutral: string;
  urgent: string;
}

export interface Nudge {
  guestId: string;
  variants: NudgeVariants;
  editedVariants?: Partial<NudgeVariants>;
  sentAt?: string;
  generatedAt: string;
}

export interface RunOfShowItem {
  id: string;
  time: string;
  label: string;
  durationMinutes: number;
  notes?: string;
}

export interface Event {
  id: string;
  name: string;
  type: EventType;
  date: string;
  venueName: string;
  venueAddress?: string;
  city: string;
  hostName: string;
  hostContext: string;
  targetHeadcount: number;
  status: EventStatus;
  guests: Guest[];
  briefingCard?: BriefingCard;
  seatingChart?: SeatingChart;
  nudges: Record<string, Nudge>;
  runOfShow: RunOfShowItem[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

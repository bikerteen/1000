export const STATUSES = [
  "pending",
  "accepted",
  "rejected",
  "no_answer",
  "missed",
] as const;

export type Status = (typeof STATUSES)[number];

export const CATEGORIES = ["career", "personal"] as const;
export type Category = (typeof CATEGORIES)[number];

export type Shot = {
  id: string;
  /** Running shot number (№). Stays fixed when other shots are edited. */
  n: number;
  title: string;
  target?: string;
  category: Category;
  status: Status;
  /** YYYY-MM-DD the ask went out. Empty = lined up, not sent yet. */
  askedOn?: string;
  /** YYYY-MM-DD the answer came back. */
  answeredOn?: string;
  link?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type Meta = {
  owner: string;
  goal: number;
  /** YYYY-MM-DD — day one of the decade. */
  startedOn: string;
  years: number;
};

export type Data = { meta: Meta; shots: Shot[] };

export type ShotInput = Omit<Shot, "id" | "n" | "createdAt" | "updatedAt"> & {
  id?: string;
};

export const STATUS_META: Record<
  Status,
  { label: string; short: string; flash?: string; sub?: string }
> = {
  pending: { label: "In Play", short: "In play" },
  accepted: {
    label: "Accepted",
    short: "Yes",
    flash: "YES.",
    sub: "Moon landed. Now aim higher.",
  },
  rejected: {
    label: "Rejected",
    short: "No",
    flash: "REJECTED.",
    sub: "That's a receipt you tried. Next.",
  },
  no_answer: {
    label: "No Answer",
    short: "Ghosted",
    flash: "GHOSTED.",
    sub: "Silence counts. Follow up or move on.",
  },
  missed: {
    label: "Missed Out",
    short: "Missed",
    flash: "MISSED.",
    sub: "Timing's a thing. There's always next round.",
  },
};

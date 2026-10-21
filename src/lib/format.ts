import type { Status } from "./types";

export const pad = (n: number, len = 3) => String(n).padStart(len, "0");

/** YYYY-MM-DD → 21.10.26 */
export function fmtDate(iso?: string) {
  if (!iso) return "";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}.${m}.${y.slice(2)}`;
}

const DAY = 86_400_000;
const utc = (iso: string) => Date.parse(`${iso.slice(0, 10)}T00:00:00Z`);

export function addYears(iso: string, years: number) {
  const [y, m, d] = iso.split("-");
  return `${Number(y) + years}-${m}-${d}`;
}

export function daysBetween(a: string, b: string) {
  return Math.round((utc(b) - utc(a)) / DAY);
}

/** Tailwind classes per status. Kept literal so Tailwind can see them. */
export const STATUS_STYLE: Record<
  Status,
  { stamp: string; cell: string; bar: string; flash: string }
> = {
  pending: {
    stamp: "border-current text-ink",
    cell: "bg-paper",
    bar: "bg-ink",
    flash: "bg-ink text-acid",
  },
  accepted: {
    stamp: "border-ink bg-acid text-ink",
    cell: "bg-acid",
    bar: "bg-acid",
    flash: "bg-acid text-ink",
  },
  rejected: {
    stamp: "border-signal text-signal border-double",
    cell: "bg-signal",
    bar: "bg-signal",
    flash: "bg-signal text-ink",
  },
  no_answer: {
    stamp: "border-dashed border-fog text-fog",
    cell: "bg-fog",
    bar: "bg-fog",
    flash: "bg-ink text-paper",
  },
  missed: {
    stamp: "border-cobalt text-cobalt",
    cell: "bg-cobalt",
    bar: "bg-cobalt",
    flash: "bg-cobalt text-paper",
  },
};

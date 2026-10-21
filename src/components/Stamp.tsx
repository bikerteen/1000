import { STATUS_META, type Status } from "@/lib/types";
import { STATUS_STYLE } from "@/lib/format";

export default function Stamp({
  status,
  size = "md",
  tilt = true,
  className = "",
}: {
  status: Status;
  size?: "sm" | "md" | "lg";
  tilt?: boolean;
  className?: string;
}) {
  const sizes = {
    sm: "text-sm px-1.5 py-0.5 border-2",
    md: "text-xl px-2.5 py-1 border-[3px]",
    lg: "text-4xl px-4 py-2 border-4",
  };
  return (
    <span
      className={`display inline-block whitespace-nowrap leading-none ${sizes[size]} ${STATUS_STYLE[status].stamp} ${tilt ? "-rotate-3" : ""} ${className}`}
    >
      {STATUS_META[status].label}
    </span>
  );
}

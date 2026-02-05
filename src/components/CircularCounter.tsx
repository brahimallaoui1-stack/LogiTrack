
"use client";

import { cn } from "@/lib/utils";

interface CircularCounterProps {
  value: number;
  label: string;
  color: string; // CSS color value
  className?: string;
}

export function CircularCounter({ value, label, color, className }: CircularCounterProps) {
  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div
        className="relative flex h-[95px] w-[95px] sm:h-[120px] sm:w-[120px] items-center justify-center rounded-full border-[6px] sm:border-[8px]"
        style={{ borderColor: color }}
      >
        <span className="text-2xl sm:text-4xl font-bold text-foreground">{value}</span>
      </div>
      <span className="text-xs sm:text-sm font-semibold text-muted-foreground text-center">
        {label}
      </span>
    </div>
  );
}

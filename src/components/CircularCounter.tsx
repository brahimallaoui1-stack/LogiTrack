
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
        className="relative flex h-[80px] w-[80px] sm:h-[110px] sm:w-[110px] items-center justify-center rounded-full border-[6px] sm:border-[8px]"
        style={{ borderColor: color }}
      >
        <span className="text-xl sm:text-3xl font-bold text-foreground">{value}</span>
      </div>
      <span className="text-[10px] sm:text-xs font-medium text-muted-foreground text-center max-w-[70px] sm:max-w-none">
        {label}
      </span>
    </div>
  );
}

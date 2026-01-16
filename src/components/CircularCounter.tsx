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
        className="relative flex h-[120px] w-[120px] items-center justify-center rounded-full border-[10px]"
        style={{ borderColor: color }}
      >
        <span className="text-4xl font-bold text-foreground">{value}</span>
      </div>
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
    </div>
  );
}

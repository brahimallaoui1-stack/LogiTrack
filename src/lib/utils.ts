import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, parseISO } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string | undefined | null, dateFormat: string = "dd-MM-yyyy") {
    if (!dateString) return "N/A";
    try {
        const date = parseISO(dateString);
        return format(date, dateFormat);
    } catch (e) {
        // Fallback for dates that might not be ISO strings but are valid for new Date()
        try {
            const date = new Date(dateString);
            return format(date, dateFormat);
        } catch (e2) {
            return "Date invalide";
        }
    }
}

const chartColors = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-6))",
  "hsl(var(--chart-7))",
  "hsl(var(--chart-8))",
  "hsl(var(--chart-9))",
  "hsl(var(--chart-10))",
  "hsl(var(--chart-11))",
  "hsl(var(--chart-12))",
  "hsl(var(--chart-13))",
  "hsl(var(--chart-14))",
  "hsl(var(--chart-15))",
];

export function getCityColor(index: number): string {
  return chartColors[index % chartColors.length];
}

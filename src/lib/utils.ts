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
];

// Simple hash function to get a consistent index for a city name
const simpleHash = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
};


export function getCityColor(city: string): string {
  if (!city) {
    return chartColors[0];
  }
  const index = simpleHash(city) % chartColors.length;
  return chartColors[index];
}
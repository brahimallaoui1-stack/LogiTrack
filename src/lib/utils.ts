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

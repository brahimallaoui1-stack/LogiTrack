import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, parseISO } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string | undefined | null) {
    if (!dateString) return "N/A";
    try {
        return format(parseISO(dateString), "dd-MM-yyyy");
    } catch (e) {
        return "Date invalide";
    }
}

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getProjectColor = (category: string = 'work', customColor?: string): string => {
  // Use custom color if provided
  if (customColor) {
    return customColor;
  }

  // Fallback to category-based colors
  switch (category) {
    case 'personal':
      return 'hsl(150, 45%, 45%)'; // Darker professional green
    case 'home':
      return 'hsl(25, 95%, 53%)'; // Orange
    case 'work':
    default:
      return '#4DA8DA'; // Blue - keep existing work color
  }
};

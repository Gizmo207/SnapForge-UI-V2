import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** The standard shadcn class-name helper used by the landing vault components. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

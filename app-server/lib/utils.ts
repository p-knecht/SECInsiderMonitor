import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Auxiliary function to merge Tailwind CSS classes. (default function --> no changes or modifications)
 *
 * @param {ClassValue[]} inputs - The classes to merge
 * @returns {string} - The merged classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getTagColor(tagName: string): string {
  return tagName === 'Lead Qualificado Pela IA' 
    ? 'hsl(var(--tag-qualified))' 
    : 'hsl(var(--tag-default))'
}

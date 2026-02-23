import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const shortenAddress = (addr: string) => `${addr.substring(0, 6)}...${addr.substring(62)}`

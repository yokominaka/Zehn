import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTone(tone: string): string {
  if (!tone) return tone;
  if (/khuwar(?! \/ exhausted)/i.test(tone)) {
    return tone.replace(/khuwar/i, "Khuwar / Exhausted");
  }
  return tone;
}

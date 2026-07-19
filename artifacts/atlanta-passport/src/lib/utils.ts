import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Google Drive share links (drive.google.com/file/d/<id>/view or
// open?id=<id>) are HTML pages, not images, so <img src> silently fails —
// and private files also require Google auth. Rewrite them to our API's
// Drive image proxy, which streams the file via the server's Drive
// connector; leave every other URL untouched.
export function toDirectImageUrl(url: string): string {
  const m =
    url.match(/drive\.google\.com\/file\/d\/([\w-]+)/) ??
    url.match(/drive\.google\.com\/(?:open|uc)\?.*?id=([\w-]+)/);
  return m ? `/api/drive-image/${m[1]}` : url;
}

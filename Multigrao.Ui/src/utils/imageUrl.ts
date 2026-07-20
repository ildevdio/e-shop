const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5050';

export function imageUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('/')) return API_URL + url;
  return url;
}

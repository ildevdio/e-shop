const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5050';

export function imageUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('/uploads/')) return API_URL + '/api/Upload/' + url.slice(9);
  if (url.startsWith('/')) return API_URL + url;
  return url;
}

export function midiaUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) {
    try {
      const u = new URL(url);
      const host = u.hostname.toLowerCase();
      if (host === 'localhost' || host === '127.0.0.1' || host === '::1') {
        return API_URL + u.pathname + u.search;
      }
      return url;
    } catch {
      return url;
    }
  }
  if (url.startsWith('/api/Upload/')) return API_URL + url;
  if (url.startsWith('/uploads/')) return API_URL + '/api/Upload/' + url.slice(9);
  return url;
}

export function produtoImagemUrl(p: { id?: number; imagemUrl?: string | null; imagemContentType?: string | null }): string | undefined {
  if (p.imagemContentType && p.id) return API_URL + '/api/Produtos/' + p.id + '/imagem';
  if (p.imagemUrl) return imageUrl(p.imagemUrl);
  return undefined;
}

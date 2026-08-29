import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function importHtml() {
  const candidates = [
    join(__dirname, '_index.template.html'),
    join(process.cwd(), 'api', 'seo', '_index.template.html'),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return readFileSync(p, 'utf8');
  }
  return null;
}

const template = importHtml();

const API_URL = (process.env.SEO_API_URL || process.env.API_URL || process.env.VITE_API_URL || '').replace(/\/$/, '');

function esc(s: string): string {
  return (s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function absoluteUrl(href: string | null | undefined, base: string): string {
  if (!href) return '';
  if (/^https?:\/\//i.test(href)) return href;
  // uploads servidos pela API
  if (href.startsWith('/uploads/')) {
    return (API_URL || base) + '/api/Upload/' + href.slice(9);
  }
  if (href.startsWith('/api/')) return (API_URL || base) + href;
  return base + href;
}

function injectMeta(html: string, meta: {
  title: string;
  description: string;
  image: string;
  url: string;
  siteName: string;
  type?: string;
}) {
  const title = meta.title || 'Multigrãos - Sistema de Gestão';
  const description = meta.description || 'Sistema de gestão';
  const image = meta.image || '';
  const url = esc(meta.url);
  const siteName = esc(meta.siteName || title);

  const titleTag = `<title>${esc(title)}</title>`;
  const descriptionTags =
    `<meta name="description" content="${esc(description)}" />\n` +
    `    <meta property="og:title" content="${esc(title)}" />\n` +
    `    <meta property="og:description" content="${esc(description)}" />\n` +
    `    <meta property="og:type" content="${meta.type || 'website'}" />\n` +
    `    <meta property="og:site_name" content="${siteName}" />\n` +
    (image ? `<meta property="og:image" content="${esc(image)}" />\n    ` : '') +
    (url ? `<meta property="og:url" content="${url}" />\n    <link rel="canonical" href="${url}" />\n    ` : '');

  // Remove quaisquer tags antigas de descrição/OG/canonical para evitar duplicação
  let out = html
    .replace(/\s*<meta name="description"[^>]*>\s*|\s*<meta\s+property="og:[^"]*"[^>]*>\s*/gi, '\n')
    .replace(/\s*<link rel="canonical"[^>]*>\s*/gi, '\n')
    .replace(/\s*<meta name="twitter:[^"]*"[^>]*>\s*/gi, '\n');

  const titleRe = /<title>[\s\S]*?<\/title>/i;
  out = out.replace(titleRe, titleTag);
  const head = out.indexOf('</head>');
  if (head !== -1) {
    out = out.slice(0, head) + '    ' + descriptionTags + '\n  ' + out.slice(head);
  }
  return out;
}

function baseUrl(req: { headers: Record<string, string | string[] | undefined> }): string {
  const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
  const host = (req.headers['x-forwarded-host'] as string) || (req.headers.host as string) || '';
  return `${proto}://${host}`;
}

export default async function handler(
  req: { url?: string; headers: Record<string, string | string[] | undefined>; query?: Record<string, string | string[] | undefined> },
  res: { setHeader: (k: string, v: string) => void; statusCode: number; end: (b: string) => void }
) {
  const q = req.query || {};
  const type = (q.type as string) || '';
  const path = (q.path as string) || '';
  const origUrl = (req.url || '').split('?')[0];

  const base = baseUrl(req);
  const url = base + origUrl;

  if (type === 'robots' || origUrl === '/robots.txt') {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    const robots = `User-agent: *\nAllow: /\n\nSitemap: ${esc(base)}/sitemap.xml\n`;
    res.statusCode = 200;
    res.end(robots);
    return;
  }

  if (type === 'sitemap' || origUrl === '/sitemap.xml') {
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    let body = '';
    try {
      const resp = await fetch(`${API_URL}/api/Configuracoes/seo/sitemap`, { signal: AbortSignal.timeout(6000) });
      if (resp.ok) {
        const lojas = (await resp.json()) as { slug?: string }[];
        const hoje = new Date().toISOString().slice(0, 10);
        body = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
        for (const l of lojas) {
          const slug = esc(l.slug || '');
          const loc = `${base}/${slug}/commerce`;
          body += `\n  <url>\n    <loc>${esc(loc)}</loc>\n    <lastmod>${hoje}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>`;
        }
        body += '\n</urlset>';
      } else {
        body = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>';
      }
    } catch {
      body = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>';
    }
    res.statusCode = 200;
    res.end(body);
    return;
  }

  if (!template) {
    res.statusCode = 500;
    res.end('Template não encontrado.');
    return;
  }

  // Tenta pré-renderizar os metadados da loja (somente para páginas de loja pública)
  const seg = path.split('/').filter(Boolean);
  const slug = seg[0] || '';
  const eCommerce = seg.includes('commerce');

  let html = template;
  if (slug && (eCommerce || seg.length <= 1)) {
    try {
      const resp = await fetch(`${API_URL}/api/Configuracoes/seo/${encodeURIComponent(slug)}`, {
        signal: AbortSignal.timeout(6000),
      });
      if (resp.ok) {
        const d = (await resp.json()) as {
          nomeEmpresa?: string;
          slogan?: string | null;
          logourl?: string | null;
          tipoEmpresa?: string;
        };
        const landing = eCommerce ? `${base}/${slug}/commerce` : `${base}/${slug}`;
        html = injectMeta(template, {
          title: d.nomeEmpresa || 'Multigrãos',
          description: d.slogan || d.nomeEmpresa || 'Loja virtual',
          image: absoluteUrl(d.logourl || '', base),
          url: landing,
          siteName: d.nomeEmpresa || 'Multigrãos',
          type: eCommerce ? 'website' : 'website',
        });
      }
    } catch {
      // segue com o template padrão
    }
  } else {
    const isFocus = slug === 'focus';
    const appName = isFocus ? 'Focus Solutions' : (slug ? slug.charAt(0).toUpperCase() + slug.slice(1) : 'Multigrãos');
    html = injectMeta(template, {
      title: appName,
      description: isFocus ? 'Plataforma de Gestão' : 'Sistema de gestão',
      image: `${base}/multigraos-logo.png`,
      url: url,
      siteName: appName,
    });
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300, stale-while-revalidate=600');
  res.statusCode = 200;
  res.end(html);
}

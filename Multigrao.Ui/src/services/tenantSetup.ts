import axios from 'axios';

export function getSlug(): string {
  return window.location.pathname.split('/')[1] || '';
}

export function isShopDomain(): boolean {
  const host = window.location.hostname.toLowerCase();
  return host === 'shop.focus-solutions.tech' || host.startsWith('shop.');
}

export function tenantHeaders(): Record<string, string> {
  const slug = getSlug();
  return slug ? { 'X-Tenant-Slug': slug } : {};
}

export function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

axios.interceptors.request.use((config) => {
  const slug = getSlug();
  if (slug && config.headers) {
    config.headers['X-Tenant-Slug'] = slug;
  }
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

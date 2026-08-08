export function formatEstoque(v: number): string {
  if (!Number.isFinite(v)) return '0';
  return Number.isInteger(v)
    ? String(v)
    : v.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
}

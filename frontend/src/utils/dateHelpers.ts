export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function toInputDate(dateStr: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toISOString().slice(0, 10);
}

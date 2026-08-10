export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('th-TH-u-ca-gregory', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(toLocalDate(dateStr));
}

export function formatMonthYear(year: number, month: number): string {
  return new Intl.DateTimeFormat('th-TH-u-ca-gregory', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, 1));
}

export function formatLongDate(dateStr: string): string {
  return new Intl.DateTimeFormat('th-TH-u-ca-gregory', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(toLocalDate(dateStr));
}

export function toLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day);
}

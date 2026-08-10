const CATEGORY_COLORS: Record<string, string> = {
  Food: '#f97316',
  อาหาร: '#f97316',
  Transport: '#3b82f6',
  เดินทาง: '#3b82f6',
  Utilities: '#eab308',
  ค่าสาธารณูปโภค: '#eab308',
  Healthcare: '#ec4899',
  สุขภาพ: '#ec4899',
  Shopping: '#a855f7',
  ช้อปปิ้ง: '#a855f7',
  Entertainment: '#14b8a6',
  ความบันเทิง: '#14b8a6',
  Salary: '#22c55e',
  เงินเดือน: '#22c55e',
  Bonus: '#10b981',
  โบนัส: '#10b981',
  Freelance: '#06b6d4',
  งานเสริม: '#06b6d4',
  Other: '#9ca3af',
  'อื่น ๆ': '#9ca3af',
};

const FALLBACK_COLORS = [
  '#f97316', '#3b82f6', '#eab308', '#ec4899', '#a855f7',
  '#14b8a6', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16',
];

export function getCategoryColor(category: string, index: number): string {
  return CATEGORY_COLORS[category] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

/** 0-based joriy sahifa va jami sahifalar — bosiladigan raqamlar (+ … chetlar) */
export type AdminPageNavItem = number | 'ellipsis';

/**
 * `/admin/users` bilan bir xil: sahifa raqamlari + ellipsis.
 * `totalPages` kamida 1 deb qabul qilinadi (UI uchun).
 */
export function adminPaginationItems(currentZeroBased: number, totalPages: number): AdminPageNavItem[] {
  const total = Math.max(1, totalPages);
  const cur = Math.min(Math.max(0, currentZeroBased), total - 1);
  if (total <= 9) {
    return Array.from({ length: total }, (_, i) => i);
  }
  const s = new Set<number>();
  s.add(0);
  s.add(total - 1);
  for (let d = -2; d <= 2; d++) {
    const p = cur + d;
    if (p >= 0 && p < total) s.add(p);
  }
  const nums = Array.from(s).sort((a, b) => a - b);
  const out: AdminPageNavItem[] = [];
  for (let i = 0; i < nums.length; i++) {
    if (i > 0 && nums[i] - nums[i - 1] > 1) out.push('ellipsis');
    out.push(nums[i]);
  }
  return out;
}

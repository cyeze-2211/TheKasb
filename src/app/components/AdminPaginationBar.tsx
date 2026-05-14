import { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { adminPaginationItems } from '../lib/adminPagination';
import { btnSecondary, ctlSelect } from './pageChrome';

const DEFAULT_PAGE_SIZES = [20, 50, 100, 200] as const;

export type AdminPaginationBarProps = {
  /** 0-based */
  page: number;
  totalPages: number;
  pageSize: number;
  rowsOnPage: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
  /** Berilmasa «Sahifada» tanlovi chiqmaydi */
  onPageSizeChange?: (size: number) => void;
  /** Default: [20, 50, 100, 200] */
  pageSizeOptions?: readonly number[];
  className?: string;
};

/**
 * Admin jadval pastki qismi — `/admin/users` pagination bilan bir xil ko‘rinish.
 */
export function AdminPaginationBar({
  page,
  totalPages,
  pageSize,
  rowsOnPage,
  loading = false,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZES,
  className = '',
}: AdminPaginationBarProps) {
  const total = Math.max(1, totalPages);
  const displayPageOneBased = Math.min(Math.max(0, page), total - 1) + 1;
  const canPrev = page > 0;
  const canNext = page < total - 1;

  const paginationItems = useMemo(() => adminPaginationItems(page, total), [page, total]);

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 border-t border-border px-6 py-4 text-sm text-text-muted ${className}`.trim()}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span>
          Sahifa: <span className="tabular-nums text-text-primary">{displayPageOneBased}</span> /{' '}
          <span className="tabular-nums text-text-primary">{total}</span>
          {' · Sahifada '}
          <span className="tabular-nums">{rowsOnPage}</span> / <span className="tabular-nums">{pageSize}</span>
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {onPageSizeChange ? (
          <label className="flex items-center gap-2">
            <span className="text-xs">Sahifada</span>
            <select
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
              }}
              className={`${ctlSelect} h-9 min-w-[5.5rem] py-0 text-xs`}
            >
              {pageSizeOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            className={`${btnSecondary} inline-flex h-9 items-center gap-1 px-2.5 text-xs`}
            disabled={!canPrev || loading}
            onClick={() => onPageChange(Math.max(0, page - 1))}
            aria-label="Oldingi sahifa"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2} aria-hidden />
          </button>
          {paginationItems.map((item, idx) =>
            item === 'ellipsis' ? (
              <span
                key={`e-${idx}`}
                className="inline-flex min-w-[1.75rem] select-none items-center justify-center px-0.5 text-xs text-text-muted"
                aria-hidden
              >
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                disabled={loading}
                onClick={() => onPageChange(item)}
                aria-label={`${item + 1}-sahifa`}
                aria-current={item === page ? 'page' : undefined}
                className={
                  item === page
                    ? `inline-flex h-9 min-w-[2.25rem] items-center justify-center rounded-lg border border-primary bg-primary/15 px-2 text-xs font-semibold tabular-nums text-primary`
                    : `inline-flex h-9 min-w-[2.25rem] items-center justify-center rounded-lg border border-border/80 bg-surface px-2 text-xs font-medium tabular-nums text-text-primary transition-colors hover:border-border hover:bg-muted/30 disabled:opacity-50`
                }
              >
                {item + 1}
              </button>
            ),
          )}
          <button
            type="button"
            className={`${btnSecondary} inline-flex h-9 items-center gap-1 px-2.5 text-xs`}
            disabled={!canNext || loading}
            onClick={() => onPageChange(page + 1)}
            aria-label="Keyingi sahifa"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={2} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}

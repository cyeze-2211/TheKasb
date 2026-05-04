/**
 * Kasb admin — “elite” chrome: controls, surfaces, tables.
 * Barcha mavjud sahifalar shu tokenlardan foydalanadi.
 */

/** Asosiy ko‘tarilgan kartochkalar (jadval, bo‘limlar) */
export const panelElite =
  'overflow-hidden rounded-2xl border border-border/80 bg-surface/95 shadow-[var(--elite-shadow-md)] ring-1 ring-[var(--elite-ring)] [box-shadow:var(--elite-inset),var(--elite-shadow-md)] transition-[box-shadow,border-color,transform] duration-500 ease-out hover:border-border hover:shadow-[var(--elite-inset),var(--elite-shadow-lg)]'

/** Sticky profil kartasi — overflow yo‘q (sticky ishlashi uchun) */
export const panelEliteRaised =
  'rounded-2xl border border-border/80 bg-surface/95 shadow-[var(--elite-shadow-md)] ring-1 ring-[var(--elite-ring)] [box-shadow:var(--elite-inset),var(--elite-shadow-md)] transition-[box-shadow,border-color,transform] duration-500 ease-out hover:border-border hover:shadow-[var(--elite-inset),var(--elite-shadow-lg)]'

/** Filtrlar / ixcham panellar */
export const panelEliteCompact =
  'overflow-hidden rounded-2xl border border-border/80 bg-surface/95 shadow-[var(--elite-shadow-sm)] ring-1 ring-[var(--elite-ring)] [box-shadow:var(--elite-inset),var(--elite-shadow-sm)] transition-[box-shadow,border-color] duration-500 ease-out hover:shadow-[var(--elite-inset),var(--elite-shadow-md)]'

export const ctlSelect =
  'h-9 min-h-9 w-full rounded-xl border border-border/90 bg-background px-3 py-0 pr-9 text-sm text-text-primary shadow-[var(--elite-shadow-xs)] transition-[color,box-shadow,border-color,background-color] duration-200 focus-visible:border-primary/45 focus-visible:bg-surface focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/12 disabled:cursor-not-allowed disabled:opacity-50'

export const ctlInput =
  'h-9 min-h-9 w-full rounded-xl border border-border/90 bg-background px-3 text-sm text-text-primary shadow-[var(--elite-shadow-xs)] transition-[color,box-shadow,border-color,background-color] duration-200 focus-visible:border-primary/45 focus-visible:bg-surface focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/12 disabled:cursor-not-allowed disabled:opacity-50'

export const ctlSelectLg =
  'h-10 min-h-10 w-full rounded-xl border border-border/90 bg-background px-3 py-0 pr-9 text-sm text-text-primary shadow-[var(--elite-shadow-xs)] transition-[color,box-shadow,border-color,background-color] duration-200 focus-visible:border-primary/45 focus-visible:bg-surface focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/12 disabled:cursor-not-allowed disabled:opacity-50'

export const ctlInputLg =
  'h-10 min-h-10 w-full rounded-xl border border-border/90 bg-background px-3 text-sm text-text-primary shadow-[var(--elite-shadow-xs)] transition-[color,box-shadow,border-color,background-color] duration-200 focus-visible:border-primary/45 focus-visible:bg-surface focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/12 disabled:cursor-not-allowed disabled:opacity-50'

export const ctlTextarea =
  'min-h-[5rem] w-full rounded-xl border border-border/90 bg-background px-3 py-2.5 text-sm text-text-primary shadow-[var(--elite-shadow-xs)] transition-[color,box-shadow,border-color,background-color] duration-200 focus-visible:border-primary/45 focus-visible:bg-surface focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/12 resize-none'

export const iconAction =
  'inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl text-text-muted shadow-[var(--elite-shadow-xs)] transition-all duration-200 hover:bg-muted hover:text-text-primary hover:shadow-[var(--elite-shadow-sm)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20'

export const iconActionDanger =
  'inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl text-danger shadow-[var(--elite-shadow-xs)] transition-all duration-200 hover:bg-danger/10 hover:shadow-[var(--elite-shadow-sm)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/25'

export const btnSecondary =
  'inline-flex h-9 flex-shrink-0 items-center justify-center gap-2 rounded-xl border border-border/90 bg-surface px-4 text-sm font-medium text-text-primary shadow-[var(--elite-shadow-xs)] transition-all duration-200 hover:border-border hover:bg-muted hover:shadow-[var(--elite-shadow-sm)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/12'

export const btnPrimary =
  'inline-flex h-9 flex-shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-primary to-primary-dark px-4 text-sm font-medium text-white shadow-[0_2px_8px_-2px_rgba(37,99,235,0.45),var(--elite-shadow-sm)] transition-all duration-200 hover:brightness-[1.05] hover:shadow-[0_4px_16px_-4px_rgba(37,99,235,0.45)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/35'

/** Form footers & primary actions */
export const btnSecondaryLg =
  'inline-flex h-10 min-h-10 flex-shrink-0 items-center justify-center gap-2 rounded-xl border border-border/90 bg-surface px-6 text-sm font-medium text-text-primary shadow-[var(--elite-shadow-xs)] transition-all duration-200 hover:border-border hover:bg-muted hover:shadow-[var(--elite-shadow-sm)] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/12'

export const btnPrimaryLg =
  'inline-flex h-10 min-h-10 flex-shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-primary to-primary-dark px-6 text-sm font-medium text-white shadow-[0_2px_10px_-2px_rgba(37,99,235,0.5),var(--elite-shadow-sm)] transition-all duration-200 hover:brightness-[1.05] hover:shadow-[0_6px_20px_-6px_rgba(37,99,235,0.45)] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/35'

export const filterFieldGrid =
  'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'

/** Jadval sarlavhasi */
export const theadElite =
  'border-b border-border bg-gradient-to-b from-muted/95 via-muted/80 to-muted/70 backdrop-blur-md'

/** Jadval qatori */
export const rowElite =
  'transition-[background-color,box-shadow] duration-200 ease-out hover:bg-primary/[0.035]'

/** Sahifa sarlavhasi ostidagi matn */
export const pageKicker =
  'text-[11px] font-semibold uppercase tracking-[0.2em] text-text-muted/90'

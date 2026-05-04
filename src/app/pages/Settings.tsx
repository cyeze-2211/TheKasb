import { Settings as SettingsIcon, SlidersHorizontal } from 'lucide-react';
import { pageKicker, panelElite } from '../components/pageChrome';

export function Settings() {
  return (
    <div className="space-y-6 p-6 md:space-y-8 md:p-8">
      <div>
        <p className={`${pageKicker} mb-2`}>The Kasb · Admin</p>
        <h1 className="mb-1">Sozlamalar</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-text-muted">
          Tizim sozlamalari va konfiguratsiya
        </p>
      </div>

      <div className={panelElite}>
        <div className="flex items-center gap-2.5 border-b border-border px-6 py-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-muted/90 text-text-muted ring-1 ring-border/60">
            <SettingsIcon className="h-4 w-4" strokeWidth={2} aria-hidden />
          </span>
          <div>
            <p className="m-0 text-sm font-medium text-text-primary">Tizim sozlamalari</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-text-muted">
              <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              Tez orada mavjud bo&apos;ladi
            </p>
          </div>
        </div>
        <div className="p-6">
          <p className="m-0 text-sm text-text-muted">Sozlamalar sahifasi tez orada qo&apos;shiladi…</p>
        </div>
      </div>
    </div>
  );
}

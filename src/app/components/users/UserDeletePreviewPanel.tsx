import {
  Award,
  FileText,
  Files,
  HardDrive,
  Phone,
  Target,
  UserCircle,
} from 'lucide-react';
import { formatPreviewBytes, type UserDeletePreviewDto } from '../../api/users';

type SectionIcon = typeof FileText;

const SECTION_META: Record<string, { icon: SectionIcon; accent: string }> = {
  document: { icon: FileText, accent: 'from-sky-500/15 to-sky-500/5 text-sky-600 dark:text-sky-400' },
  certificate: {
    icon: Award,
    accent: 'from-amber-500/15 to-amber-500/5 text-amber-600 dark:text-amber-400',
  },
  other: { icon: Files, accent: 'from-violet-500/15 to-violet-500/5 text-violet-600 dark:text-violet-400' },
};

function sectionMeta(id: string) {
  return (
    SECTION_META[id] ?? {
      icon: Files,
      accent: 'from-muted/50 to-muted/20 text-text-muted',
    }
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function FileRow({ file }: { file: UserDeletePreviewDto['sections'][0]['files'][0] }) {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/80 px-3 py-2.5 shadow-[var(--elite-shadow-xs)]">
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-muted/50 text-text-muted">
        <FileText className="h-4 w-4" strokeWidth={2} aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-text-primary">{file.displayName}</p>
        <p className="mt-0.5 flex flex-wrap gap-x-2 gap-y-0 text-xs text-text-muted">
          {file.sizeBytes != null && file.sizeBytes > 0 ? (
            <span>{formatPreviewBytes(file.sizeBytes)}</span>
          ) : null}
          {file.id != null ? <span className="tabular-nums">ID {String(file.id)}</span> : null}
          {file.fileHashId ? (
            <span className="max-w-[10rem] truncate font-mono" title={file.fileHashId}>
              {file.fileHashId.length > 16 ? `${file.fileHashId.slice(0, 12)}…` : file.fileHashId}
            </span>
          ) : null}
        </p>
      </div>
    </li>
  );
}

function FileSection({
  section,
}: {
  section: UserDeletePreviewDto['sections'][number];
}) {
  const { icon: Icon, accent } = sectionMeta(section.id);
  const count = section.files.length;

  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-surface/60 ring-1 ring-border/40">
      <div
        className={`flex items-center justify-between gap-2 border-b border-border/60 bg-gradient-to-r px-4 py-3 ${accent}`}
      >
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 flex-shrink-0" strokeWidth={2} aria-hidden />
          <span className="text-sm font-semibold text-text-primary">{section.label}</span>
        </div>
        <span className="rounded-full border border-border/50 bg-background/80 px-2 py-0.5 text-xs font-semibold tabular-nums text-text-muted">
          {count} ta
        </span>
      </div>
      {count === 0 ? (
        <p className="px-4 py-4 text-center text-xs text-text-muted">Fayl yo‘q</p>
      ) : (
        <ul className="max-h-40 space-y-2 overflow-y-auto p-3">
          {section.files.map((file, i) => (
            <FileRow key={`${section.id}-${file.id ?? file.fileHashId ?? i}`} file={file} />
          ))}
        </ul>
      )}
    </div>
  );
}

export function UserDeletePreviewPanel({ preview }: { preview: UserDeletePreviewDto }) {
  const displayName = preview.fullName || '—';
  const ini = initials(displayName);

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-2xl border border-danger/25 bg-gradient-to-br from-danger/8 via-background to-background p-4 ring-1 ring-danger/15">
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/25 to-primary/5 text-lg font-bold text-primary ring-2 ring-primary/15">
            {ini || <UserCircle className="h-7 w-7 opacity-80" aria-hidden />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-text-muted">O‘chiriladigan hisob</p>
            <p className="mt-0.5 truncate text-lg font-semibold text-text-primary">{displayName}</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-muted">
              {preview.userId != null ? (
                <span className="tabular-nums">
                  ID <span className="font-medium text-text-primary">{preview.userId}</span>
                </span>
              ) : null}
              {preview.phoneNumber ? (
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 flex-shrink-0" aria-hidden />
                  <span className="mono text-text-primary">{preview.phoneNumber}</span>
                </span>
              ) : null}
            </div>
          </div>
          <div
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
              preview.hasCandidateProfile
                ? 'border-primary/40 bg-primary/10 text-primary'
                : 'border-border/70 bg-muted/30 text-text-muted'
            }`}
          >
            <Target className="h-3.5 w-3.5" aria-hidden />
            {preview.hasCandidateProfile ? 'Nomzod profili bor' : 'Nomzod profili yo‘q'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3 ring-1 ring-border/30">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-text-muted">
            <Files className="h-3.5 w-3.5" aria-hidden />
            Jami fayllar
          </div>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-text-primary">
            {preview.totalFileCount.toLocaleString('uz-UZ')}
          </p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3 ring-1 ring-border/30">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-text-muted">
            <HardDrive className="h-3.5 w-3.5" aria-hidden />
            Hajm
          </div>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-text-primary">
            {formatPreviewBytes(preview.totalSizeBytes)}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Fayllar bo‘yicha</p>
        {preview.sections.map((section) => (
          <FileSection key={section.id} section={section} />
        ))}
      </div>

      {preview.totalFileCount === 0 ? (
        <p className="rounded-xl border border-dashed border-border/80 bg-muted/15 px-4 py-3 text-center text-sm text-text-muted">
          Bog‘langan fayl topilmadi — faqat hisob ma’lumotlari o‘chiriladi.
        </p>
      ) : (
        <p className="rounded-xl border border-danger/20 bg-danger/5 px-4 py-2.5 text-xs leading-relaxed text-danger">
          Yuqoridagi barcha fayllar va bog‘liq yozuvlar butunlay o‘chiriladi. Bu amalni qaytarib bo‘lmaydi.
        </p>
      )}
    </div>
  );
}

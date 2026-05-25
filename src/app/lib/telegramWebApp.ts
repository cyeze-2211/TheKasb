/**
 * Telegram Mini App — https://core.telegram.org/bots/webapps
 * `index.html` da `telegram-web-app.js` yuklangan bo‘lishi kerak.
 */

export type TelegramSafeAreaInsets = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};

type TelegramWebAppLite = {
  ready: () => void;
  expand: () => void;
  disableVerticalSwipes?: () => void;
  viewportHeight?: number;
  viewportStableHeight?: number;
  contentSafeAreaInset?: Partial<TelegramSafeAreaInsets>;
  safeAreaInset?: Partial<TelegramSafeAreaInsets>;
  onEvent?: (eventType: string, eventHandler: () => void) => void;
  offEvent?: (eventType: string, eventHandler: () => void) => void;
  initDataUnsafe?: {
    user?: { id?: unknown };
    start_param?: unknown;
  };
};

function readInsetSide(raw: unknown): number {
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return 0;
  return Math.max(0, Math.trunc(raw));
}

function mergeInsetPair(
  a?: Partial<TelegramSafeAreaInsets>,
  b?: Partial<TelegramSafeAreaInsets>,
): TelegramSafeAreaInsets {
  return {
    top: Math.max(readInsetSide(a?.top), readInsetSide(b?.top)),
    bottom: Math.max(readInsetSide(a?.bottom), readInsetSide(b?.bottom)),
    left: Math.max(readInsetSide(a?.left), readInsetSide(b?.left)),
    right: Math.max(readInsetSide(a?.right), readInsetSide(b?.right)),
  };
}

/** Telegram Mini App — kontent va tizim safe-area (px) */
export function readTelegramSafeAreaInsets(): TelegramSafeAreaInsets {
  const wa = tg();
  if (!wa) return { top: 0, bottom: 0, left: 0, right: 0 };
  return mergeInsetPair(wa.contentSafeAreaInset, wa.safeAreaInset);
}

/** Telegram ichidagi haqiqiy ko‘rinadigan balandlik (px) */
export function readTelegramViewportHeightPx(): number | null {
  const wa = tg();
  if (!wa) return null;
  const h = wa.viewportStableHeight ?? wa.viewportHeight;
  if (typeof h !== 'number' || !Number.isFinite(h) || h <= 0) return null;
  return Math.trunc(h);
}

/** Mini App, visualViewport yoki `innerHeight` */
export function readPortalViewportHeightPx(): number {
  if (typeof window === 'undefined') return 0;
  const tgH = readTelegramViewportHeightPx();
  if (tgH != null && tgH > 0) return tgH;
  const vv = window.visualViewport?.height;
  if (typeof vv === 'number' && vv > 0) return Math.trunc(vv);
  return Math.trunc(window.innerHeight);
}

export function subscribeTelegramViewportInsets(onChange: () => void): () => void {
  const wa = tg();
  if (!wa?.onEvent) return () => undefined;
  const handler = () => onChange();
  try {
    wa.onEvent('viewportChanged', handler);
    wa.onEvent('safeAreaChanged', handler);
  } catch {
    return () => undefined;
  }
  return () => {
    try {
      wa.offEvent?.('viewportChanged', handler);
      wa.offEvent?.('safeAreaChanged', handler);
    } catch {
      /* ignore */
    }
  };
};

type TelegramGlobal = {
  Telegram?: { WebApp?: TelegramWebAppLite };
};

function tg(): TelegramWebAppLite | undefined {
  if (typeof window === 'undefined') return undefined;
  return (window as unknown as TelegramGlobal).Telegram?.WebApp;
}

/**
 * Haqiqiy Telegram Mini App konteksti (oddiy brauzerda `false`).
 * URL `?tg=` alohida — CandidatePortal da qo‘lda deep link sifatida ishlatiladi.
 */
export function isTelegramMiniApp(): boolean {
  const wa = tg();
  if (!wa) return false;
  try {
    const unsafe = wa.initDataUnsafe;
    if (unsafe && typeof unsafe === 'object') {
      if (unsafe.user != null && typeof unsafe.user === 'object') return true;
      if (typeof unsafe.start_param === 'string' && unsafe.start_param.trim() !== '') return true;
    }
    const initData = (wa as { initData?: string }).initData;
    if (typeof initData === 'string' && initData.length > 0) return true;
  } catch {
    return false;
  }
  return false;
}

/** Mini App ochilganda chaqiring: klaviatura / viewport bilan muammo kamayadi */
export function initTelegramMiniApp(): boolean {
  const wa = tg();
  if (!wa) return false;
  try {
    wa.ready();
    wa.expand();
    if (typeof wa.disableVerticalSwipes === 'function') wa.disableVerticalSwipes();
  } catch {
    /* ignore */
  }
  return true;
}

/** Shaxsiy chatda odatda `user.id` === `chatId` */
export function readTelegramWebAppUserId(): string {
  try {
    const id = tg()?.initDataUnsafe?.user?.id;
    if (typeof id === 'number' && Number.isFinite(id)) return String(Math.trunc(id));
    if (typeof id === 'string' && /^-?\d+$/.test(id.trim())) return id.trim();
  } catch {
    /* ignore */
  }
  return '';
}

/**
 * Bot: `startapp=123` yoki `?startapp=...` orqali kelgan param —
 * faqat butun son ko‘rinishida bo‘lsa `by-tg` uchun ishlatiladi.
 */
export function readTelegramStartParamNumeric(): string {
  try {
    const sp = tg()?.initDataUnsafe?.start_param;
    if (typeof sp === 'string') {
      const t = sp.trim();
      if (/^-?\d+$/.test(t)) return t;
    }
  } catch {
    /* ignore */
  }
  return '';
}

export function readTelegramMiniAppChatId(): string {
  return readTelegramWebAppUserId() || readTelegramStartParamNumeric();
}

export type TelegramEntryContext = 'telegram_mini_app' | 'web_browser';

/** Mini App (Telegram WebApp SDK) yoki oddiy brauzer */
export function getTelegramEntryContext(): TelegramEntryContext {
  return isTelegramMiniApp() ? 'telegram_mini_app' : 'web_browser';
}

export function isTelegramMiniAppEntry(): boolean {
  return getTelegramEntryContext() === 'telegram_mini_app';
}

/** UI / log uchun qisqa yorliq */
export function telegramEntryContextLabel(ctx: TelegramEntryContext): string {
  return ctx === 'telegram_mini_app' ? 'Telegram Mini App' : 'Veb-brauzer';
}

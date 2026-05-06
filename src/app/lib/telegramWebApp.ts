/**
 * Telegram Mini App — https://core.telegram.org/bots/webapps
 * `index.html` da `telegram-web-app.js` yuklangan bo‘lishi kerak.
 */

type TelegramWebAppLite = {
  ready: () => void;
  expand: () => void;
  disableVerticalSwipes?: () => void;
  initDataUnsafe?: {
    user?: { id?: unknown };
    start_param?: unknown;
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

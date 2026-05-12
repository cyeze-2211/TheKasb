const MAX_SAFE = Number.MAX_SAFE_INTEGER;
/** Real Telegram user id lar bilan chalkashmasin — sintetik diapazon. */
const SYNTHETIC_BASE = 4_000_000_000_000_000;
const SYNTHETIC_SPAN = MAX_SAFE - SYNTHETIC_BASE;

/**
 * Telegram URL / Mini App dan chatId kelmaganda bazadagi `telegram_chat_id` UNIQUE
 * uchun takrorlanmas raqam. SMS OTP (tasdiqlangan kod) ixtiyoriy aralashtiriladi.
 */
export function syntheticTelegramChatId(options?: { otpCode?: string }): number {
  const buf = new Uint32Array(2);
  crypto.getRandomValues(buf);
  const r = Number(buf[0]!) * 0x100000000 + Number(buf[1]!);

  const otpRaw = options?.otpCode?.replace(/\D/g, '') ?? '';
  const otpParsed = otpRaw.length ? parseInt(otpRaw.slice(0, 12), 10) : NaN;
  const otpMix = Number.isFinite(otpParsed) ? otpParsed % 999_983 : 0;

  const roll = (r + otpMix + (Date.now() & 0xffff)) % SYNTHETIC_SPAN;
  return SYNTHETIC_BASE + roll;
}

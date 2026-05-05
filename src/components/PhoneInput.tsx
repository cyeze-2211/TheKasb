import { useCallback } from 'react';

const DIGITS = 9;

function formatDisplay(nine: string): string {
  const a = nine.slice(0, 2);
  const b = nine.slice(2, 5);
  const c = nine.slice(5, 7);
  const d = nine.slice(7, 9);
  const parts = [a, b, c, d].filter(Boolean);
  return parts.join(' ');
}

type Props = {
  nationalDigits: string;
  onNationalDigitsChange: (digits: string) => void;
  disabled?: boolean;
  id?: string;
};

export function PhoneInput({ nationalDigits, onNationalDigitsChange, disabled, id }: Props) {
  const display = formatDisplay(nationalDigits);

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/\D/g, '').slice(0, DIGITS);
      onNationalDigitsChange(raw);
    },
    [onNationalDigitsChange],
  );

  return (
    <div
      className="flex h-[52px] items-center rounded-[10px] border border-[#2D3748] bg-[#161D2E] transition-all duration-200 focus-within:border-[#3B82F6] focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.15)]"
    >
      <span
        className="flex shrink-0 items-center gap-2 pl-4 font-mono text-[15px] text-white"
        aria-hidden
      >
        <span>🇺🇿</span>
        <span>+998</span>
      </span>
      <span className="mx-3 h-6 w-px shrink-0 bg-[#2D3748]" aria-hidden />
      <input
        id={id}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        disabled={disabled}
        value={display}
        onChange={onChange}
        placeholder="XX XXX XX XX"
        className="min-w-0 flex-1 bg-transparent py-3 pr-4 font-mono text-base text-white outline-none placeholder:text-gray-500"
      />
    </div>
  );
}

export function isCompleteNationalNine(d: string): boolean {
  return d.length === DIGITS;
}

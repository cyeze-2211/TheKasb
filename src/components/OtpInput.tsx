import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const LEN = 6;

type Props = {
  value: string;
  onChange: (code: string) => void;
  disabled?: boolean;
  error?: boolean;
  onFilled?: (code: string) => void;
};

export function OtpInput({ value, onChange, disabled, error, onFilled }: Props) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const [focusedIdx, setFocusedIdx] = useState<number | null>(0);
  const [pulse, setPulse] = useState(false);
  const prevLen = useRef(0);
  const onFilledRef = useRef(onFilled);
  onFilledRef.current = onFilled;

  const digits = Array.from({ length: LEN }, (_, i) => value[i] ?? '');

  useEffect(() => {
    if (value.length === LEN && prevLen.current < LEN) {
      setPulse(true);
      const t = window.setTimeout(() => setPulse(false), 650);
      onFilledRef.current?.(value);
      return () => window.clearTimeout(t);
    }
    prevLen.current = value.length;
  }, [value]);

  const focusAt = useCallback((i: number) => {
    const el = inputsRef.current[Math.max(0, Math.min(LEN - 1, i))];
    requestAnimationFrame(() => {
      el?.focus();
      el?.select();
    });
  }, []);

  const onDigit = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, '');
    if (v.length > 1) {
      onChange(v.slice(0, LEN));
      focusAt(Math.min(v.length, LEN - 1));
      return;
    }
    if (!v) {
      onChange(value.slice(0, idx) + value.slice(idx + 1));
      return;
    }
    const next = (value.slice(0, idx) + v.slice(-1) + value.slice(idx + 1)).slice(0, LEN);
    onChange(next);
    if (idx < LEN - 1) focusAt(idx + 1);
  };

  const onKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[idx] && idx > 0) {
        e.preventDefault();
        const next = value.slice(0, idx - 1) + value.slice(idx);
        onChange(next);
        focusAt(idx - 1);
      }
    }
    if (e.key === 'ArrowLeft' && idx > 0) focusAt(idx - 1);
    if (e.key === 'ArrowRight' && idx < LEN - 1) focusAt(idx + 1);
  };

  const onPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const t = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, LEN);
    onChange(t);
    focusAt(Math.min(Math.max(0, t.length - 1), LEN - 1));
  };

  return (
    <motion.div
      animate={error ? { x: [0, -6, 6, -4, 4, 0] } : false}
      transition={{ duration: 0.45 }}
      className="flex justify-center gap-2"
    >
      {digits.map((ch, i) => {
        const filled = Boolean(ch);
        const focused = focusedIdx === i;
        return (
          <motion.div
            key={i}
            animate={
              pulse && value.length === LEN
                ? {
                    scale: [1, 1.06, 1],
                    boxShadow: [
                      '0 0 0 0 rgba(16,185,129,0)',
                      '0 0 22px rgba(16,185,129,0.4)',
                      '0 0 0 0 rgba(16,185,129,0)',
                    ],
                  }
                : {}
            }
            transition={{ duration: 0.45 }}
            className="rounded-lg"
          >
            <input
              ref={(el) => {
                inputsRef.current[i] = el;
              }}
              type="text"
              inputMode="numeric"
              autoComplete={i === 0 ? 'one-time-code' : 'off'}
              maxLength={1}
              disabled={disabled}
              value={ch}
              onChange={(e) => onDigit(i, e)}
              onKeyDown={(e) => onKeyDown(i, e)}
              onPaste={i === 0 ? onPaste : undefined}
              onFocus={() => {
                setFocusedIdx(i);
                inputsRef.current[i]?.select();
              }}
              onBlur={() => setFocusedIdx((cur) => (cur === i ? null : cur))}
              className={[
                'h-[60px] w-[52px] rounded-lg border bg-[#161D2E] text-center font-mono text-2xl text-white outline-none transition-all duration-200',
                error
                  ? 'border-red-500'
                  : focused
                    ? 'scale-105 border-[#3B82F6] shadow-[0_0_0_3px_rgba(59,130,246,0.2)]'
                    : filled
                      ? 'border-[#374151]'
                      : 'border-[#2D3748]',
              ].join(' ')}
              aria-label={`OTP raqam ${i + 1}`}
            />
          </motion.div>
        );
      })}
    </motion.div>
  );
}

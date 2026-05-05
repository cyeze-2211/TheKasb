import type { CSSProperties, ReactNode } from 'react';

type Props = {
  className?: string;
  rotateDeg?: number;
  animationDelay?: string;
  children: ReactNode;
};

export function FloatingStatCard({
  className = '',
  rotateDeg = 0,
  animationDelay = '0s',
  children,
}: Props) {
  return (
    <div
      className={`kasb-float-card absolute rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 shadow-xl backdrop-blur-[12px] ${className}`}
      style={{ animationDelay, ['--kasb-rot' as string]: `${rotateDeg}deg` } as CSSProperties}
    >
      {children}
    </div>
  );
}

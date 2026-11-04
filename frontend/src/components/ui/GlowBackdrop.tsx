import React from 'react';

export interface GlowBackdropProps {
  className?: string;
  intensity?: 'low' | 'normal' | 'high';
}

/**
 * Atmospheric background decorative glow with a radial orange ellipse
 * and staggered rounded gradient bars. Purely static and aria-hidden.
 */
export const GlowBackdrop: React.FC<GlowBackdropProps> = ({
  className = '',
  intensity = 'normal',
}) => {
  const opacityClass =
    intensity === 'low' ? 'opacity-25' : intensity === 'high' ? 'opacity-65' : 'opacity-45';

  return (
    <div
      className={`absolute inset-0 pointer-events-none overflow-hidden select-none -z-10 ${className}`}
      aria-hidden="true"
    >
      {/* Radial soft orange ellipse */}
      <div
        className={`absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full ${opacityClass}`}
        style={{
          background:
            'radial-gradient(ellipse at 50% 35%, var(--glow-color) 0%, rgba(255,138,76,0.12) 45%, transparent 72%)',
        }}
      />

      {/* Staggered decorative horizontal accent bars */}
      <div className="absolute top-16 right-10 flex flex-col space-y-2 opacity-30 hidden sm:flex">
        <div className="w-48 h-1 rounded-pill bg-gradient-to-r from-orange-500 via-orange-300/40 to-transparent" />
        <div className="w-32 h-1 rounded-pill bg-gradient-to-r from-orange-500/70 via-orange-300/20 to-transparent ml-8" />
        <div className="w-20 h-1 rounded-pill bg-gradient-to-r from-orange-500/40 to-transparent ml-16" />
      </div>

      <div className="absolute top-28 left-6 flex flex-col space-y-2 opacity-25 hidden sm:flex">
        <div className="w-36 h-1 rounded-pill bg-gradient-to-l from-orange-500/60 to-transparent" />
        <div className="w-24 h-1 rounded-pill bg-gradient-to-l from-orange-500/30 to-transparent mr-6" />
      </div>
    </div>
  );
};

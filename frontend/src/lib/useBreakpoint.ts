import { useState, useEffect } from 'react';

export interface Breakpoints {
  width: number;
  isPhone: boolean;       // < 640px
  isTablet: boolean;      // 640px - 1023px
  isDesktopRail: boolean; // 1024px - 1279px
  isWideDesktop: boolean; // >= 1280px
  isBelowSm: boolean;     // < 640px
  isBelowMd: boolean;     // < 768px
  isBelowLg: boolean;     // < 1024px
  isLgUp: boolean;        // >= 1024px
  isXlUp: boolean;        // >= 1280px
}

export function useBreakpoint(): Breakpoints {
  const [width, setWidth] = useState<number>(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1280
  );

  useEffect(() => {
    const handleResize = () => {
      setWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    width,
    isPhone: width < 640,
    isTablet: width >= 640 && width < 1024,
    isDesktopRail: width >= 1024 && width < 1280,
    isWideDesktop: width >= 1280,
    isBelowSm: width < 640,
    isBelowMd: width < 768,
    isBelowLg: width < 1024,
    isLgUp: width >= 1024,
    isXlUp: width >= 1280,
  };
}


import React, { useState, useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export const AppLayout: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [desktopMode, setDesktopMode] = useState<'expanded' | 'rail'>(() => {
    if (typeof window === 'undefined') return 'expanded';
    const stored = localStorage.getItem('pramaan_sidebar_state');
    if (stored === 'expanded' || stored === 'rail') return stored;
    // Default: rail for 1024-1279px, expanded for >= 1280px
    return window.innerWidth >= 1280 ? 'expanded' : 'rail';
  });

  const hamburgerRef = useRef<HTMLButtonElement>(null);

  // Sync default when resizing across the 1280px boundary if user hasn't explicitly set preference
  useEffect(() => {
    const handleResize = () => {
      const stored = localStorage.getItem('pramaan_sidebar_state');
      if (!stored && window.innerWidth >= 1024) {
        setDesktopMode(window.innerWidth >= 1280 ? 'expanded' : 'rail');
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleHamburgerClick = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setDrawerOpen((prev) => !prev);
    } else {
      setDesktopMode((prev) => {
        const next = prev === 'expanded' ? 'rail' : 'expanded';
        localStorage.setItem('pramaan_sidebar_state', next);
        return next;
      });
    }
  };

  return (
    <div className="min-h-[100dvh] bg-bg flex flex-col antialiased">
      {/* Skip to main content for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-orange-500 focus:text-on-orange focus:rounded-pill focus:text-xs font-semibold shadow-floating"
      >
        Skip to main content
      </a>

      {/* Hamburger Navigation: Off-Canvas Drawer (<1024px) & Rail/Sidebar (>=1024px) */}
      <Sidebar
        drawerOpen={drawerOpen}
        onCloseDrawer={() => setDrawerOpen(false)}
        desktopMode={desktopMode}
        hamburgerRef={hamburgerRef}
      />

      {/* Main Content Column */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ease-in-out ${
          desktopMode === 'expanded' ? 'lg:pl-[240px]' : 'lg:pl-[72px]'
        }`}
      >
        <TopBar
          drawerOpen={drawerOpen}
          onHamburgerClick={handleHamburgerClick}
          hamburgerRef={hamburgerRef}
          desktopMode={desktopMode}
        />

        <main
          id="main-content"
          className="flex-1 p-4 sm:p-6 lg:p-8 max-w-app w-full mx-auto pb-safe flex flex-col"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

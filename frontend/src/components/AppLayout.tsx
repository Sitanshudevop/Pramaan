import React, { useState, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export const AppLayout: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  const handleHamburgerClick = () => {
    // Hamburger only operates on screens < 1024px to toggle the off-canvas drawer
    setDrawerOpen((prev) => !prev);
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

      {/* Navigation: Off-Canvas Drawer (<1024px) & Full Persistent 240px Sidebar (>=1024px) */}
      <Sidebar
        drawerOpen={drawerOpen}
        onCloseDrawer={() => setDrawerOpen(false)}
        hamburgerRef={hamburgerRef}
      />

      {/* Main Content Column: Always padded 240px on desktop (>=1024px) */}
      <div className="flex-1 flex flex-col min-w-0 w-full lg:pl-[240px]">
        <TopBar
          drawerOpen={drawerOpen}
          onHamburgerClick={handleHamburgerClick}
          hamburgerRef={hamburgerRef}
        />

        <main
          id="main-content"
          className="flex-1 p-4 sm:p-6 lg:p-8 max-w-app w-full mx-auto pb-safe flex flex-col min-w-0"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Role } from './types';

type Theme = 'light' | 'dark' | 'system';

interface AppContextType {
  role: Role;
  setRole: (role: Role) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  confidentialMode: boolean;
  setConfidentialMode: (enabled: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<Role>('Creator');
  const [confidentialMode, setConfidentialMode] = useState<boolean>(false);
  const [theme, setThemeState] = useState<Theme>(() => {
    return (localStorage.getItem('pramaan_theme') as Theme) || 'system';
  });

  const applyTheme = (t: Theme) => {
    const isDark =
      t === 'dark' ||
      (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem('pramaan_theme', t);
    applyTheme(t);
  };

  useEffect(() => {
    applyTheme(theme);
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') applyTheme('system');
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        theme,
        setTheme,
        confidentialMode,
        setConfidentialMode,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

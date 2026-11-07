import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  AuthSession,
  Role,
  User,
  Workspace,
} from './types';
import {
  authGetMe,
  authSignIn,
  authSignOut,
  authSignUp,
  getAuthToken,
  getCurrentWorkspaceId,
  getDemoWorkspace,
  listWorkspaces,
  setAuthToken,
  setWorkspaceId,
} from './api';

type Theme = 'light' | 'dark' | 'system';

interface AppContextType {
  user: User | null;
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  isDemoMode: boolean;
  role: Role;
  setRole: (role: Role) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  confidentialMode: boolean;
  setConfidentialMode: (enabled: boolean) => void;
  signIn: (email: string, password: string) => Promise<AuthSession>;
  signUp: (email: string, password: string, fullName: string) => Promise<AuthSession>;
  signOut: () => Promise<void>;
  switchWorkspace: (workspaceId: string) => void;
  enterDemoWorkspace: () => void;
  refreshUser: () => Promise<void>;
  refreshWorkspaces: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEMO_WORKSPACE_FALLBACK: Workspace = {
  id: 'ws-demo',
  name: 'Demo Workspace',
  slug: 'demo-workspace',
  industry: 'Fictional Brands Demo',
  is_demo: true,
  retention_days: 30,
  ai_enabled: true,
  role: 'Creator',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(DEMO_WORKSPACE_FALLBACK);
  const [demoRole, setDemoRole] = useState<Role>('Creator');
  const [confidentialMode, setConfidentialMode] = useState<boolean>(false);
  const [theme, setThemeState] = useState<Theme>(() => {
    return (localStorage.getItem('pramaan_theme') as Theme) || 'system';
  });

  const isDemoMode = !user || currentWorkspace?.is_demo === true;
  const role: Role = isDemoMode ? demoRole : currentWorkspace?.role || 'Creator';

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

  // Attempt initial session restore if token exists
  useEffect(() => {
    const token = getAuthToken();
    const storedWsId = getCurrentWorkspaceId();

    if (token) {
      authGetMe()
        .then((session) => {
          setUser(session.user);
          setWorkspaces(session.workspaces);
          const matched = session.workspaces.find((w) => w.id === storedWsId) || session.current_workspace;
          setCurrentWorkspace(matched);
          setWorkspaceId(matched.id);
        })
        .catch(() => {
          // Token invalid/expired: fallback to demo
          setAuthToken(null);
          enterDemoWorkspace();
        });
    } else {
      enterDemoWorkspace();
    }
  }, []);

  const signIn = async (email: string, password: string): Promise<AuthSession> => {
    const session = await authSignIn({ email, password });
    setAuthToken(session.access_token);
    setUser(session.user);
    setWorkspaces(session.workspaces);
    setCurrentWorkspace(session.current_workspace);
    setWorkspaceId(session.current_workspace.id);
    return session;
  };

  const signUp = async (email: string, password: string, fullName: string): Promise<AuthSession> => {
    const session = await authSignUp({ email, password, full_name: fullName });
    setAuthToken(session.access_token);
    setUser(session.user);
    setWorkspaces(session.workspaces);
    setCurrentWorkspace(session.current_workspace);
    setWorkspaceId(session.current_workspace.id);
    return session;
  };

  const signOut = async () => {
    try {
      await authSignOut();
    } catch {
      // ignore
    }
    setAuthToken(null);
    setUser(null);
    setWorkspaces([]);
    enterDemoWorkspace();
  };

  const switchWorkspace = (workspaceId: string) => {
    if (workspaceId === 'ws-demo') {
      enterDemoWorkspace();
      return;
    }
    const target = workspaces.find((w) => w.id === workspaceId);
    if (target) {
      setCurrentWorkspace(target);
      setWorkspaceId(target.id);
    }
  };

  const enterDemoWorkspace = () => {
    setWorkspaceId('ws-demo');
    getDemoWorkspace()
      .then((demoWs: Workspace) => setCurrentWorkspace(demoWs))
      .catch(() => setCurrentWorkspace(DEMO_WORKSPACE_FALLBACK));
  };

  const refreshWorkspaces = async () => {
    if (getAuthToken()) {
      try {
        const wsList = await listWorkspaces();
        setWorkspaces(wsList);
      } catch {
        // ignore
      }
    }
  };

  const refreshUser = async () => {
    if (getAuthToken()) {
      try {
        const session = await authGetMe();
        setUser(session.user);
        setWorkspaces(session.workspaces);
        const currId = getCurrentWorkspaceId();
        const matched = session.workspaces.find((w) => w.id === currId) || session.current_workspace;
        setCurrentWorkspace(matched);
      } catch {
        // ignore
      }
    }
  };

  const setRole = (newRole: Role) => {
    if (isDemoMode) {
      setDemoRole(newRole);
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        currentWorkspace,
        workspaces,
        isDemoMode,
        role,
        setRole,
        theme,
        setTheme,
        confidentialMode,
        setConfidentialMode,
        signIn,
        signUp,
        signOut,
        switchWorkspace,
        enterDemoWorkspace,
        refreshUser,
        refreshWorkspaces,
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

// Revolutionary Design System Theme Provider
// TRADEAI Next-Gen UI

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import designTokens from './tokens';

// Theme types
export type ThemeMode = 'light' | 'dark';
export type ThemeContextType = {
  mode: ThemeMode;
  toggleMode: () => void;
  setMode: (mode: ThemeMode) => void;
};

// Theme context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Theme provider component
export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<ThemeMode>('light');

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedMode = localStorage.getItem('themeMode') as ThemeMode | null;
    if (savedMode) {
      setMode(savedMode);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setMode(prefersDark ? 'dark' : 'light');
    }
  }, []);

  // Apply theme to document
  useEffect(() => {
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('themeMode', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('themeMode', 'light');
    }
  }, [mode]);

  const toggleMode = () => {
    setMode(prevMode => prevMode === 'light' ? 'dark' : 'light');
  };

  const value = {
    mode,
    toggleMode,
    setMode: (newMode: ThemeMode) => setMode(newMode)
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook to use theme
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Get CSS variables for the current theme
export const getCSSVariables = (mode: ThemeMode = 'light') => {
  const colors = designTokens.colors;
  
  if (mode === 'dark') {
    return {
      '--color-primary-main': colors.primary['400'],
      '--color-primary-light': colors.primary['300'],
      '--color-primary-dark': colors.primary['600'],
      '--color-secondary-main': colors.secondary['400'],
      '--color-secondary-light': colors.secondary['300'],
      '--color-secondary-dark': colors.secondary['600'],
      '--color-background-default': colors.neutral[900],
      '--color-background-paper': colors.neutral[800],
      '--color-background-subtle': colors.neutral[900],
      '--color-text-primary': colors.neutral[0],
      '--color-text-secondary': colors.neutral[300],
      '--color-text-tertiary': colors.neutral[400],
      '--color-border-light': colors.neutral[800],
      '--color-border-medium': colors.neutral[700],
      '--color-border-dark': colors.neutral[600],
    };
  }
  
  return {
    '--color-primary-main': colors.primary.main,
    '--color-primary-light': colors.primary.light,
    '--color-primary-dark': colors.primary.dark,
    '--color-secondary-main': colors.secondary.main,
    '--color-secondary-light': colors.secondary.light,
    '--color-secondary-dark': colors.secondary.dark,
    '--color-background-default': colors.background.default,
    '--color-background-paper': colors.background.paper,
    '--color-background-subtle': colors.background.subtle,
    '--color-text-primary': colors.text.primary,
    '--color-text-secondary': colors.text.secondary,
    '--color-text-tertiary': colors.text.tertiary,
    '--color-border-light': colors.border.light,
    '--color-border-medium': colors.border.medium,
    '--color-border-dark': colors.border.dark,
  };
};

// Apply theme to document
export const applyTheme = (mode: ThemeMode) => {
  const variables = getCSSVariables(mode);
  Object.entries(variables).forEach(([key, value]) => {
    document.documentElement.style.setProperty(key, value);
  });
};

export default designTokens;
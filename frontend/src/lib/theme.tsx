import { createContext, useContext, useEffect } from 'react';

type Theme = 'light';

const ThemeCtx = createContext<{ theme: Theme; toggle: () => void }>({
  theme: 'light',
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const el = document.documentElement;
    el.classList.remove('dark');
    el.setAttribute('data-theme', 'light');
    localStorage.removeItem('fa-theme');
  }, []);

  return (
    <ThemeCtx.Provider value={{ theme: 'light', toggle: () => {} }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export const useTheme = () => useContext(ThemeCtx);

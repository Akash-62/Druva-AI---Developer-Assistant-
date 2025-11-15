import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark' | 'oled';

export const useTheme = (): [Theme, () => void] => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = window.localStorage.getItem('theme') as Theme;
      if (savedTheme) {
        return savedTheme;
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  const cycleTheme = () => {
    setTheme(prevTheme => {
        if (prevTheme === 'light') return 'dark';
        if (prevTheme === 'dark') return 'oled';
        return 'light';
    });
  };

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('dark', 'oled');

    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'oled') {
      root.classList.add('dark', 'oled'); // oled inherits dark and overrides
    }
    
    window.localStorage.setItem('theme', theme);
  }, [theme]);

  return [theme, cycleTheme];
};
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeMode, colors } from './colors';

interface ThemeContextType {
    theme: ThemeMode;
    toggleTheme: () => void;
    setTheme: (theme: ThemeMode) => void;
    colors: typeof colors.dark | typeof colors.light;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'uptime-theme-preference';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<ThemeMode>('light');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;

        if (storedTheme) {
            setThemeState(storedTheme);
        } else {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            setThemeState(prefersDark ? 'dark' : 'light');
        }
    }, []);

    useEffect(() => {
        if (!mounted) return;

        const root = document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);

        const currentColors = colors[theme];
        root.style.setProperty('--bg-primary', currentColors.background);
        root.style.setProperty('--fg-primary', currentColors.foreground);
        root.style.setProperty('--color-primary', currentColors.primary);
        root.style.setProperty('--color-secondary', currentColors.secondary);
        root.style.setProperty('--text-primary', currentColors.text.primary);
        root.style.setProperty('--text-secondary', currentColors.text.secondary);
        root.style.setProperty('--text-muted', currentColors.text.muted);
        root.style.setProperty('--border-color', currentColors.border);
        root.style.setProperty('--card-bg', currentColors.card);
        root.style.setProperty('--hover-bg', currentColors.hover);
        root.style.setProperty('--button-primary', currentColors.button.primary);
        root.style.setProperty('--button-primary-hover', currentColors.button.primaryHover);
        root.style.setProperty('--button-text', currentColors.button.text);


        localStorage.setItem(THEME_STORAGE_KEY, theme);
    }, [theme, mounted]);

    const toggleTheme = () => {
        setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
    };

    const setTheme = (newTheme: ThemeMode) => {
        setThemeState(newTheme);
    };

    const value: ThemeContextType = {
        theme,
        toggleTheme,
        setTheme,
        colors: colors[theme],
    };

    if (!mounted) {
        return null;
    }

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}

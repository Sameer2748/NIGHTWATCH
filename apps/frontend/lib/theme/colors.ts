export const colors = {
    dark: {
        background: '#0b0c14',
        foreground: '#ffffff',
        primary: '#01114f',
        secondary: '#e07155',

        text: {
            primary: '#ffffff',
            secondary: '#a0a0a0',
            muted: '#6b6b6b',
            common: '#e07155',
        },
        border: '#2a2b35',
        card: '#16171f',
        hover: '#1f2029',
        button: {
            primary: '#667eea',
            primaryHover: '#5568d3',
            text: '#ffffff',
        },
    },

    light: {
        background: '#f1efd8',
        foreground: '#01114f',
        primary: '#01114f',
        secondary: '#e07155',

        text: {
            primary: '#01114f',
            secondary: '#4a4a4a',
            muted: '#7a7a7a',
            common: '#e07155',
        },
        border: '#d4d2bb',
        card: '#ffffff',
        hover: '#e5e3cc',
        button: {
            primary: '#01114f',
            primaryHover: '#e07155',
            text: '#ffffff',
        },
    },
} as const;

export type ThemeMode = 'light' | 'dark';
export type ColorPalette = typeof colors.dark | typeof colors.light;

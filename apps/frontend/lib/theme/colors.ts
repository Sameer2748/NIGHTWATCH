export type ThemeMode = 'dark' | 'light';

export const colors = {
    dark: {
        background: '#0a0b0f',
        foreground: '#ffffff',
        primary: '#01114f',
        secondary: '#e07155',

        text: {
            primary: '#ffffff',
            secondary: '#a0a0a0',
            muted: '#6b6b6b',
            common: '#e07155',
        },
        border: '#292a36',
        card: '#16171f',
        hover: '#1f2028',
        button: {
            primary: '#e07155',
            primaryHover: '#c85f47',
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
            muted: '#8a8a8a',
            common: '#e07155',
        },
        border: '#d4d2bb',
        card: '#ffffff',
        hover: '#f5f5f5',
        button: {
            primary: '#e07155',
            primaryHover: '#c85f47',
            text: '#ffffff',
        },
    },
};

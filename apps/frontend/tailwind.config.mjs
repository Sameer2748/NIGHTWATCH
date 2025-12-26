/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                'bg-primary': 'var(--bg-primary)',
                'fg-primary': 'var(--fg-primary)',
                'theme-primary': 'var(--color-primary)',
                'theme-secondary': 'var(--color-secondary)',
                'text-primary': 'var(--text-primary)',
                'text-secondary': 'var(--text-secondary)',
                'text-muted': 'var(--text-muted)',
                'border-color': 'var(--border-color)',
                'card-bg': 'var(--card-bg)',
                'hover-bg': 'var(--hover-bg)',
                'button-primary': 'var(--button-primary)',
                'button-primary-hover': 'var(--button-primary-hover)',
                'button-text': 'var(--button-text)',
            },
            fontFamily: {
                'helvetica-now': ['"Helvetica Now Display"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
            },
        },
    },
    plugins: [],
};

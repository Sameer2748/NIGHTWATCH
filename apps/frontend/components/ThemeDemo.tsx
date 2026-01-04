'use client';

import { useTheme } from 'next-themes';

export default function ThemeDemo() {
    const { theme } = useTheme();

    return (
        <div style={{
            padding: '2rem',
            background: 'var(--card-bg)',
            borderRadius: '12px',
            border: '2px solid var(--border-color)',
        }}>
            <h2 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>
                Theme Demo
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Current theme: <strong style={{ color: 'var(--color-primary)' }}>{theme}</strong>
            </p>
            <p style={{ color: 'var(--text-secondary)' }}>
                This component demonstrates how to use theme colors in your components.
            </p>

            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{
                    padding: '1rem',
                    background: 'var(--button-primary)',
                    color: 'var(--button-text)',
                    borderRadius: '8px',
                }}>
                    Primary Color
                </div>
                <div style={{
                    padding: '1rem',
                    background: 'var(--color-secondary)',
                    color: '#fff',
                    borderRadius: '8px',
                }}>
                    Secondary Color
                </div>
                <div style={{
                    padding: '1rem',
                    background: 'var(--hover-bg)',
                    color: 'var(--text-primary)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                }}>
                    Hover Background
                </div>
            </div>
        </div>
    );
}

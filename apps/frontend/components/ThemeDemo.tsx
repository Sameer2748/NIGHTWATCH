'use client';

import { useTheme } from '@/lib/theme';

export default function ThemeDemo() {
    const { theme, colors } = useTheme();

    return (
        <div style={{
            padding: '2rem',
            background: colors.card,
            borderRadius: '12px',
            border: `2px solid ${colors.border}`,
        }}>
            <h2 style={{ color: colors.text.primary, marginBottom: '1rem' }}>
                Theme Demo
            </h2>
            <p style={{ color: colors.text.secondary, marginBottom: '0.5rem' }}>
                Current theme: <strong style={{ color: colors.primary }}>{theme}</strong>
            </p>
            <p style={{ color: colors.text.secondary }}>
                This component demonstrates how to use theme colors in your components.
            </p>

            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{
                    padding: '1rem',
                    background: colors.primary,
                    color: '#fff',
                    borderRadius: '8px',
                }}>
                    Primary Color
                </div>
                <div style={{
                    padding: '1rem',
                    background: colors.secondary,
                    color: '#fff',
                    borderRadius: '8px',
                }}>
                    Secondary Color
                </div>
                <div style={{
                    padding: '1rem',
                    background: colors.hover,
                    color: colors.text.primary,
                    borderRadius: '8px',
                    border: `1px solid ${colors.border}`,
                }}>
                    Hover Background
                </div>
            </div>
        </div>
    );
}

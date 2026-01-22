import { ImageResponse } from 'next/og';

// Route segment config
export const runtime = 'edge';

// Image metadata
export const size = {
    width: 32,
    height: 32,
};
export const contentType = 'image/png';

// Favicon generation
export default function Icon() {
    return new ImageResponse(
        (
            // ImageResponse JSX element
            <div
                style={{
                    fontSize: 24,
                    background: '#0a0b0f',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    borderRadius: '20%',
                    border: '2px solid #e0715533',
                    position: 'relative',
                }}
            >
                {/* Simplified Static Compass Logo */}
                <div
                    style={{
                        position: 'absolute',
                        width: '80%',
                        height: '80%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    {/* Main Needle */}
                    <div
                        style={{
                            position: 'absolute',
                            width: 0,
                            height: 0,
                            borderLeft: '4px solid transparent',
                            borderRight: '4px solid transparent',
                            borderBottom: '12px solid #e07155',
                            transform: 'translateY(-6px)',
                        }}
                    />
                    <div
                        style={{
                            position: 'absolute',
                            width: 0,
                            height: 0,
                            borderLeft: '4px solid transparent',
                            borderRight: '4px solid transparent',
                            borderTop: '12px solid rgba(255,255,255,0.1)',
                            transform: 'translateY(6px)',
                        }}
                    />
                    {/* Pivot */}
                    <div
                        style={{
                            width: '4px',
                            height: '4px',
                            background: '#e07155',
                            borderRadius: '50%',
                            zIndex: 10,
                            border: '1px solid #0a0b0f',
                        }}
                    />
                </div>
            </div>
        ),
        // ImageResponse options
        {
            ...size,
        }
    );
}

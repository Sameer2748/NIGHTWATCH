'use client';

import { motion } from 'motion/react';

export const Logo = ({ className = "w-8 h-8", animated = true }: { className?: string; animated?: boolean }) => {
    return (
        <div className={`relative flex items-center justify-center ${className} select-none`}>
            {/* Background Glow */}
            {animated && (
                <motion.div
                    className="absolute inset-0 bg-[var(--color-button-primary)]/10 rounded-full blur-2xl"
                    animate={{
                        scale: [0.8, 1.2, 0.8],
                        opacity: [0.2, 0.4, 0.2],
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
            )}

            <svg
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full relative z-10"
            >
                {/* Outer Minimal Ring */}
                <circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke="var(--color-button-primary)"
                    strokeWidth="1.5"
                    strokeOpacity="0.3"
                />

                {/* Cardinal Markers */}
                <circle cx="50" cy="12" r="1.5" className="fill-button-primary" />
                <circle cx="50" cy="88" r="1.5" className="fill-text-muted/30" />
                <circle cx="12" cy="50" r="1.5" className="fill-text-muted/30" />
                <circle cx="88" cy="50" r="1.5" className="fill-text-muted/30" />

                {/* The Animated Compass Needle - Fixed Pivot */}
                <motion.g
                    animate={animated ? {
                        rotate: [0, 90, 45, 270, 180, 450, 360],
                    } : { rotate: 0 }}
                    transition={animated ? {
                        duration: 15,
                        repeat: Infinity,
                        ease: "easeInOut",
                        times: [0, 0.1, 0.3, 0.5, 0.7, 0.9, 1],
                    } : {}}
                    style={{ transformOrigin: "50px 50px" }}
                >
                    {/* North Half (Sharp/Primary) */}
                    <path
                        d="M 50 18 L 58 50 L 50 50 L 42 50 Z"
                        fill="var(--color-button-primary)"
                    />
                    {/* North Highlight */}
                    <path
                        d="M 50 18 L 50 50 L 42 50 Z"
                        fill="white"
                        fillOpacity="0.2"
                    />

                    {/* South Half (Ghost/Muted) */}
                    <path
                        d="M 50 82 L 42 50 L 50 50 L 58 50 Z"
                        fill="currentColor"
                        fillOpacity="0.1"
                        className="text-text-primary"
                    />
                    {/* South Highlight */}
                    <path
                        d="M 50 82 L 50 50 L 58 50 Z"
                        fill="currentColor"
                        fillOpacity="0.05"
                        className="text-text-primary"
                    />
                </motion.g>

                {/* Central Pivot Post */}
                <circle
                    cx="50"
                    cy="50"
                    r="4"
                    className="fill-bg-primary stroke-button-primary"
                    strokeWidth="2"
                />
                <circle
                    cx="50"
                    cy="50"
                    r="1.2"
                    fill="var(--color-button-primary)"
                />
            </svg>
        </div>
    );
};

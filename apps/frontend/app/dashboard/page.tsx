'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast, Toaster } from 'sonner';
import { tokenManager } from '@/lib/auth/tokenManager';
import { useTheme } from '@/lib/theme/ThemeContext';

export default function DashboardPage() {
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { theme, toggleTheme } = useTheme();

    useEffect(() => {
        // Check if user is authenticated
        if (!tokenManager.isAuthenticated()) {
            router.push('/signin');
            return;
        }

        // Get user ID from token
        const id = tokenManager.getUserId();
        setUserId(id);
        setLoading(false);
    }, [router]);

    const handleLogout = () => {
        // Remove token from localStorage
        tokenManager.removeToken();

        // Show success message
        toast.success('Logged out successfully');

        // Redirect to home page
        setTimeout(() => {
            router.push('/');
        }, 500);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-bg-primary flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <svg className="animate-spin h-8 w-8 text-button-primary" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-text-secondary">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bg-primary">
            <Toaster position="top-center" richColors />

            {/* Navbar */}
            <nav className="border-b border-border-color">
                <div className="max-w-[90%] mx-auto py-6">
                    <div className="flex justify-between items-center">
                        {/* Logo */}
                        <div className="flex items-center gap-2">
                            <svg className="w-6 h-6" viewBox="0 0 256 256" fill="none">
                                <path d="M 128 0 C 198.692 0 256 57.308 256 128 C 256 198.692 198.692 256 128 256 C 57.308 256 0 198.692 0 128 C 0 57.308 57.308 0 128 0 Z M 128 32 C 74.98 32 32 74.98 32 128 C 32 181.019 74.98 224 128 224 C 181.019 224 224 181.019 224 128 C 224 74.98 181.019 32 128 32 Z M 128 112 C 136.837 112 144 119.163 144 128 C 144 136.837 136.837 144 128 144 C 119.163 144 112 136.837 112 128 C 112 119.163 119.163 112 128 112 Z" fill="currentColor" />
                            </svg>
                            <span className="text-xl font-bold text-text-primary">NIGHTWATCH</span>
                        </div>

                        {/* Right side */}
                        <div className="flex items-center gap-4">
                            {/* Theme toggle */}
                            <button
                                onClick={() => {
                                    const audio = new Audio('/audio/anime-ahh.mp3');
                                    audio.play().catch(err => console.log('Audio play failed:', err));
                                    toggleTheme();
                                }}
                                className="p-2 rounded-lg hover:bg-card-bg transition-colors"
                                aria-label="Toggle theme"
                            >
                                {theme === 'dark' ? (
                                    <svg className="w-5 h-5 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                    </svg>
                                )}
                            </button>

                            {/* Logout button */}
                            <button
                                onClick={handleLogout}
                                className="bg-transparent border border-border-color text-text-secondary px-4 py-2 rounded-md hover:text-text-primary hover:border-text-muted transition-colors"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main content */}
            <div className="max-w-[90%] mx-auto py-16">
                <div className="text-center">
                    {/* Welcome message */}
                    <h1 className="text-4xl font-bold text-text-primary mb-4">
                        Welcome to NIGHTWATCH
                    </h1>

                    <p className="text-text-secondary mb-8">
                        You're successfully logged in!
                    </p>

                    {/* User info card */}
                    <div className="max-w-md mx-auto bg-card-bg border border-border-color rounded-xl p-8">
                        <div className="flex items-center justify-center mb-4">
                            <div className="w-16 h-16 bg-button-primary rounded-full flex items-center justify-center">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                        </div>

                        <h2 className="text-xl font-semibold text-text-primary mb-2">
                            Your Account
                        </h2>

                        <div className="text-sm text-text-muted mb-1">User ID</div>
                        <div className="text-text-secondary font-mono text-sm bg-bg-primary px-3 py-2 rounded border border-border-color">
                            {userId || 'Unknown'}
                        </div>
                    </div>

                    {/* Coming soon message */}
                    <div className="mt-12">
                        <p className="text-text-muted text-sm">
                            Dashboard features coming soon...
                        </p>
                    </div>
                </div>
            </div >
        </div >
    );
}

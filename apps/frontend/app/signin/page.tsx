'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast, Toaster } from 'sonner';
import { authAPI } from '@/lib/api/auth';
import { tokenManager } from '@/lib/auth/tokenManager';

export default function SignInPage() {
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name || !password) {
            toast.error('Please fill in all fields');
            return;
        }

        setLoading(true);

        try {
            const response = await authAPI.signIn({ name, password });

            // Save token to localStorage
            tokenManager.setToken(response.jwt);

            // Show success message
            toast.success('Welcome back!');

            // Redirect to dashboard
            setTimeout(() => {
                router.push('/dashboard');
            }, 500);
        } catch (error: any) {
            console.error('Sign in error:', error);

            // Handle different error cases
            if (error.response?.status === 403) {
                const message = error.response.data?.msg || 'Invalid credentials';
                if (message.includes('Invalid password')) {
                    toast.error('Incorrect password. Please try again.');
                } else if (message.includes('Invalid data')) {
                    toast.error('Please check your credentials');
                } else {
                    toast.error(message);
                }
            } else if (error.response?.status === 500) {
                toast.error('Something went wrong. Please try again later.');
            } else if (error.code === 'ERR_NETWORK') {
                toast.error('Unable to connect. Please check your connection.');
            } else {
                toast.error('Sign in failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-bg-primary flex flex-col">
            <Toaster position="top-center" richColors />

            {/* Back button */}
            <div className="p-6">
                <Link
                    href="/"
                    className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to NIGHTWATCH
                </Link>
            </div>

            {/* Main content */}
            <div className="flex-1 flex items-center justify-center px-4">
                <div className="w-full max-w-md">
                    {/* Logo */}
                    <div className="flex justify-center mb-8">
                        <svg className="w-12 h-12 text-text-primary" viewBox="0 0 256 256" fill="none">
                            <path d="M 128 0 C 198.692 0 256 57.308 256 128 C 256 198.692 198.692 256 128 256 C 57.308 256 0 198.692 0 128 C 0 57.308 57.308 0 128 0 Z M 128 32 C 74.98 32 32 74.98 32 128 C 32 181.019 74.98 224 128 224 C 181.019 224 224 181.019 224 128 C 224 74.98 181.019 32 128 32 Z M 128 112 C 136.837 112 144 119.163 144 128 C 144 136.837 136.837 144 128 144 C 119.163 144 112 136.837 112 128 C 112 119.163 119.163 112 128 112 Z" fill="currentColor" />
                        </svg>
                    </div>

                    {/* Welcome text */}
                    <h1 className="text-3xl font-bold text-center text-text-primary mb-2">
                        Welcome back
                    </h1>
                    <p className="text-center text-text-secondary mb-8">
                        First time here?{' '}
                        <Link href="/signup" className="text-button-primary hover:underline">
                            Sign up for free
                        </Link>
                        .
                    </p>

                    {/* Sign-in form */}
                    <form onSubmit={handleSignIn}>
                        {/* Email/Name input */}
                        <div className="mb-4">
                            <label className="block text-sm text-text-secondary mb-2">
                                Email
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Your email"
                                disabled={loading}
                                className="w-full bg-transparent border border-border-color text-text-primary py-3 px-4 rounded-lg focus:outline-none focus:border-button-primary transition-colors disabled:opacity-50"
                            />
                        </div>

                        {/* Password input */}
                        <div className="mb-6">
                            <label className="block text-sm text-text-secondary mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Your password"
                                    disabled={loading}
                                    className="w-full bg-transparent border border-border-color text-text-primary py-3 px-4 rounded-lg focus:outline-none focus:border-button-primary transition-colors disabled:opacity-50 pr-12"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                                >
                                    {showPassword ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Sign in button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-button-primary text-white py-3 px-4 rounded-lg hover:bg-button-primaryHover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Signing in...
                                </>
                            ) : (
                                'Sign in'
                            )}
                        </button>
                    </form>

                    {/* Terms */}
                    <p className="text-xs text-text-muted text-center mt-8">
                        You acknowledge that you read, and agree to our{' '}
                        <Link href="/terms" className="hover:text-text-primary">
                            Terms of Service
                        </Link>{' '}
                        and our{' '}
                        <Link href="/privacy" className="hover:text-text-primary">
                            Privacy Policy
                        </Link>
                        .
                    </p>
                </div>
            </div>
        </div>
    );
}

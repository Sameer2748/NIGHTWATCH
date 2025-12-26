'use client';

import { Provider } from 'react-redux';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { store } from './index';

export function ReduxProvider({ children }: { children: React.ReactNode }) {
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

    return (
        <Provider store={store}>
            <GoogleOAuthProvider clientId={googleClientId}>
                {children}
            </GoogleOAuthProvider>
        </Provider>
    );
}

'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * This page is deprecated as the app uses Google and Phone authentication.
 * It redirects users back to the homepage.
 */
export default function VerifyEmailPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/');
    }, [router]);

    return null;
}

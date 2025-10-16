'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';

function OAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuth();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Debug: Log all URL parameters
        console.log('OAuth Callback URL params:', {
          success: searchParams.get('success'),
          userId: searchParams.get('user_id'),
          userName: searchParams.get('user_name'),
          stravaId: searchParams.get('strava_id'),
          error: searchParams.get('error'),
          code: searchParams.get('code'),
          scope: searchParams.get('scope')
        });

        // Check if we have success parameters from backend redirect
        const success = searchParams.get('success');
        const userId = searchParams.get('user_id');
        const userName = searchParams.get('user_name');
        const stravaId = searchParams.get('strava_id');

        // Handle error cases
        const error = searchParams.get('error');
        if (error) {
          setStatus('error');
          setError('OAuth authorization was denied or failed');
          return;
        }

        // If we have user data from backend redirect, use it
        if (success === 'true' && userId && stravaId) {
          const userData = {
            id: parseInt(userId),
            stravaId: parseInt(stravaId),
            name: userName ? decodeURIComponent(userName) : 'Strava User',
            email: '' // We don't have email yet
          };

          console.log('Setting user data:', userData);
          setUser(userData);
          setStatus('success');
          
          // Use Next.js router for proper navigation
          setTimeout(() => {
            console.log('Redirecting to dashboard...');
            router.push('/dashboard');
          }, 1000); // Slightly reduced timeout
          return;
        }

        // If we have a code but no success flag, the backend might not have redirected properly
        const code = searchParams.get('code');
        if (code) {
          setStatus('error');
          setError('Backend OAuth processing failed - please try again');
          return;
        }

        // If we get here without any relevant parameters, there's an error
        setStatus('error');
        setError('Invalid OAuth callback - missing user information');
      } catch (err) {
        console.error('OAuth callback error:', err);
        setStatus('error');
        setError('Failed to process OAuth callback');
      }
    };

    handleCallback();
  }, [searchParams, setUser, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
        {status === 'processing' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Connecting to Strava...
            </h2>
            <p className="text-gray-600">
              Please wait while we set up your account.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Successfully Connected!
            </h2>
            <p className="text-gray-600 mb-4">
              Your Strava account has been linked. Redirecting to dashboard...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Connection Failed
            </h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
            >
              Try Again
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function OAuthCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    }>
      <OAuthCallbackContent />
    </Suspense>
  );
}
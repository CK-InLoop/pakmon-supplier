'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  let errorMessage = 'An error occurred during authentication';
  
  switch (error) {
    case 'Configuration':
      errorMessage = 'There is a problem with the server configuration.';
      break;
    case 'AccessDenied':
      errorMessage = 'Access denied. You do not have permission to sign in.';
      break;
    case 'Verification':
      errorMessage = 'The verification token has expired or has already been used.';
      break;
    case 'CredentialsSignin':
      errorMessage = 'Invalid email or password.';
      break;
    default:
      errorMessage = error || 'An unknown error occurred.';
  }

  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center px-4">
      <div className="glass rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-red-600 mb-2">
          Authentication Error
        </h2>
        <p className="text-gray-600 mb-6">{errorMessage}</p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transform"
          >
            Try Again
          </Link>
          <Link
            href="/"
            className="border border-gray-300 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-50 transition font-semibold"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}


export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg p-8 max-w-md w-full text-center">
          <div className="text-2xl">Loading...</div>
        </div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  );
}


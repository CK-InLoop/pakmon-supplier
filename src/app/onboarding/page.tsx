'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    companyName: '',
    phone: '',
    address: '',
    description: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  // Get user email from localStorage if not logged in
  useEffect(() => {
    if (!session?.user?.email) {
      const verifiedUser = localStorage.getItem('verifiedUser');
      console.log(verifiedUser);
      if (verifiedUser) {
        const user = JSON.parse(verifiedUser);
        setUserEmail(user.email);
      } else {
        router.push('/login');
      }
    } else {
      setUserEmail(session.user.email);
    }
  }, [session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail,
          ...formData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if redirect is needed
        if (data.redirect) {
          router.push(data.redirect);
          return;
        }
        throw new Error(data.error || 'Something went wrong');
      }

      // Clear the verified user from localStorage
      localStorage.removeItem('verifiedUser');
      router.push('/login?message=Profile completed successfully. Please log in.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen professional-gradient flex items-center justify-center px-4">
      <div className="corporate-card p-10 max-w-2xl w-full">
        <div className="mb-8">
          <div className="badge-primary mb-4">STEP 2 OF 2</div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Complete Your Profile
          </h1>
          <p className="text-gray-600 text-sm">
            Tell us about your company to get started
          </p>
        </div>

        {error && (
          <div className="alert-error mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Name *
            </label>
            <input
              type="text"
              required
              value={formData.companyName}
              onChange={(e) =>
                setFormData({ ...formData, companyName: e.target.value })
              }
              className="pro-input"
              placeholder="ABC Dairy Products Ltd."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number *
            </label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className="pro-input"
              placeholder="+1 234 567 8900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Address *
            </label>
            <textarea
              required
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              rows={3}
              className="pro-input"
              placeholder="123 Main Street, City, State, ZIP"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={4}
              className="pro-input"
              placeholder="Tell us about your company and what products you offer..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Complete Setup'}
          </button>
        </form>
      </div>
    </div>
  );
}


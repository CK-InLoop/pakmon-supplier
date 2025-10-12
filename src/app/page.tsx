import Link from 'next/link';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function Home() {
  const session = await auth();
  
  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen professional-gradient">
      <div className="container-pro py-6">
        {/* Header */}
        <nav className="bg-white border border-gray-200 rounded-lg px-8 py-4 mb-16 flex justify-between items-center shadow-sm">
          <div className="text-2xl font-bold text-gray-900">
            Flavi Dairy Solutions
          </div>
          <div className="flex gap-3">
            <Link
              href="/login"
              className="px-6 py-2.5 text-gray-700 hover:text-blue-600 transition font-medium text-sm"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="btn-primary"
            >
              Sign Up
            </Link>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="text-center max-w-5xl mx-auto py-20">
          <div className="badge-primary mb-6 inline-block">
            SUPPLIER PORTAL
          </div>
          <h1 className="heading-1 mb-6">
            <span className="text-gray-900">Professional Product Management</span>
            <br />
            <span className="text-blue-600">for Modern Suppliers</span>
          </h1>
          <p className="body-large max-w-2xl mx-auto mb-12">
            Join Flavi Dairy Solutions and leverage AI-powered product discovery to reach more customers and grow your business efficiently.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold shadow-lg hover:shadow-xl hover:-translate-y-1 transform text-sm tracking-wide"
            >
              Get Started
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              href="/login"
              className="btn-secondary inline-flex items-center gap-2"
            >
              Sign In
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mt-24 max-w-6xl mx-auto">
          <div className="corporate-card p-8">
            <div className="w-14 h-14 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
              <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-3 text-gray-900">Efficient Product Management</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Streamlined interface for uploading products with images, documents, and comprehensive descriptions.
            </p>
          </div>
          <div className="corporate-card p-8">
            <div className="w-14 h-14 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
              <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-3 text-gray-900">AI-Powered Search</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Advanced semantic indexing ensures your products are discoverable through intelligent search algorithms.
            </p>
          </div>
          <div className="corporate-card p-8">
            <div className="w-14 h-14 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
              <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-3 text-gray-900">Comprehensive Analytics</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Real-time insights into product visibility, customer engagement, and performance metrics.
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-24 mb-16">
          <div className="corporate-card p-12 max-w-5xl mx-auto text-center">
            <h2 className="text-2xl font-semibold mb-10 text-gray-900">Trusted by Industry Leaders</h2>
            <div className="grid md:grid-cols-3 gap-12">
              <div>
                <div className="text-5xl font-bold text-blue-600 mb-2">10,000+</div>
                <div className="text-gray-600 font-medium text-sm">Products Listed</div>
              </div>
              <div>
                <div className="text-5xl font-bold text-blue-600 mb-2">500+</div>
                <div className="text-gray-600 font-medium text-sm">Active Suppliers</div>
              </div>
              <div>
                <div className="text-5xl font-bold text-blue-600 mb-2">99.9%</div>
                <div className="text-gray-600 font-medium text-sm">Platform Uptime</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
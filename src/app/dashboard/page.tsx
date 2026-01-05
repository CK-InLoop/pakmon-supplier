'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, CheckCircle, Clock, TrendingUp, Building2 } from 'lucide-react';

interface Stats {
  totalProducts: number;
  approvedProducts: number;
  pendingProducts: number;
  totalMatches: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/analytics');
      const data = await response.json();
      setStats(data.summary);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Welcome to your supplier portal
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Products
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats?.totalProducts || 0}
              </p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <Package className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {stats?.approvedProducts || 0}
              </p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">
                {stats?.pendingProducts || 0}
              </p>
            </div>
            <div className="bg-yellow-100 rounded-full p-3">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Matches
              </p>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {stats?.totalMatches || 0}
              </p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/dashboard/suppliers?add=true"
            className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-green-600 hover:bg-green-50 transition hover-lift"
          >
            <div className="bg-green-100 rounded-full p-2">
              <Building2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Add Supplier</p>
              <p className="text-sm text-gray-600">Register a new supplier</p>
            </div>
          </Link>

          <Link
            href="/dashboard/suppliers"
            className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl hover:border-green-600 hover:bg-green-50 transition hover-lift"
          >
            <div className="bg-gray-100 rounded-full p-2">
              <Package className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">View Suppliers</p>
              <p className="text-sm text-gray-600">Manage your suppliers</p>
            </div>
          </Link>

          <Link
            href="/dashboard/analytics"
            className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl hover:border-green-600 hover:bg-green-50 transition hover-lift"
          >
            <div className="bg-gray-100 rounded-full p-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">View Analytics</p>
              <p className="text-sm text-gray-600">Track performance</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Getting Started */}
      {stats?.totalProducts === 0 && (
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl shadow-xl p-8 text-white">
          <h2 className="text-2xl font-bold mb-2">Get Started</h2>
          <p className="mb-6 text-green-100">
            Add your first product to start appearing in AI-powered searches
          </p>
          <Link
            href="/dashboard/products/add"
            className="inline-block bg-white text-green-600 px-6 py-3 rounded-xl hover:bg-green-50 transition font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transform"
          >
            Add Your First Product
          </Link>
        </div>
      )}
    </div>
  );
}


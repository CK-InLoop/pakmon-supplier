'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, CheckCircle, Clock, TrendingUp, Building2, ImageIcon, FolderTree } from 'lucide-react';

interface Stats {
  totalProducts?: number;
  totalSuppliers?: number;
  // Admin response structure
  products?: { total: number };
  suppliers?: { total: number };
  carouselImages?: number;
  categoriesCount?: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [analyticsResponse, carouselResponse, categoriesResponse] = await Promise.all([
        fetch('/api/analytics'),
        fetch('/api/carousel/count'),
        fetch('/api/categories/count'),
      ]);
      const analyticsData = await analyticsResponse.json();
      const carouselData = await carouselResponse.json();
      const categoriesData = await categoriesResponse.json();

      // Handle both Admin (nested) and Supplier (flat) structures
      setStats({
        ...analyticsData.summary,
        carouselImages: carouselData.count || 0,
        categoriesCount: categoriesData.count || 0,
      });
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

  // Helper to get counts regardless of structure
  const getTotalProducts = () => stats?.totalProducts ?? stats?.products?.total ?? 0;
  const getTotalSuppliers = () => stats?.totalSuppliers ?? stats?.suppliers?.total ?? 0;

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
        <Link href="/dashboard/products" className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Products
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {getTotalProducts()}
              </p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <Package className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Link>

        <Link href="/dashboard/suppliers" className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Suppliers
              </p>
              <p className="text-3xl font-bold text-indigo-600 mt-2">
                {getTotalSuppliers()}
              </p>
            </div>
            <div className="bg-indigo-100 rounded-full p-3">
              <Building2 className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </Link>

        <Link href="/dashboard/carousel" className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Carousel Images
              </p>
              <p className="text-3xl font-bold text-amber-600 mt-2">
                {stats?.carouselImages || 0}
              </p>
            </div>
            <div className="bg-amber-100 rounded-full p-3">
              <ImageIcon className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          {/*
          Removed Approved, Pending, and Total Matches UI as per 2026-01-07 request. Restore if needed.
          <Link href="/dashboard/products?status=APPROVED" className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow cursor-pointer">
            ...approved products card...
          </Link>
          <Link href="/dashboard/products?status=PENDING" className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow cursor-pointer">
            ...pending products card...
          </Link>
          <Link href="/dashboard/products?hasMatches=true" className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow cursor-pointer">
            ...total matches card...
          </Link>
        */}
        </Link>

        <Link href="/dashboard/categories" className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Categories
              </p>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                {stats?.categoriesCount || 0}
              </p>
            </div>
            <div className="bg-purple-100 rounded-full p-3">
              <FolderTree className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Link>
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


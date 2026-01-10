'use client';

import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  Package,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  FolderTree
} from 'lucide-react';
import { getCategories } from '@/app/actions/categories';

interface SubCategory {
  id: string;
  name: string;
  order: number;
  isHeading: boolean;
  isActive: boolean;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  order: number;
  isActive: boolean;
  subCategories: SubCategory[];
}

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userInfo, setUserInfo] = useState<{ name?: string; email?: string } | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Fetch user info from API to get the latest name/email
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await fetch('/api/user/settings');
        if (response.ok) {
          const data = await response.json();
          setUserInfo(data?.user || null);
        }
      } catch (error) {
        console.error('Failed to fetch user info:', error);
      }
    };
    fetchUserInfo();
  }, [pathname]); // Refetch when navigating (e.g., after updating settings)

  // Fetch categories from database
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const result = await getCategories();
        if (result.success && result.categories) {
          setCategories(result.categories as Category[]);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    fetchCategories();
  }, []);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  ];

  const otherNav = [
    { name: 'Categories', href: '/dashboard/categories', icon: FolderTree },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  const toggleCategory = (name: string) => {
    setExpandedCategory(expandedCategory === name ? null : name);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 pro-sidebar shadow-xl transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Pakmon Dairy
              </h1>
              <p className="text-xs text-gray-500 font-medium">Supplier Portal</p>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* User info */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <p className="text-sm font-semibold text-gray-900">
              {userInfo?.name || session?.user?.name || 'Admin'}
            </p>
            <p className="text-xs text-gray-600">{userInfo?.email || session?.user?.email}</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`pro-sidebar-item flex items-center gap-3 ${isActive ? 'active' : ''
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}

            {categories.map((category) => {
              // Use Package icon for all categories (icon field is for future use)
              const isExpanded = expandedCategory === category.name;
              return (
                <div key={category.id} className="space-y-1">
                  <button
                    onClick={() => toggleCategory(category.name)}
                    className={`pro-sidebar-item flex items-center justify-between w-full gap-3 ${isExpanded ? 'bg-gray-100' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <Package className="w-5 h-5 flex-shrink-0" />
                      <span className="font-medium text-left flex-1">{category.name}</span>
                    </div>
                    {isExpanded ? (
                      <X className="w-4 h-4 text-gray-400" />
                    ) : (
                      <Menu className="w-4 h-4 text-gray-400 rotate-90" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="pl-11 space-y-1">
                      {category.subCategories.map((sub) => {
                        if (sub.isHeading) {
                          return (
                            <div key={sub.id} className="pt-3 pb-1 text-xs font-bold text-green-600 uppercase tracking-wider">
                              {sub.name}
                            </div>
                          );
                        }
                        const href = `/dashboard/suppliers?category=${encodeURIComponent(category.name)}&subCategory=${encodeURIComponent(sub.name)}`;
                        const isActive = pathname === '/dashboard/suppliers' &&
                          new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('category') === category.name &&
                          new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('subCategory') === sub.name;

                        return (
                          <Link
                            key={sub.id}
                            href={href}
                            onClick={() => setSidebarOpen(false)}
                            className={`block py-2 text-sm text-gray-600 hover:text-green-600 transition-colors ${isActive ? 'text-green-600 font-semibold' : ''}`}
                          >
                            {sub.name}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {otherNav.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`pro-sidebar-item flex items-center gap-3 ${isActive ? 'active' : ''
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="flex items-center gap-3 w-full px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition text-sm font-medium"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <header className="lg:hidden bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-500 hover:text-gray-700"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-bold text-gray-900">Pakmon Dairy</h1>
            <div className="w-6" /> {/* Spacer for alignment */}
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8 bg-gray-50 min-h-screen">{children}</main>
      </div>
    </div>
  );
}


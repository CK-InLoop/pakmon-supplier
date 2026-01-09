'use client';

import { ReactNode, useState } from 'react';
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
  X
} from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  ];

  const categories = [
    {
      name: 'OIL & GAS Piping Systems',
      icon: Package,
      subCategories: [
        { name: 'PROJECTS', isHeading: true },
        { name: 'NG FACTORY PIPELINES AND SKIDS INSTALLATIONS' },
        { name: 'LNG STORAGE TANKS AND SYSTEM INSTALLATIONS' },
        { name: 'NITROGEN & OXYGEN GENERATORS' },
        { name: 'PRODUCTS', isHeading: true },
        { name: 'Pipes' },
        { name: 'Valves & Fittings' },
        { name: 'Flexible connections' },
        { name: 'Filters' },
        { name: 'Pressure Regulators' },
        { name: 'Gas Meters' },
        { name: 'Solenoid valves' },
        { name: 'GAS SKIDS / PRMS' },
        { name: 'LNG/LPG STORAGE TANKS and systems' }
      ]
    },
    {
      name: 'Dairy & Food',
      icon: Package,
      subCategories: [
        { name: 'PROJECTS', isHeading: true },
        { name: 'DAIRY PLANTS' },
        { name: 'WATER TREATMENT PLANTS' },
        { name: 'CIP PLANTS' },
        { name: 'PILOT PLANT / MINI PLANT' },
        { name: 'FACTORY RELOCATIONS' },
        { name: 'SS STORAGE TANKS & MIXERS' },
        { name: 'CLEANING STATIONS' },
        { name: 'IBC DOSING STATIONS' },
        { name: 'PLATFORMS' },
        { name: 'SS PIPINGS' },
        { name: 'PRODUCTS', isHeading: true },
        { name: 'SS DRAINS' },
        { name: 'SS Valve & Fittings' },
        { name: 'Flexible connections' },
        { name: 'pumps' }
      ]
    },
    {
      name: 'Industrial',
      icon: Package,
      subCategories: [
        { name: 'PROJECTS', isHeading: true },
        { name: 'HOME & PERSONAL CARE PLANTS' },
        { name: 'SULPHONATION PLANT' },
        { name: 'LAB PLANT' },
        { name: 'TANK FARMS' },
        { name: 'UTILITY & pipings' },
        { name: 'READY FACTORIES TO BUY FOR BUSINESS INVESTMENTS' },
        { name: 'PRODUCTS', isHeading: true },
        { name: 'FANS' },
        { name: 'NITROGEN / OXYGEN GENERATORS' },
        { name: 'BOILERS' },
        { name: 'PUMPS' },
        { name: 'FILTRATION SYSTEMS' },
        { name: 'LIQUID DOSING SYSTEMS' }
      ]
    },
    {
      name: 'Consulting & Services',
      icon: Package,
      subCategories: [
        { name: 'SERVICES', isHeading: true },
        { name: 'AMC contracts' },
        { name: 'FAN Balance and Monitoring' },
        { name: 'Thermal inspections' },
        { name: 'Vibration checks' },
        { name: 'Central Lubrication system' },
        { name: 'Tightening checks' },
        { name: '6S Trainings' },
        { name: 'TPM' },
        { name: 'Focused Improvements' },
        { name: 'Autonomus Maintenance' },
        { name: 'Planned Maintenance' },
        { name: 'Energy Savings RISK ASSESMENT' },
        { name: 'COST Reductions' },
        { name: 'Early Equipment Management' },
        { name: 'HSE Risk Assessments and Predictions' },
        { name: 'Efficiency monitoring-FOL' },
        { name: 'Low cost Automations' },
        { name: 'SUPPLY CHAIN - RAW MATERIALS' }
      ]
    }
  ];

  const otherNav = [
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

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
              {session?.user?.name}
            </p>
            <p className="text-xs text-gray-600">{session?.user?.email}</p>
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
              const Icon = category.icon;
              const isExpanded = expandedCategory === category.name;
              return (
                <div key={category.name} className="space-y-1">
                  <button
                    onClick={() => toggleCategory(category.name)}
                    className={`pro-sidebar-item flex items-center justify-between w-full gap-3 ${isExpanded ? 'bg-gray-100' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 flex-shrink-0" />
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
                            <div key={sub.name} className="pt-3 pb-1 text-xs font-bold text-gray-500 uppercase tracking-wider">
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
                            key={sub.name}
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


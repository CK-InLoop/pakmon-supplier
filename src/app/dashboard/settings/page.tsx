'use client';

import { useEffect, useState } from 'react';
import { User, Shield, Bell, Pencil, X, Check, Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const [notifications, setNotifications] = useState(true);
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit states
  const [editingName, setEditingName] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [emailValue, setEmailValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      // Try to get from our settings API first
      const response = await fetch('/api/user/settings');
      if (response.ok) {
        const data = await response.json();
        setUser(data?.user || null);
        setNameValue(data?.user?.name || 'Admin User');
        setEmailValue(data?.user?.email || 'admin@example.com');
      } else {
        // Fallback to session API
        const sessionResponse = await fetch('/api/auth/session');
        if (sessionResponse.ok) {
          const data = await sessionResponse.json();
          setUser(data?.user || null);
          setNameValue(data?.user?.name || 'Admin User');
          setEmailValue(data?.user?.email || 'admin@example.com');
        }
      }
    } catch (error) {
      console.error('Failed to fetch user info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveName = async () => {
    if (!nameValue.trim()) {
      setError('Name cannot be empty');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const response = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameValue }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update name');
      }

      setUser(prev => prev ? { ...prev, name: nameValue } : null);
      setEditingName(false);
      setSuccess('Name updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update name');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEmail = async () => {
    if (!emailValue.trim() || !emailValue.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const response = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailValue }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update email');
      }

      setUser(prev => prev ? { ...prev, email: emailValue } : null);
      setEditingEmail(false);
      setSuccess('Email updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update email');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">
          Manage your account preferences
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {/* Account Info */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <User className="w-5 h-5" />
          Account Information
        </h2>

        <div className="space-y-4">
          {/* Name Field */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">Name</p>
                {editingName ? (
                  <input
                    type="text"
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    className="w-full px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                  />
                ) : (
                  <p className="font-medium text-gray-900">{user?.name || 'Admin User'}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 ml-4">
              {editingName ? (
                <>
                  <button
                    onClick={handleSaveName}
                    disabled={saving}
                    className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition"
                  >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => {
                      setEditingName(false);
                      setNameValue(user?.name || 'Admin User');
                      setError('');
                    }}
                    disabled={saving}
                    className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditingName(true)}
                  className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition"
                  title="Edit Name"
                >
                  <Pencil className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Email Field */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xl">✉️</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">Email</p>
                {editingEmail ? (
                  <input
                    type="email"
                    value={emailValue}
                    onChange={(e) => setEmailValue(e.target.value)}
                    className="w-full px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveEmail()}
                  />
                ) : (
                  <p className="font-medium text-gray-900">{user?.email || 'admin@example.com'}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 ml-4">
              {editingEmail ? (
                <>
                  <button
                    onClick={handleSaveEmail}
                    disabled={saving}
                    className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition"
                  >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => {
                      setEditingEmail(false);
                      setEmailValue(user?.email || 'admin@example.com');
                      setError('');
                    }}
                    disabled={saving}
                    className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditingEmail(true)}
                  className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition"
                  title="Edit Email"
                >
                  <Pencil className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Preferences
        </h2>

        <div className="space-y-4">
          {/* Notifications Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">Email Notifications</p>
                <p className="text-sm text-gray-500">Receive email alerts for new inquiries</p>
              </div>
            </div>
            <button
              onClick={() => setNotifications(!notifications)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifications ? 'bg-green-600' : 'bg-gray-300'
                }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Admin Status */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl shadow-xl p-6 text-white">
        <h2 className="text-xl font-bold mb-2">Admin Account</h2>
        <div className="flex items-center gap-2">
          <div className="bg-white/20 rounded-full p-2">
            ✓
          </div>
          <div>
            <p className="font-semibold">Full Access</p>
            <p className="text-sm text-green-100">
              You have administrator privileges to manage all suppliers and products
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

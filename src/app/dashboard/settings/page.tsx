'use client';

import { useEffect, useState } from 'react';
import { User, Shield, Bell, Pencil, X, Check, Loader2, Phone, Mail, KeyRound, Eye, EyeOff } from 'lucide-react';
import { DEFAULT_WHATSAPP_PHONE } from '@/lib/whatsapp-setting';

export default function SettingsPage() {
  const [notifications, setNotifications] = useState(true);
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit states
  const [editingName, setEditingName] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [emailValue, setEmailValue] = useState('');
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [savedWhatsappPhone, setSavedWhatsappPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

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
        setWhatsappPhone(data?.whatsappPhone || DEFAULT_WHATSAPP_PHONE);
        setSavedWhatsappPhone(data?.whatsappPhone || DEFAULT_WHATSAPP_PHONE);
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

      const savedEmail = data?.user?.email || emailValue.trim().toLowerCase();
      setEmailValue(savedEmail);
      setUser(prev => prev ? { ...prev, email: savedEmail } : null);
      setEditingEmail(false);
      setSuccess('Email updated. Use the new email address the next time you sign in.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update email');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveWhatsApp = async () => {
    if (!whatsappPhone.trim()) {
      setError('WhatsApp phone number cannot be empty');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whatsappPhone }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update WhatsApp number');

      const savedPhone = data.whatsappPhone || whatsappPhone;
      setWhatsappPhone(savedPhone);
      setSavedWhatsappPhone(savedPhone);
      setSuccess('WhatsApp phone number updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update WhatsApp number');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordError('');
    setSuccess('');

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    setChangingPassword(true);
    try {
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to change password.');

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setSuccess('Password changed successfully. Use it the next time you sign in.');
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : 'Failed to change password.');
    } finally {
      setChangingPassword(false);
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
        <div role="alert" className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div role="status" aria-live="polite" className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
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
                <Mail className="h-6 w-6 text-blue-600" />
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
                  <>
                    <p className="font-medium text-gray-900">{user?.email || 'admin@example.com'}</p>
                    <p className="mt-1 text-xs text-gray-500">This is your login and password-reset email.</p>
                  </>
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

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <KeyRound className="w-5 h-5" />
          Change Password
        </h2>
        <p className="mb-6 text-sm text-gray-600">
          Confirm your current password before choosing a new one.
        </p>

        <form onSubmit={handleChangePassword} className="space-y-4" noValidate>
          <div>
            <label htmlFor="current-password" className="block text-sm font-medium text-gray-900">
              Current password
            </label>
            <div className="relative mt-2">
              <input
                id="current-password"
                name="currentPassword"
                type={showCurrentPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                className="min-h-11 w-full rounded-lg border border-gray-300 px-3 pr-12 text-gray-900 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/30"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(value => !value)}
                aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
                className="absolute inset-y-0 right-0 min-h-11 min-w-11 text-gray-500 hover:text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-green-500"
              >
                {showCurrentPassword ? <EyeOff className="mx-auto h-5 w-5" /> : <Eye className="mx-auto h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-gray-900">
                New password
              </label>
              <div className="relative mt-2">
                <input
                  id="new-password"
                  name="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  aria-describedby="new-password-help"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className="min-h-11 w-full rounded-lg border border-gray-300 px-3 pr-12 text-gray-900 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/30"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(value => !value)}
                  aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                  className="absolute inset-y-0 right-0 min-h-11 min-w-11 text-gray-500 hover:text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-green-500"
                >
                  {showNewPassword ? <EyeOff className="mx-auto h-5 w-5" /> : <Eye className="mx-auto h-5 w-5" />}
                </button>
              </div>
              <p id="new-password-help" className="mt-1 text-xs text-gray-500">Use at least 8 characters.</p>
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-900">
                Confirm new password
              </label>
              <input
                id="confirm-password"
                name="confirmPassword"
                type={showNewPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="mt-2 min-h-11 w-full rounded-lg border border-gray-300 px-3 text-gray-900 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/30"
              />
            </div>
          </div>

          {passwordError && (
            <p role="alert" className="text-sm font-medium text-red-700">{passwordError}</p>
          )}

          <button
            type="submit"
            disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
            className="min-h-11 rounded-lg bg-green-600 px-5 font-semibold text-white transition hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {changingPassword ? <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Changing password…</span> : 'Change password'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Phone className="w-5 h-5" />
          Website Contact
        </h2>
        <p className="mb-6 text-sm text-gray-600">
          This number is used by the public website’s WhatsApp buttons and phone links.
        </p>
        <div className="rounded-lg bg-gray-50 p-4">
          <label htmlFor="whatsapp-phone" className="block text-sm font-medium text-gray-900">
            WhatsApp phone number
          </label>
          <p id="whatsapp-phone-help" className="mt-1 text-sm text-gray-500">
            Include the country code, for example +971 56 433 2583.
          </p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <input
              id="whatsapp-phone"
              name="whatsappPhone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              aria-describedby="whatsapp-phone-help"
              value={whatsappPhone}
              onChange={(event) => setWhatsappPhone(event.target.value)}
              className="min-h-11 flex-1 rounded-lg border border-gray-300 px-3 text-gray-900 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/30"
            />
            <button
              type="button"
              onClick={handleSaveWhatsApp}
              disabled={saving || whatsappPhone.trim() === savedWhatsappPhone.trim()}
              className="min-h-11 rounded-lg bg-green-600 px-5 font-semibold text-white transition hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Saving…</span> : 'Save phone number'}
            </button>
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

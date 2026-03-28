'use client';
import { useEffect, useState } from 'react';
import { Save, RefreshCw, CheckCircle, Info, Palette } from 'lucide-react';

function ColorField({ label, hint, value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {hint && <span className="ml-2 text-xs font-normal text-gray-400">{hint}</span>}
      </label>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={value || '#000000'}
          onChange={e => onChange(e.target.value)}
          className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5"
        />
        <input
          type="text"
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400"
          placeholder="#a3e635"
        />
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState({ recipientEmail: '', siteName: '', design: { accentColor: '#a3e635', adminSidebarBg: '#0f172a', adminAccentColor: '#a3e635', footerBg: '#f4f5fa' } });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((data) => { setSettings(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError('Failed to save settings.');
      }
    } catch {
      setError('Connection error.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Configure site-wide preferences and admin settings.</p>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading settings…</div>
      ) : (
        <form onSubmit={handleSave} className="max-w-2xl space-y-6">
          {/* Site Settings */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-5 pb-3 border-b border-gray-100">Site Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Site Name</label>
                <input
                  type="text"
                  value={settings.siteName || ''}
                  onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400"
                  placeholder="Bruton Gardens & Apartments"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Enquiry Recipient Email
                  <span className="ml-2 text-xs font-normal text-gray-400">(where contact form submissions are sent)</span>
                </label>
                <input
                  type="email"
                  value={settings.recipientEmail || ''}
                  onChange={(e) => setSettings({ ...settings, recipientEmail: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400"
                  placeholder="info@brutongardens.com"
                />
              </div>
            </div>
          </div>

          {/* Design */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-5 pb-3 border-b border-gray-100">
              <Palette size={16} className="text-lime-500" />
              <h3 className="font-semibold text-gray-900">Design & Colors</h3>
            </div>
            <div className="space-y-4">
              <ColorField
                label="Footer Background Color"
                hint="background color of the site footer"
                value={settings.design?.footerBg}
                onChange={v => setSettings({ ...settings, design: { ...settings.design, footerBg: v } })}
              />
              <ColorField
                label="Admin Sidebar Background"
                hint="dark sidebar in the admin panel"
                value={settings.design?.adminSidebarBg}
                onChange={v => setSettings({ ...settings, design: { ...settings.design, adminSidebarBg: v } })}
              />
              <ColorField
                label="Admin Accent Color"
                hint="active link highlight in the admin sidebar"
                value={settings.design?.adminAccentColor}
                onChange={v => setSettings({ ...settings, design: { ...settings.design, adminAccentColor: v } })}
              />
              <ColorField
                label="Site Accent Color"
                hint="primary lime/green brand color used across the site"
                value={settings.design?.accentColor}
                onChange={v => setSettings({ ...settings, design: { ...settings.design, accentColor: v } })}
              />
            </div>
          </div>

          {/* Admin credentials note */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex gap-3">
            <Info size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">Admin Credentials</p>
              <p className="text-sm text-amber-700 mt-1">
                Admin username and password are managed via environment variables{' '}
                <code className="bg-amber-100 px-1 rounded text-xs">ADMIN_USERNAME</code> and{' '}
                <code className="bg-amber-100 px-1 rounded text-xs">ADMIN_PASSWORD</code> in your{' '}
                <code className="bg-amber-100 px-1 rounded text-xs">.env.local</code> file. Restart the server after changing them.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-lime-400 hover:bg-lime-500 disabled:opacity-60 text-slate-900 font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
            >
              {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
              {saving ? 'Saving…' : 'Save Settings'}
            </button>
            {saved && (
              <div className="flex items-center gap-2 text-lime-600 text-sm font-medium">
                <CheckCircle size={16} />
                Saved!
              </div>
            )}
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        </form>
      )}
    </div>
  );
}

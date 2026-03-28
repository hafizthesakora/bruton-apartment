'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Mail, Images, FileText, Settings, TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export default function AdminDashboard() {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/enquiries')
      .then((r) => r.json())
      .then((data) => {
        setEnquiries(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const unread = enquiries.filter((e) => !e.read).length;
  const recent = enquiries.slice(0, 5);

  const quickLinks = [
    { href: '/admin/content', label: 'Edit Page Content', icon: FileText, desc: 'Update headings, text, and CTAs', color: 'bg-blue-50 text-blue-600 border-blue-100' },
    { href: '/admin/media', label: 'Manage Carousel', icon: Images, desc: 'Upload and reorder gallery images', color: 'bg-purple-50 text-purple-600 border-purple-100' },
    { href: '/admin/enquiries', label: 'View Enquiries', icon: Mail, desc: `${unread} unread message${unread !== 1 ? 's' : ''}`, color: 'bg-lime-50 text-lime-700 border-lime-100' },
    { href: '/admin/settings', label: 'Settings', icon: Settings, desc: 'Configure site preferences', color: 'bg-gray-50 text-gray-600 border-gray-100' },
  ];

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Welcome back. Here&apos;s what&apos;s happening.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Total Enquiries</span>
            <TrendingUp size={18} className="text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{loading ? '—' : enquiries.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Unread</span>
            <AlertCircle size={18} className="text-amber-400" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{loading ? '—' : unread}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Read</span>
            <CheckCircle size={18} className="text-lime-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{loading ? '—' : enquiries.length - unread}</p>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {quickLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-4 p-5 bg-white rounded-xl border ${link.color.split(' ')[2]} hover:shadow-md transition-shadow`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${link.color.split(' ').slice(0, 2).join(' ')}`}>
                <Icon size={20} />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{link.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{link.desc}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Recent Enquiries */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Recent Enquiries</h2>
          <Link href="/admin/enquiries" className="text-sm text-lime-600 hover:text-lime-700 font-medium">
            View all →
          </Link>
        </div>

        {loading ? (
          <div className="px-6 py-8 text-center text-gray-400 text-sm">Loading…</div>
        ) : recent.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <Mail size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-gray-400 text-sm">No enquiries yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recent.map((e) => (
              <div key={e.id} className="flex items-start gap-4 px-6 py-4">
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${e.read ? 'bg-gray-300' : 'bg-lime-400'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 text-sm">{e.name}</p>
                    {!e.read && (
                      <span className="text-xs bg-lime-100 text-lime-700 px-1.5 py-0.5 rounded font-medium">New</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate">{e.message}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
                  <Clock size={12} />
                  {formatDate(e.createdAt)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

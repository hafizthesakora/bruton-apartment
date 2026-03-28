'use client';
import { useEffect, useState } from 'react';
import { Mail, MailOpen, Trash2, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';

export default function EnquiriesPage() {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [filter, setFilter] = useState('all');

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/enquiries');
      const data = await res.json();
      setEnquiries(Array.isArray(data) ? data : []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function toggleRead(id, currentRead) {
    await fetch('/api/admin/enquiries', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, read: !currentRead }),
    });
    setEnquiries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, read: !currentRead } : e))
    );
  }

  async function handleDelete(id) {
    if (!confirm('Delete this enquiry permanently?')) return;
    await fetch('/api/admin/enquiries', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setEnquiries((prev) => prev.filter((e) => e.id !== id));
    if (expanded === id) setExpanded(null);
  }

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  const filtered = enquiries.filter((e) => {
    if (filter === 'unread') return !e.read;
    if (filter === 'read') return e.read;
    return true;
  });

  const unreadCount = enquiries.filter((e) => !e.read).length;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Enquiries</h1>
          <p className="text-gray-500 text-sm mt-1">
            {unreadCount > 0 ? (
              <span className="text-amber-600 font-medium">{unreadCount} unread</span>
            ) : 'All caught up!'}
            {' '}· {enquiries.length} total
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-600 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'all', label: 'All' },
          { key: 'unread', label: `Unread (${unreadCount})` },
          { key: 'read', label: 'Read' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === tab.key
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading enquiries…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Mail size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No enquiries found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((e) => (
            <div
              key={e.id}
              className={`bg-white rounded-xl border transition-all ${
                e.read ? 'border-gray-200' : 'border-lime-200 shadow-sm'
              }`}
            >
              {/* Row header */}
              <div
                className="flex items-center gap-4 px-5 py-4 cursor-pointer"
                onClick={() => setExpanded(expanded === e.id ? null : e.id)}
              >
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${e.read ? 'bg-gray-300' : 'bg-lime-400'}`} />

                <div className="flex-1 min-w-0 grid grid-cols-4 gap-4 items-center">
                  <div>
                    <p className={`text-sm truncate ${!e.read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                      {e.name}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{e.email}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500 truncate">{e.message}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">{formatDate(e.createdAt)}</p>
                    {e.country && <p className="text-xs text-gray-400 mt-0.5">{e.country}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                  <button
                    onClick={(ev) => { ev.stopPropagation(); toggleRead(e.id, e.read); }}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
                    title={e.read ? 'Mark unread' : 'Mark read'}
                  >
                    {e.read ? <Mail size={16} /> : <MailOpen size={16} />}
                  </button>
                  <button
                    onClick={(ev) => { ev.stopPropagation(); handleDelete(e.id); }}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                  {expanded === e.id ? <ChevronUp size={16} className="text-gray-400 ml-1" /> : <ChevronDown size={16} className="text-gray-400 ml-1" />}
                </div>
              </div>

              {/* Expanded detail */}
              {expanded === e.id && (
                <div className="px-5 pb-5 pt-1 border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-6 mb-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex gap-2">
                        <span className="text-gray-400 w-16 flex-shrink-0">Name</span>
                        <span className="text-gray-900 font-medium">{e.name}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-gray-400 w-16 flex-shrink-0">Email</span>
                        <a href={`mailto:${e.email}`} className="text-lime-600 hover:underline">{e.email}</a>
                      </div>
                      {e.phone && (
                        <div className="flex gap-2">
                          <span className="text-gray-400 w-16 flex-shrink-0">Phone</span>
                          <span className="text-gray-900">{e.phone}</span>
                        </div>
                      )}
                      {e.country && (
                        <div className="flex gap-2">
                          <span className="text-gray-400 w-16 flex-shrink-0">Country</span>
                          <span className="text-gray-900">{e.country}</span>
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-gray-400">
                      Received {formatDate(e.createdAt)}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide">Message</p>
                    <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap">{e.message}</div>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <a
                      href={`mailto:${e.email}?subject=Re: Your enquiry to Bruton Gardens`}
                      className="text-sm bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors font-medium"
                    >
                      Reply via Email
                    </a>
                    {e.phone && (
                      <a
                        href={`https://wa.me/${e.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                      >
                        WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

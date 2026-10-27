'use client';
import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { PageHeader, Card, Button, Field, Input, Select, Badge, Modal, Table, Td, Empty, ErrorText, api, useApi, formatDate } from '../_components/ui';
import { ROLES, ROLE_LABELS, MATRIX, type Role } from '@/lib/auth/rbac';
import { useStaff } from '../_components/StaffContext';

type StaffRow = { id: number; username: string; name: string; role: Role; active: boolean; lastLoginAt: string | null };

const roleOptions = ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] }));

export default function StaffPage() {
  const me = useStaff();
  const canEdit = me?.role === 'owner';
  const { data, loading, error, reload } = useApi<StaffRow[]>('/api/admin/staff');
  const [editing, setEditing] = useState<Partial<StaffRow> & { password?: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  async function save() {
    if (!editing) return;
    setSaving(true);
    setFormError('');
    try {
      if (editing.id) {
        await api('/api/admin/staff', {
          method: 'PATCH',
          json: { id: editing.id, name: editing.name, role: editing.role, active: editing.active, ...(editing.password ? { password: editing.password } : {}) },
        });
      } else {
        await api('/api/admin/staff', { method: 'POST', json: editing });
      }
      setEditing(null);
      reload();
    } catch (e) {
      setFormError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-8">
      <PageHeader
        title="Staff & Roles"
        subtitle="Staff logins and what each role can access."
        actions={canEdit && <Button onClick={() => setEditing({ role: 'front_desk', active: true })}><UserPlus size={16} /> Add staff</Button>}
      />

      <Card padded={false} className="mb-8">
        {loading ? <Empty>Loading…</Empty> : error ? <Empty>{error}</Empty> : (
          <Table head={['Name', 'Username', 'Role', 'Status', 'Last login', '']}>
            {data?.map((s) => (
              <tr key={s.id}>
                <Td className="font-medium text-gray-900">{s.name}</Td>
                <Td className="text-gray-600">{s.username}</Td>
                <Td>{ROLE_LABELS[s.role]}</Td>
                <Td>{s.active ? <Badge color="green">active</Badge> : <Badge color="gray">disabled</Badge>}</Td>
                <Td className="text-gray-500">{formatDate(s.lastLoginAt, true)}</Td>
                <Td className="text-right">
                  {canEdit && <Button variant="ghost" onClick={() => setEditing({ ...s })}>Edit</Button>}
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Card title="Access matrix">
        <div className="overflow-x-auto">
          <table className="text-sm w-full">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="py-2 pr-6 font-medium">Area</th>
                {ROLES.map((r) => <th key={r} className="py-2 px-3 font-medium text-center">{ROLE_LABELS[r]}</th>)}
              </tr>
            </thead>
            <tbody>
              {Object.entries(MATRIX).map(([perm, levels]) => (
                <tr key={perm} className="border-t border-gray-100">
                  <td className="py-2 pr-6 capitalize text-gray-700">{perm}</td>
                  {ROLES.map((r) => (
                    <td key={r} className="py-2 px-3 text-center">
                      {levels[r] === 'full' ? '●' : levels[r] === 'view' ? '○' : <span className="text-gray-300">—</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400 mt-3">● full · ○ view only · — no access</p>
      </Card>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'Edit staff member' : 'Add staff member'}>
        {editing && (
          <div className="space-y-4">
            <Field label="Full name"><Input value={editing.name ?? ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></Field>
            {!editing.id && (
              <Field label="Username"><Input value={editing.username ?? ''} onChange={(e) => setEditing({ ...editing, username: e.target.value })} /></Field>
            )}
            <Field label="Role">
              <Select options={roleOptions} value={editing.role} onChange={(e) => setEditing({ ...editing, role: e.target.value as Role })} />
            </Field>
            <Field label={editing.id ? 'New password' : 'Password'} hint={editing.id ? 'leave blank to keep' : 'min 8 characters'}>
              <Input type="password" value={editing.password ?? ''} onChange={(e) => setEditing({ ...editing, password: e.target.value })} />
            </Field>
            {editing.id && (
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={!!editing.active} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} />
                Account active
              </label>
            )}
            <ErrorText>{formError}</ErrorText>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
              <Button onClick={save} loading={saving}>Save</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

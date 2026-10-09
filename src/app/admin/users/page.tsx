'use client';

import { useEffect, useState, useCallback } from 'react';
import { FiSearch, FiEdit2, FiChevronDown } from 'react-icons/fi';
import { cn } from '@/lib/utils';
import Modal from '@/components/Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { axiosInstance } from '@/lib/fetchDataFromApi';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  isActive: boolean;
  createdAt: string;
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
        active
          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', active ? 'bg-green-500' : 'bg-red-500')} />
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className={cn(
        'px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide',
        role === 'admin'
          ? 'bg-primary/10 text-primary'
          : 'bg-muted text-muted-foreground'
      )}
    >
      {role}
    </span>
  );
}

// ─── Edit user modal ───────────────────────────────────────────────────────────

interface EditModalProps {
  user: AdminUser | null;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onSave: (updated: AdminUser) => void;
}

function EditUserModal({ user, isOpen, setIsOpen, onSave }: EditModalProps) {
  const [name, setName]     = useState('');
  const [email, setEmail]   = useState('');
  const [role, setRole]     = useState<'user' | 'admin'>('user');
  const [error, setError]   = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setRole(user.role);
      setError('');
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    if (!name.trim() || !email.trim()) {
      setError('Name and email are required');
      return;
    }
    setSaving(true);
    try {
      const res = await axiosInstance.patch(`/admin/users/${user._id}`, { name, email, role });
      onSave(res.data.user);
      setIsOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Save failed';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} setIsOpen={setIsOpen} className="max-w-md">
      <div className="p-6 space-y-4">
        <h2 className="text-lg font-bold">Edit User</h2>
        {error && <p className="text-destructive text-sm">{error}</p>}

        <div className="space-y-3">
          <label className="block">
            <span className="text-sm font-medium mb-1 block">Name</span>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-sm font-medium mb-1 block">Email</span>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-sm font-medium mb-1 block">Role</span>
            <select
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
              value={role}
              onChange={(e) => setRole(e.target.value as 'user' | 'admin')}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </label>
        </div>

        <div className="flex gap-3 pt-2">
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
          <Button variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Deactivate confirmation modal ────────────────────────────────────────────

interface ConfirmDeactivateProps {
  user: AdminUser | null;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onConfirm: () => void;
}

function ConfirmDeactivate({ user, isOpen, setIsOpen, onConfirm }: ConfirmDeactivateProps) {
  const isDeactivating = user?.isActive;
  return (
    <Modal isOpen={isOpen} setIsOpen={setIsOpen} className="max-w-sm">
      <div className="p-6 text-center space-y-4">
        <h2 className="text-lg font-bold">
          {isDeactivating ? 'Deactivate' : 'Reactivate'} user?
        </h2>
        <p className="text-sm text-muted-foreground">
          {isDeactivating
            ? `${user?.name} will be deactivated and unable to log in.`
            : `${user?.name} will be reactivated.`}
        </p>
        <div className="flex gap-3 justify-center">
          <Button
            variant="outline"
            className="border-destructive text-destructive hover:bg-destructive hover:text-white"
            onClick={onConfirm}
          >
            Yes, {isDeactivating ? 'deactivate' : 'reactivate'}
          </Button>
          <Button onClick={() => setIsOpen(false)}>Cancel</Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const [users, setUsers]               = useState<AdminUser[]>([]);
  const [loading, setLoading]           = useState(true);
  const [q, setQ]                       = useState('');
  const [roleFilter, setRoleFilter]     = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [editUser, setEditUser]         = useState<AdminUser | null>(null);
  const [editOpen, setEditOpen]         = useState(false);
  const [deactivateUser, setDeactivateUser] = useState<AdminUser | null>(null);
  const [deactivateOpen, setDeactivateOpen] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (q)            params.q = q;
      if (roleFilter)   params.role = roleFilter;
      if (statusFilter) params.status = statusFilter;

      const res = await axiosInstance.get('/admin/users', { params });
      setUsers(res.data.users);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [q, roleFilter, statusFilter]);

  useEffect(() => {
    const t = setTimeout(fetchUsers, 250);
    return () => clearTimeout(t);
  }, [fetchUsers]);

  const handleSaved = (updated: AdminUser) => {
    setUsers((prev) => prev.map((u) => (u._id === updated._id ? updated : u)));
  };

  const handleToggleStatus = async () => {
    if (!deactivateUser) return;
    try {
      const res = await axiosInstance.patch(`/admin/users/${deactivateUser._id}`, {
        isActive: !deactivateUser.isActive,
      });
      setUsers((prev) =>
        prev.map((u) => (u._id === res.data.user._id ? res.data.user : u))
      );
    } catch { /* swallow */ }
    setDeactivateOpen(false);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {users.length} user{users.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search name or email…"
            className="pl-9"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="relative">
          <select
            className="h-10 rounded-md border border-input bg-background px-3 pr-8 text-sm outline-none focus:border-primary appearance-none"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">All roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <FiChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none text-muted-foreground" />
        </div>

        <div className="relative">
          <select
            className="h-10 rounded-md border border-input bg-background px-3 pr-8 text-sm outline-none focus:border-primary appearance-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <FiChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none text-muted-foreground" />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-16 text-muted-foreground">Loading…</div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">No users found.</div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-accent text-left">
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Joined</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-accent/50 transition-colors">
                  <td className="px-4 py-3 font-medium">{user.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                  <td className="px-4 py-3"><RoleBadge role={user.role} /></td>
                  <td className="px-4 py-3"><StatusBadge active={user.isActive} /></td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        title="Edit user"
                        className="p-1.5 rounded hover:bg-accent transition-colors"
                        onClick={() => { setEditUser(user); setEditOpen(true); }}
                      >
                        <FiEdit2 className="h-4 w-4" />
                      </button>
                      <button
                        title={user.isActive ? 'Deactivate' : 'Reactivate'}
                        className={cn(
                          'px-2 py-1 rounded text-xs font-medium transition-colors',
                          user.isActive
                            ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                            : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                        )}
                        onClick={() => { setDeactivateUser(user); setDeactivateOpen(true); }}
                      >
                        {user.isActive ? 'Deactivate' : 'Reactivate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      <EditUserModal
        user={editUser}
        isOpen={editOpen}
        setIsOpen={setEditOpen}
        onSave={handleSaved}
      />
      <ConfirmDeactivate
        user={deactivateUser}
        isOpen={deactivateOpen}
        setIsOpen={setDeactivateOpen}
        onConfirm={handleToggleStatus}
      />
    </div>
  );
}

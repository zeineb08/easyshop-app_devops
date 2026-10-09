'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { FiPlus, FiEdit2, FiTrash2, FiChevronRight } from 'react-icons/fi';
import Modal from '@/components/Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { axiosInstance } from '@/lib/fetchDataFromApi';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface AdminShop {
  _id: string;
  slug: string;
  title: string;
  icon: string;
  order: number;
  isActive: boolean;
}

// ─── Create / Edit modal ───────────────────────────────────────────────────────

interface ShopFormModalProps {
  shop: AdminShop | null;  // null = create
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onSave: (shop: AdminShop) => void;
}

function ShopFormModal({ shop, isOpen, setIsOpen, onSave }: ShopFormModalProps) {
  const isEdit = !!shop;

  const [title, setTitle]  = useState('');
  const [slug, setSlug]    = useState('');
  const [icon, setIcon]    = useState('');
  const [order, setOrder]  = useState(0);
  const [error, setError]  = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (shop) {
      setTitle(shop.title);
      setSlug(shop.slug);
      setIcon(shop.icon);
      setOrder(shop.order);
    } else {
      setTitle(''); setSlug(''); setIcon(''); setOrder(0);
    }
    setError('');
  }, [shop, isOpen]);

  // Auto-generate slug from title on create
  const handleTitleChange = (v: string) => {
    setTitle(v);
    if (!isEdit) {
      setSlug(v.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !slug.trim()) {
      setError('Title and slug are required');
      return;
    }
    setSaving(true);
    try {
      let res;
      if (isEdit) {
        res = await axiosInstance.patch(`/admin/shops/${shop!.slug}`, { title, slug, icon, order });
      } else {
        res = await axiosInstance.post('/admin/shops', { title, slug, icon, order });
      }
      onSave(res.data.shop);
      setIsOpen(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Save failed';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} setIsOpen={setIsOpen} className="max-w-md">
      <div className="p-6 space-y-4">
        <h2 className="text-lg font-bold">{isEdit ? 'Edit Shop' : 'Create Shop'}</h2>
        {error && <p className="text-destructive text-sm">{error}</p>}

        <div className="space-y-3">
          <label className="block">
            <span className="text-sm font-medium mb-1 block">Title</span>
            <Input value={title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="e.g. Bakery Shop" />
          </label>
          <label className="block">
            <span className="text-sm font-medium mb-1 block">Slug (URL segment)</span>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              placeholder="e.g. bakery"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium mb-1 block">Icon path</span>
            <Input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="/icons/bakery.png" />
          </label>
          <label className="block">
            <span className="text-sm font-medium mb-1 block">Sort order</span>
            <Input type="number" value={order} onChange={(e) => setOrder(Number(e.target.value))} />
          </label>
        </div>

        <div className="flex gap-3 pt-2">
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create shop'}
          </Button>
          <Button variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Delete confirmation ───────────────────────────────────────────────────────

interface ConfirmDeleteProps {
  shop: AdminShop | null;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onConfirm: () => void;
}

function ConfirmDeleteShop({ shop, isOpen, setIsOpen, onConfirm }: ConfirmDeleteProps) {
  return (
    <Modal isOpen={isOpen} setIsOpen={setIsOpen} className="max-w-sm">
      <div className="p-6 text-center space-y-4">
        <h2 className="text-lg font-bold text-destructive">Delete shop?</h2>
        <p className="text-sm text-muted-foreground">
          This will permanently delete <strong>{shop?.title}</strong> and all its categories.
          This cannot be undone.
        </p>
        <div className="flex gap-3 justify-center">
          <Button
            variant="outline"
            className="border-destructive text-destructive hover:bg-destructive hover:text-white"
            onClick={onConfirm}
          >
            Yes, delete
          </Button>
          <Button onClick={() => setIsOpen(false)}>Cancel</Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function AdminShopsPage() {
  const [shops, setShops]           = useState<AdminShop[]>([]);
  const [loading, setLoading]       = useState(true);
  const [formShop, setFormShop]     = useState<AdminShop | null>(null);
  const [formOpen, setFormOpen]     = useState(false);
  const [deleteShop, setDeleteShop] = useState<AdminShop | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const fetchShops = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/admin/shops');
      setShops(res.data.shops);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchShops(); }, [fetchShops]);

  const handleSaved = (saved: AdminShop) => {
    setShops((prev) => {
      const exists = prev.find((s) => s._id === saved._id);
      return exists
        ? prev.map((s) => (s._id === saved._id ? saved : s))
        : [...prev, saved];
    });
  };

  const handleDelete = async () => {
    if (!deleteShop) return;
    await axiosInstance.delete(`/admin/shops/${deleteShop.slug}`);
    setShops((prev) => prev.filter((s) => s._id !== deleteShop._id));
    setDeleteOpen(false);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Shops</h1>
          <p className="text-muted-foreground text-sm mt-1">{shops.length} shops</p>
        </div>
        <Button onClick={() => { setFormShop(null); setFormOpen(true); }}>
          <FiPlus className="mr-2 h-4 w-4" /> New shop
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-16 text-muted-foreground">Loading…</div>
      ) : shops.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          No shops yet.{' '}
          <button className="text-primary underline" onClick={() => { setFormShop(null); setFormOpen(true); }}>
            Create one
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {shops
            .sort((a, b) => a.order - b.order)
            .map((shop) => (
              <div
                key={shop._id}
                className={cn(
                  'flex items-center gap-4 p-4 rounded-xl border bg-card hover:bg-accent/40 transition-colors',
                  !shop.isActive && 'opacity-60'
                )}
              >
                {/* Icon preview */}
                <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center text-xl shrink-0 overflow-hidden">
                  {shop.icon ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={shop.icon} alt={shop.title} className="w-8 h-8 object-contain" />
                  ) : (
                    '🛍️'
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{shop.title}</p>
                  <p className="text-xs text-muted-foreground">/shops/{shop.slug}</p>
                </div>

                {!shop.isActive && (
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">Inactive</span>
                )}

                <div className="flex items-center gap-1 shrink-0">
                  <Link
                    href={`/admin/shops/${shop.slug}`}
                    className="p-1.5 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                    title="Manage categories"
                  >
                    <FiChevronRight className="h-4 w-4" />
                  </Link>
                  <button
                    title="Edit shop"
                    className="p-1.5 rounded hover:bg-accent transition-colors"
                    onClick={() => { setFormShop(shop); setFormOpen(true); }}
                  >
                    <FiEdit2 className="h-4 w-4" />
                  </button>
                  <button
                    title="Delete shop"
                    className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-destructive transition-colors"
                    onClick={() => { setDeleteShop(shop); setDeleteOpen(true); }}
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}

      <ShopFormModal shop={formShop} isOpen={formOpen} setIsOpen={setFormOpen} onSave={handleSaved} />
      <ConfirmDeleteShop shop={deleteShop} isOpen={deleteOpen} setIsOpen={setDeleteOpen} onConfirm={handleDelete} />
    </div>
  );
}

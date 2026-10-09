'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiPlus, FiEdit2, FiTrash2, FiCornerDownRight } from 'react-icons/fi';
import Modal from '@/components/Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { axiosInstance } from '@/lib/fetchDataFromApi';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Category {
  _id: string;
  shopSlug: string;
  name: string;
  slug: string;
  parent: string | null;
  order: number;
  icon: string;
}

export interface CategoryNode extends Category {
  children: CategoryNode[];
}

interface Shop {
  _id: string;
  slug: string;
  title: string;
  icon: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function buildTree(cats: Category[]): CategoryNode[] {
  const map = new Map<string, CategoryNode>();
  cats.forEach((c) => map.set(c._id, { ...c, children: [] }));

  const roots: CategoryNode[] = [];
  map.forEach((node) => {
    if (node.parent && map.has(node.parent)) {
      map.get(node.parent)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  // Sort each level by order
  const sort = (arr: CategoryNode[]) => {
    arr.sort((a, b) => a.order - b.order);
    arr.forEach((n) => sort(n.children));
  };
  sort(roots);
  return roots;
}

// ─── Category form modal ───────────────────────────────────────────────────────

interface CategoryFormModalProps {
  shopSlug: string;
  category: Category | null; // null = create
  categories: Category[];
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  defaultParentId?: string | null;
  onSave: (cat: Category) => void;
}

function CategoryFormModal({
  shopSlug,
  category,
  categories,
  isOpen,
  setIsOpen,
  defaultParentId,
  onSave,
}: CategoryFormModalProps) {
  const isEdit = !!category;
  const [name, setName]     = useState('');
  const [slug, setSlug]     = useState('');
  const [parent, setParent] = useState<string>('');
  const [order, setOrder]   = useState(0);
  const [icon, setIcon]     = useState('');
  const [error, setError]   = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setSlug(category.slug);
      setParent(category.parent ?? '');
      setOrder(category.order);
      setIcon(category.icon ?? '');
    } else {
      setName(''); setSlug(''); setIcon('');
      setParent(defaultParentId ?? '');
      setOrder(0);
    }
    setError('');
  }, [category, isOpen, defaultParentId]);

  const handleNameChange = (v: string) => {
    setName(v);
    if (!isEdit) {
      setSlug(v.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !slug.trim()) {
      setError('Name and slug are required');
      return;
    }
    setSaving(true);
    try {
      let res;
      const payload = {
        shopSlug,
        name,
        slug,
        parent: parent || null,
        order,
        icon,
      };
      if (isEdit) {
        res = await axiosInstance.patch(`/admin/categories/${category!._id}`, payload);
      } else {
        res = await axiosInstance.post('/admin/categories', payload);
      }
      onSave(res.data.category);
      setIsOpen(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Save failed';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  // Available parents: all categories except the current one (can't be its own parent)
  const parentOptions = categories.filter((c) => c._id !== category?._id);

  return (
    <Modal isOpen={isOpen} setIsOpen={setIsOpen} className="max-w-md">
      <div className="p-6 space-y-4">
        <h2 className="text-lg font-bold">{isEdit ? 'Edit Category' : 'Add Category'}</h2>
        {error && <p className="text-destructive text-sm">{error}</p>}

        <div className="space-y-3">
          <label className="block">
            <span className="text-sm font-medium mb-1 block">Name</span>
            <Input value={name} onChange={(e) => handleNameChange(e.target.value)} placeholder="e.g. Women" />
          </label>
          <label className="block">
            <span className="text-sm font-medium mb-1 block">Slug</span>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              placeholder="e.g. women"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium mb-1 block">Parent category (optional)</span>
            <select
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
              value={parent}
              onChange={(e) => setParent(e.target.value)}
            >
              <option value="">— None (top-level) —</option>
              {parentOptions.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium mb-1 block">Icon path (optional)</span>
            <Input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="/icons/example.png" />
          </label>
          <label className="block">
            <span className="text-sm font-medium mb-1 block">Sort order</span>
            <Input type="number" value={order} onChange={(e) => setOrder(Number(e.target.value))} />
          </label>
        </div>

        <div className="flex gap-3 pt-2">
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add category'}
          </Button>
          <Button variant="outline" onClick={() => setIsOpen(false)} className="flex-1">Cancel</Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Delete confirmation ───────────────────────────────────────────────────────

interface ConfirmDeleteCatProps {
  category: Category | null;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onConfirm: () => void;
}

function ConfirmDeleteCat({ category, isOpen, setIsOpen, onConfirm }: ConfirmDeleteCatProps) {
  return (
    <Modal isOpen={isOpen} setIsOpen={setIsOpen} className="max-w-sm">
      <div className="p-6 text-center space-y-4">
        <h2 className="text-lg font-bold text-destructive">Delete category?</h2>
        <p className="text-sm text-muted-foreground">
          <strong>{category?.name}</strong> and all its sub-categories will be permanently deleted.
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

// ─── Recursive tree row ────────────────────────────────────────────────────────

interface TreeRowProps {
  node: CategoryNode;
  depth: number;
  allCats: Category[];
  shopSlug: string;
  onEdit: (cat: Category) => void;
  onDelete: (cat: Category) => void;
  onAddChild: (parentId: string) => void;
}

function TreeRow({ node, depth, allCats, shopSlug, onEdit, onDelete, onAddChild }: TreeRowProps) {
  return (
    <>
      <tr className={cn('hover:bg-accent/40 transition-colors border-b last:border-0')}>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2" style={{ paddingLeft: depth * 20 }}>
            {depth > 0 && <FiCornerDownRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
            <span className="font-medium">{node.name}</span>
          </div>
        </td>
        <td className="px-4 py-3 text-muted-foreground text-sm">{node.slug}</td>
        <td className="px-4 py-3 text-sm text-muted-foreground">{node.order}</td>
        <td className="px-4 py-3">
          <div className="flex gap-1">
            <button
              title="Add child category"
              className="p-1.5 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
              onClick={() => onAddChild(node._id)}
            >
              <FiPlus className="h-3.5 w-3.5" />
            </button>
            <button
              title="Edit"
              className="p-1.5 rounded hover:bg-accent transition-colors"
              onClick={() => onEdit(node)}
            >
              <FiEdit2 className="h-3.5 w-3.5" />
            </button>
            <button
              title="Delete"
              className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-destructive transition-colors"
              onClick={() => onDelete(node)}
            >
              <FiTrash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </td>
      </tr>
      {node.children.map((child) => (
        <TreeRow
          key={child._id}
          node={child}
          depth={depth + 1}
          allCats={allCats}
          shopSlug={shopSlug}
          onEdit={onEdit}
          onDelete={onDelete}
          onAddChild={onAddChild}
        />
      ))}
    </>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function ShopCategoriesPage() {
  const params   = useParams<{ slug: string }>();
  const slug     = params.slug;
  const router   = useRouter();

  const [shop, setShop]             = useState<Shop | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading]       = useState(true);
  const [notFound, setNotFound]     = useState(false);

  const [formCat, setFormCat]         = useState<Category | null>(null);
  const [formOpen, setFormOpen]       = useState(false);
  const [defaultParent, setDefaultParent] = useState<string | null>(null);
  const [deleteCat, setDeleteCat]     = useState<Category | null>(null);
  const [deleteOpen, setDeleteOpen]   = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/admin/shops/${slug}`);
      setShop(res.data.shop);
      setCategories(res.data.categories);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSaved = (saved: Category) => {
    setCategories((prev) => {
      const exists = prev.find((c) => c._id === saved._id);
      return exists ? prev.map((c) => (c._id === saved._id ? saved : c)) : [...prev, saved];
    });
  };

  const handleDelete = async () => {
    if (!deleteCat) return;
    await axiosInstance.delete(`/admin/categories/${deleteCat._id}`);
    // Remove the deleted cat and any descendants from local state
    const idsToRemove = new Set<string>();
    const collectIds = (id: string) => {
      idsToRemove.add(id);
      categories.filter((c) => c.parent === id).forEach((c) => collectIds(c._id));
    };
    collectIds(deleteCat._id);
    setCategories((prev) => prev.filter((c) => !idsToRemove.has(c._id)));
    setDeleteOpen(false);
  };

  const openAddChild = (parentId: string) => {
    setDefaultParent(parentId);
    setFormCat(null);
    setFormOpen(true);
  };

  const openAddRoot = () => {
    setDefaultParent(null);
    setFormCat(null);
    setFormOpen(true);
  };

  if (loading) return <div className="text-center py-20 text-muted-foreground">Loading…</div>;
  if (notFound) return (
    <div className="text-center py-20">
      <p className="text-muted-foreground mb-4">Shop not found.</p>
      <Link href="/admin/shops" className="text-primary underline">Back to shops</Link>
    </div>
  );

  const tree = buildTree(categories);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/shops" className="p-1.5 rounded hover:bg-accent transition-colors">
          <FiArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{shop?.title}</h1>
          <p className="text-muted-foreground text-sm">/shops/{slug}</p>
        </div>
        <Button onClick={openAddRoot}>
          <FiPlus className="mr-2 h-4 w-4" /> Add category
        </Button>
      </div>

      {/* Categories table */}
      {categories.length === 0 ? (
        <div className="text-center py-16 border rounded-xl text-muted-foreground">
          No categories yet.{' '}
          <button className="text-primary underline" onClick={openAddRoot}>Add one</button>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-accent text-left">
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Slug</th>
                <th className="px-4 py-3 font-semibold">Order</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tree.map((node) => (
                <TreeRow
                  key={node._id}
                  node={node}
                  depth={0}
                  allCats={categories}
                  shopSlug={slug}
                  onEdit={(cat) => { setFormCat(cat); setDefaultParent(null); setFormOpen(true); }}
                  onDelete={(cat) => { setDeleteCat(cat); setDeleteOpen(true); }}
                  onAddChild={openAddChild}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CategoryFormModal
        shopSlug={slug}
        category={formCat}
        categories={categories}
        isOpen={formOpen}
        setIsOpen={setFormOpen}
        defaultParentId={defaultParent}
        onSave={handleSaved}
      />
      <ConfirmDeleteCat
        category={deleteCat}
        isOpen={deleteOpen}
        setIsOpen={setDeleteOpen}
        onConfirm={handleDelete}
      />
    </div>
  );
}

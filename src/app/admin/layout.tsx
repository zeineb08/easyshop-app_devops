import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/auth/utils';
import AdminSidebar from '@/components/admin/AdminSidebar';

export const metadata: Metadata = {
  title: 'EasyShop Admin',
  description: 'Admin dashboard for EasyShop',
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side guard — middleware already rejects unauthenticated requests,
  // but we repeat the check here to guarantee role enforcement even if the
  // matcher config changes.
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) redirect('/login?redirect=/admin');

  const decoded = await verifyToken(token);
  if (!decoded || decoded.role !== 'admin') redirect('/');

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}

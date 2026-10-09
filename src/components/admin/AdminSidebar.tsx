'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { FiUsers, FiShoppingBag, FiHome, FiLogOut } from 'react-icons/fi';
import { removeCookies } from '@/app/actions';

const navItems = [
  { href: '/admin/users',  label: 'Users',         icon: FiUsers },
  { href: '/admin/shops',  label: 'Shops',          icon: FiShoppingBag },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router   = useRouter();

  const handleLogout = async () => {
    await removeCookies();
    router.push('/login');
  };

  return (
    <aside className="w-64 shrink-0 bg-secondary border-r flex flex-col h-full">
      {/* Brand */}
      <div className="px-6 py-5 border-b">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-black bg-gradient text-transparent bg-clip-text">
            Easy<span className="text-primary">Shop</span>
          </span>
        </Link>
        <p className="text-xs text-muted-foreground mt-0.5 font-medium tracking-wide uppercase">
          Admin Console
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              pathname.startsWith(href)
                ? 'bg-primary text-white'
                : 'text-foreground hover:bg-accent'
            )}
          >
            <Icon className="shrink-0 h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>

      {/* Footer actions */}
      <div className="px-3 py-4 border-t space-y-1">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-accent transition-colors"
        >
          <FiHome className="shrink-0 h-4 w-4" />
          Back to Store
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-accent transition-colors text-left text-destructive"
        >
          <FiLogOut className="shrink-0 h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}

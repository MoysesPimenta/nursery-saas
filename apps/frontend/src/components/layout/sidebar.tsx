'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useParams } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  Shield,
  Menu,
  X,
  Baby,
  UserCircle,
  Settings,
  LogOut,
  Heart,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles?: string[];
}

const navItems: NavItem[] = [
  { href: '', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/children', label: 'Children', icon: Baby },
  { href: '/employees', label: 'Employees', icon: Users, roles: ['admin', 'manager'] },
  { href: '/visits', label: 'Visits', icon: CalendarCheck },
  { href: '/admin', label: 'Admin', icon: Shield, roles: ['admin'] },
];

export function Sidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const { userProfile, signOut } = useAuth();

  const isActive = (href: string) => {
    const localizedHref = `/${locale}${href}`;
    if (href === '') return pathname === `/${locale}` || pathname === `/${locale}/`;
    return pathname.startsWith(localizedHref);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push(`/${locale}/auth/login`);
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  const getLocalizedHref = (href: string) => `/${locale}${href}`;

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shadow-glow">
          <Heart className="w-4 h-4 text-white" />
        </div>
        <span className="text-lg font-bold gradient-text">MyNurse</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        {navItems
          .filter((item) => !item.roles || item.roles.includes(userProfile?.role || ''))
          .map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={getLocalizedHref(item.href)}
              onClick={() => setOpen(false)}
              className={cn(
                'group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full gradient-primary" />
              )}
              <Icon className={cn('w-[18px] h-[18px] transition-colors', active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-sidebar-border px-3 py-3 space-y-1">
        <Link
          href={getLocalizedHref('/profile')}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-all duration-200"
        >
          <UserCircle className="w-[18px] h-[18px]" />
          <span>Profile</span>
        </Link>
        <Link
          href={getLocalizedHref('/settings')}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-all duration-200"
        >
          <Settings className="w-[18px] h-[18px]" />
          <span>Settings</span>
        </Link>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all duration-200"
        >
          <LogOut className="w-[18px] h-[18px]" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
          className="bg-background/80 backdrop-blur-sm shadow-sm"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen w-[260px] border-r border-sidebar-border bg-sidebar transition-transform duration-300 md:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}

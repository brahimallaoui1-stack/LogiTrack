
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Building2, Briefcase, Users } from 'lucide-react';

const sidebarNavItems = [
  {
    title: 'Villes',
    href: '/parametres/villes',
    icon: Building2,
  },
  {
    title: 'Types de Mission',
    href: '/parametres/missions',
    icon: Briefcase,
  },
  {
    title: 'Gestionnaires',
    href: '/parametres/gestionnaires',
    icon: Users,
  },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="grid md:grid-cols-[220px_1fr] gap-6">
       <aside className="hidden md:flex flex-col gap-4">
         <nav className="grid gap-1">
            {sidebarNavItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    'w-full justify-start',
                    pathname === item.href ? 'bg-muted hover:bg-muted' : ''
                  )}
                >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.title}
                </Button>
              </Link>
            ))}
        </nav>
      </aside>
       <div className="md:hidden">
          <div className="flex space-x-1 border-b mb-4">
              {sidebarNavItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    className={cn(
                      'justify-start',
                      pathname === item.href ? 'font-bold border-b-2 border-primary' : 'text-muted-foreground'
                    )}
                  >
                      {item.title}
                  </Button>
                </Link>
              ))}
          </div>
      </div>
      <main className="md:col-start-2">{children}</main>
    </div>
  );
}

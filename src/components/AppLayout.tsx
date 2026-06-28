
"use client";

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, ListTodo, Settings, CreditCard, FileText, LogOut } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import Image from 'next/image';

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarInset,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';
import { Separator } from './ui/separator';

function AuthGuard({ children }: { children: React.ReactNode }) {
    const { user, isLoading, init } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();

    React.useEffect(() => {
        const unsubscribe = init();
        return () => unsubscribe();
    }, [init]);

    React.useEffect(() => {
        if (!isLoading && !user && pathname !== '/login') {
            router.push('/login');
        }
    }, [user, isLoading, router, pathname]);

    if (isLoading || (!user && pathname !== '/login')) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative w-16 h-16 animate-pulse">
                        <Image 
                            src="/icon-192x192.png" 
                            alt="Chargement..." 
                            fill 
                            className="object-contain"
                        />
                    </div>
                    <p className="text-muted-foreground">Chargement de Logi Track...</p>
                </div>
            </div>
        );
    }
    
    if (!user && pathname === '/login') {
        return <>{children}</>;
    }
    
    if(user){
       return <>{children}</>;
    }

    return null;
}

function MainAppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, signOut } = useAuthStore();
  const { setOpenMobile } = useSidebar();

  const handleLogout = async () => {
    await signOut();
  };
  
  const handleLinkClick = () => {
    setOpenMobile(false);
  }

  return (
    <>
       <Sidebar>
            <SidebarHeader className="p-4">
                <Link href="/" className="flex items-center gap-3" onClick={handleLinkClick}>
                    <div className="relative w-10 h-10 overflow-hidden rounded-lg">
                        <Image 
                            src="/icon-192x192.png" 
                            alt="Logo Logi Track" 
                            fill 
                            className="object-contain"
                        />
                    </div>
                    <h1 className="text-xl font-headline">
                        <span className="font-bold">Logi</span>
                        <span>Track</span>
                    </h1>
                </Link>
            </SidebarHeader>
            <SidebarContent>
                <div className="flex flex-col h-full">
                    <SidebarMenu>
                        <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            isActive={pathname === '/'}
                             onClick={handleLinkClick}
                        >
                            <Link href="/">
                            <LayoutDashboard />
                            <span>Tableau de bord</span>
                            </Link>
                        </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            isActive={pathname.startsWith('/missions')}
                             onClick={handleLinkClick}
                        >
                            <Link href="/missions">
                            <ListTodo />
                            <span>Missions</span>
                            </Link>
                        </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            isActive={pathname.startsWith('/depenses')}
                             onClick={handleLinkClick}
                        >
                            <Link href="/depenses">
                                <CreditCard />
                                <span>Dépenses</span>
                            </Link>
                        </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            isActive={pathname === '/facturation'}
                             onClick={handleLinkClick}
                        >
                            <Link href="/facturation">
                                <FileText />
                                <span>Facturation</span>
                            </Link>
                        </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                asChild
                                isActive={pathname.startsWith('/parametres')}
                                 onClick={handleLinkClick}
                            >
                                <Link href="/parametres">
                                    <Settings />
                                    <span>Paramètres</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                         <SidebarMenuItem>
                            <SidebarMenuButton onClick={handleLogout} className="w-full">
                                <LogOut />
                                <span>Déconnexion</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>

                    <div className="mt-auto">
                        {user && (
                             <div className="p-2">
                                <p className="text-sm text-sidebar-foreground/80 truncate">{user.email}</p>
                             </div>
                        )}
                        <Separator className="my-2"/>
                    </div>
                </div>
            </SidebarContent>
        </Sidebar>
        <SidebarInset>
            <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:h-16 sm:px-6 md:hidden">
            <SidebarTrigger>
                 <span className="text-2xl text-primary font-bold">☰</span>
            </SidebarTrigger>
            <div className="flex-1 flex justify-center md:hidden">
                <div className="relative w-8 h-8">
                    <Image 
                        src="/icon-192x192.png" 
                        alt="Logo" 
                        fill 
                        className="object-contain"
                    />
                </div>
            </div>
            </header>
            <main className="flex-1 p-4 sm:p-6">
            {children}
            </main>
        </SidebarInset>
    </>
  )
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === '/login') {
    return (
        <AuthGuard>
            <main className="flex-1">
                {children}
            </main>
        </AuthGuard>
    )
  }

  return (
    <AuthGuard>
        <SidebarProvider>
            <MainAppLayout>{children}</MainAppLayout>
        </SidebarProvider>
    </AuthGuard>
  );
}

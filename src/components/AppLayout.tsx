
"use client";

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Briefcase, PanelLeft, LayoutDashboard, ListTodo, Settings, Building, Users, ChevronDown, CreditCard, FileText, LogOut } from 'lucide-react';
import { useAuthStore } from '@/lib/store';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
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
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Toaster } from "@/components/ui/toaster";
import { cn } from '@/lib/utils';
import { Separator } from './ui/separator';
import { Skeleton } from './ui/skeleton';

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
                    <Briefcase className="h-12 w-12 text-primary animate-pulse" />
                    <p className="text-muted-foreground">Chargement de LogiTrack...</p>
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


export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, signOut } = useAuthStore();
  const isSettingsOpen = pathname.startsWith('/parametres') || pathname === '/villes' || pathname === '/gestionnaires';

  const handleLogout = async () => {
    await signOut();
  };

  if (pathname === '/login') {
    return (
        <AuthGuard>
            <main className="flex-1">
                {children}
                <Toaster />
            </main>
        </AuthGuard>
    )
  }

  return (
    <AuthGuard>
        <SidebarProvider>
        <Sidebar>
            <SidebarHeader className="p-4">
                <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/10 h-10 w-10">
                    <Briefcase className="h-6 w-6" />
                </Button>
                <h1 className="text-xl font-semibold font-headline">LogiTrack</h1>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <div className="flex flex-col h-full">
                    <SidebarMenu>
                        <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            isActive={pathname === '/'}
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
                        >
                            <Link href="/missions">
                            <ListTodo />
                            <span>Missions</span>
                            </Link>
                        </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                        <Link href="/depenses">
                            <SidebarMenuButton
                                isActive={pathname.startsWith('/depenses')}
                                className="w-full"
                            >
                                <CreditCard />
                                <span>Dépenses</span>
                            </SidebarMenuButton>
                        </Link>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                        <Link href="/facturation">
                            <SidebarMenuButton
                                isActive={pathname === '/facturation'}
                                className="w-full"
                            >
                                <FileText />
                                <span>Facturation</span>
                            </SidebarMenuButton>
                        </Link>
                        </SidebarMenuItem>
                        
                        <Collapsible defaultOpen={isSettingsOpen}>
                            <SidebarMenuItem>
                            <CollapsibleTrigger asChild>
                                <SidebarMenuButton
                                    className="w-full justify-between"
                                    isActive={isSettingsOpen}
                                >
                                    <div className="flex items-center gap-2">
                                    <Settings />
                                    <span>Paramètres</span>
                                    </div>
                                    <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
                                </SidebarMenuButton>
                            </CollapsibleTrigger>
                            </SidebarMenuItem>
                            <CollapsibleContent className="ml-4_">
                                <SidebarMenu>
                                <SidebarMenuItem>
                                    <SidebarMenuButton
                                        asChild
                                        variant="ghost"
                                        className="w-full justify-start"
                                        isActive={pathname === '/parametres/missions'}
                                    >
                                    <Link href="/parametres/missions">
                                        <ListTodo className="h-4 w-4 mr-2" />
                                        <span>Missions</span>
                                    </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                                <SidebarMenuItem>
                                    <SidebarMenuButton
                                        asChild
                                        variant="ghost"
                                        className="w-full justify-start"
                                        isActive={pathname === '/parametres/villes'}
                                        >
                                        <Link href="/parametres/villes">
                                        <Building className="h-4 w-4 mr-2" />
                                        <span>Villes</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                                <SidebarMenuItem>
                                    <SidebarMenuButton
                                        asChild
                                        variant="ghost"
                                        className="w-full justify-start"
                                        isActive={pathname === '/parametres/gestionnaires'}
                                        >
                                        <Link href="/parametres/gestionnaires">
                                            <Users className="h-4 w-4 mr-2" />
                                            <span>Gestionnaires</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                                </SidebarMenu>
                            </CollapsibleContent>
                        </Collapsible>
                        
                    </SidebarMenu>

                    <div className="mt-auto">
                        {user && (
                             <div className="p-2">
                                <p className="text-sm text-sidebar-foreground/80 truncate">{user.email}</p>
                             </div>
                        )}
                        <Separator className="my-2"/>
                        <SidebarMenu>
                             <SidebarMenuItem>
                                <SidebarMenuButton onClick={handleLogout} className="w-full">
                                    <LogOut />
                                    <span>Déconnexion</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </div>
                </div>
            </SidebarContent>
        </Sidebar>
        <SidebarInset>
            <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:h-16 sm:px-6 md:hidden">
            <SidebarTrigger>
                <PanelLeft />
            </SidebarTrigger>
            </header>
            <main className="flex-1 p-4 sm:p-6">
            {children}
            <Toaster />
            </main>
        </SidebarInset>
        </SidebarProvider>
    </AuthGuard>
  );
}

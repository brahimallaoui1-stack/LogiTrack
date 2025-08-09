
"use client";

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Briefcase, PanelLeft, LayoutDashboard, ListTodo, Settings, Building, Users, ChevronDown, CreditCard, FileText } from 'lucide-react';

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

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isSettingsOpen = pathname.startsWith('/parametres') || pathname === '/villes' || pathname === '/gestionnaires';


  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/10 h-10 w-10">
                <Briefcase className="h-6 w-6" />
              </Button>
              <h1 className="text-xl font-semibold font-headline">App</h1>
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
                </SidebarMenu>

                <div className="mt-auto">
                    <Separator className="my-2"/>
                    <SidebarMenu>
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
  );
}

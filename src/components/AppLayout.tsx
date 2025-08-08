"use client";

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Briefcase, LayoutDashboard, ListTodo, ReceiptText, PanelLeft } from 'lucide-react';

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Toaster } from "@/components/ui/toaster";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/10 h-10 w-10">
                <Briefcase className="h-6 w-6" />
              </Button>
              <h1 className="text-xl font-semibold font-headline">ExpenseTrack</h1>
            </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === '/'}>
                <Link href="/">
                  <LayoutDashboard />
                  Tableau de bord
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === '/unbilled'}>
                <Link href="/unbilled">
                  <ListTodo />
                  Tâches non facturées
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === '/billed'}>
                <Link href="/billed">
                  <ReceiptText />
                  Facturation
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
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

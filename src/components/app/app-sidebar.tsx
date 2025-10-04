"use client";

import { usePathname } from "next/navigation";
import { Users, Waves, Package, ShoppingCart, Settings, Coffee, LineChart, Warehouse } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import Link from "next/link";

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 p-2">
            <Waves className="text-primary group-data-[collapsible=icon]:hidden" />
            <h1 className="text-xl font-bold text-foreground group-data-[collapsible=icon]:hidden">Hydra</h1>
        </div>
        <SidebarTrigger className="group-data-[collapsible=icon]:hidden" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith("/colaboradores")}
              tooltip="Colaboradores"
            >
              <Link href="/colaboradores">
                <div className="flex items-center gap-2">
                  <Users />
                  <span>Colaboradores</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith("/produtos")}
              tooltip="Produtos"
            >
              <Link href="/produtos">
                <div className="flex items-center gap-2">
                  <Package />
                  <span>Produtos</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith("/vendas")}
              tooltip="Vendas"
            >
              <Link href="/vendas">
                <div className="flex items-center gap-2">
                  <ShoppingCart />
                  <span>Vendas</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
           <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === "/relatorios/vendas"}
              tooltip="Relatório de Vendas"
            >
              <Link href="/relatorios/vendas">
                <div className="flex items-center gap-2">
                    <LineChart />
                    <span>Relatório de Vendas</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === "/relatorios/estoque"}
              tooltip="Posição de Estoque"
            >
              <Link href="/relatorios/estoque">
                <div className="flex items-center gap-2">
                    <Warehouse />
                    <span>Posição de Estoque</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith("/cafeterias")}
              tooltip="Cafeterias"
            >
              <Link href="/cafeterias">
                <div className="flex items-center gap-2">
                  <Coffee />
                  <span>Cafeterias</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
           <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith("/admin")}
              tooltip="Parâmetros"
            >
              <Link href="/admin">
                <div className="flex items-center gap-2">
                  <Settings />
                  <span>Parâmetros</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
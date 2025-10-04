"use client";

import { usePathname } from "next/navigation";
import {
  Users,
  Waves,
  Package,
  ShoppingCart,
  Settings,
  Coffee,
  LineChart,
  Warehouse,
} from "lucide-react";

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
          <h1 className="text-xl font-bold text-foreground group-data-[collapsible=icon]:hidden">
            Hydra
          </h1>
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
                <Users />
                <span>Colaboradores</span>
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
                <Package />
                <span>Produtos</span>
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
                <ShoppingCart />
                <span>Vendas</span>
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
                <LineChart />
                <span>Relatório de Vendas</span>
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
                <Warehouse />
                <span>Posição de Estoque</span>
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
                <Coffee />
                <span>Cafeterias</span>
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
                <Settings />
                <span>Parâmetros</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}

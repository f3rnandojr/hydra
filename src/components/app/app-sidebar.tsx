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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem
} from "@/components/ui/sidebar";
import Link from "next/link";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";

export function AppSidebar() {
  const pathname = usePathname();
  const [relatoriosOpen, setRelatoriosOpen] = useState(pathname.startsWith('/relatorios'));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 p-2">
            <ButtonOrDiv>
                <Waves className="text-primary" />
            </ButtonOrDiv>
            <h1 className="text-xl font-bold text-foreground">Hydra</h1>
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

// Small helper to render a div on small screens and a TooltipTrigger on larger ones for the icon-only view
function ButtonOrDiv({ children }: { children: React.ReactNode }) {
    return <div className="group-data-[collapsible=icon]:hidden">{children}</div>;
}
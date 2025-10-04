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
  Receipt,
  Users2,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

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
  const { usuario } = useAuth();

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
            <Link href="/colaboradores">
              <SidebarMenuButton
                isActive={pathname.startsWith("/colaboradores")}
                tooltip="Colaboradores"
              >
                <Users />
                <span>Colaboradores</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/produtos">
              <SidebarMenuButton
                isActive={pathname.startsWith("/produtos")}
                tooltip="Produtos"
              >
                <Package />
                <span>Produtos</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/vendas">
              <SidebarMenuButton
                isActive={pathname.startsWith("/vendas")}
                tooltip="Vendas"
              >
                <ShoppingCart />
                <span>Vendas</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
           <SidebarMenuItem>
            <Link href="/contas-receber">
              <SidebarMenuButton
                isActive={pathname.startsWith("/contas-receber")}
                tooltip="Contas a Receber"
              >
                <Receipt />
                <span>Contas a Receber</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/relatorios/vendas">
              <SidebarMenuButton
                isActive={pathname === "/relatorios/vendas"}
                tooltip="Relatório de Vendas"
              >
                <LineChart />
                <span>Relatório de Vendas</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/relatorios/estoque">
              <SidebarMenuButton
                isActive={pathname === "/relatorios/estoque"}
                tooltip="Posição de Estoque"
              >
                <Warehouse />
                <span>Posição de Estoque</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/cafeterias">
              <SidebarMenuButton
                isActive={pathname.startsWith("/cafeterias")}
                tooltip="Cafeterias"
              >
                <Coffee />
                <span>Cafeterias</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          {usuario?.tipo === 'gestor' && (
            <>
              <SidebarMenuItem>
                <Link href="/usuarios">
                  <SidebarMenuButton
                    isActive={pathname.startsWith("/usuarios")}
                    tooltip="Usuários"
                  >
                    <Users2 />
                    <span>Usuários</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/admin">
                  <SidebarMenuButton
                    isActive={pathname.startsWith("/admin")}
                    tooltip="Parâmetros"
                  >
                    <Settings />
                    <span>Parâmetros</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </>
          )}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}

"use client";

import { usePathname } from "next/navigation";
import { Users, Waves, Package } from "lucide-react";

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
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}

// Small helper to render a div on small screens and a TooltipTrigger on larger ones for the icon-only view
function ButtonOrDiv({ children }: { children: React.ReactNode }) {
    return <div className="group-data-[collapsible=icon]:hidden">{children}</div>;
}

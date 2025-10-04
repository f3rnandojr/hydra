import { AppSidebar } from "@/components/app/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

export default function RelatoriosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}

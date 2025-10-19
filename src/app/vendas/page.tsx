import { VendaForm } from "@/components/app/vendas/venda-form";

export default async function VendasPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <VendaForm />
    </div>
  );
}

import { VendaForm } from "@/components/app/vendas/venda-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function VendasPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <div className="flex items-center">
        <h1 className="font-semibold text-lg md:text-2xl">Ponto de Venda</h1>
      </div>
      <VendaForm />
    </div>
  );
}

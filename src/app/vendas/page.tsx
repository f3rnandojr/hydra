import { VendaForm } from "@/components/app/vendas/venda-form";
import { GerenciarVendas } from "@/components/app/vendas/gerenciar-vendas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function VendasPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <div className="flex items-center">
        <h1 className="font-semibold text-lg md:text-2xl">Ponto de Venda</h1>
      </div>

      <Tabs defaultValue="nova_venda" className="space-y-4">
        <TabsList>
          <TabsTrigger value="nova_venda">Nova Venda</TabsTrigger>
          <TabsTrigger value="gerenciar_vendas">Gerenciar Vendas</TabsTrigger>
        </TabsList>
        <TabsContent value="nova_venda" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Registrar Nova Venda</CardTitle>
            </CardHeader>
            <CardContent>
              <VendaForm />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="gerenciar_vendas" className="space-y-4">
           <GerenciarVendas />
        </TabsContent>
      </Tabs>
    </div>
  );
}

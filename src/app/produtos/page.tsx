import { getProducts } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

export default async function ProdutosPage() {
  const products = await getProducts();

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <div className="flex items-center">
        <h1 className="font-semibold text-lg md:text-2xl">Produtos</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Novo Produto
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Lista de Produtos</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Tabela de produtos aparecerá aqui.</p>
          <pre>{JSON.stringify(products, null, 2)}</pre>
        </CardContent>
      </Card>
    </div>
  );
}

import { getProducts } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateProductButton } from "@/components/app/produtos/buttons";
import { CreateEntradaButton } from "@/components/app/entradas/buttons";
import { ProductsTable } from "@/components/app/produtos/table";

export default async function ProdutosPage() {
  const products = await getProducts();

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <div className="flex items-center">
        <h1 className="font-semibold text-lg md:text-2xl">Produtos</h1>
        <div className="ml-auto flex items-center gap-2">
          <CreateEntradaButton />
          <CreateProductButton />
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Lista de Produtos</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductsTable products={products} />
        </CardContent>
      </Card>
    </div>
  );
}

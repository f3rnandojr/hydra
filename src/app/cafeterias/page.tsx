import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateCafeteriaButton } from "@/components/app/cafeterias/buttons";
import { CafeteriasTable } from "@/components/app/cafeterias/table";
import { getCafeterias } from "@/lib/data";


export default async function CafeteriasPage() {
  const cafeterias = await getCafeterias();

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <div className="flex items-center">
        <h1 className="font-semibold text-lg md:text-2xl">Cafeterias</h1>
        <div className="ml-auto flex items-center gap-2">
          <CreateCafeteriaButton />
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Lista de Cafeterias</CardTitle>
        </CardHeader>
        <CardContent>
          <CafeteriasTable cafeterias={cafeterias} />
        </CardContent>
      </Card>
    </div>
  );
}

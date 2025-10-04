
import { ParametrosAdmin } from "@/components/app/admin/parametros-admin";
import { ParametrosFiscais } from "@/components/app/admin/parametros-fiscais";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";


export default function AdminPage() {
  return (
    <>
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Configurações</h2>
          <p className="text-muted-foreground">
            Gerencie as configurações gerais e fiscais do sistema.
          </p>
        </div>
      </div>
      <Tabs defaultValue="gerais" className="space-y-4">
        <TabsList>
          <TabsTrigger value="gerais">Parâmetros Gerais</TabsTrigger>
          <TabsTrigger value="fiscais">Dados Fiscais</TabsTrigger>
        </TabsList>
        <TabsContent value="gerais" className="space-y-4">
          <ParametrosAdmin />
        </TabsContent>
        <TabsContent value="fiscais" className="space-y-4">
          <ParametrosFiscais />
        </TabsContent>
      </Tabs>
    </>
  );
}

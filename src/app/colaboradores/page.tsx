import { getCollaborators } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CollaboratorsTable } from "@/components/app/colaboradores/table";
import { CreateCollaboratorButton } from "@/components/app/colaboradores/buttons";

export default async function ColaboradoresPage() {
  const collaborators = await getCollaborators();

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <div className="flex items-center">
        <h1 className="font-semibold text-lg md:text-2xl">Colaboradores</h1>
        <div className="ml-auto flex items-center gap-2">
          <CreateCollaboratorButton />
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Lista de Colaboradores</CardTitle>
        </CardHeader>
        <CardContent>
          <CollaboratorsTable collaborators={collaborators} />
        </CardContent>
      </Card>
    </div>
  );
}

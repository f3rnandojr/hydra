import { GerenciarUsuarios } from "@/components/app/usuarios/gerenciar-usuarios";
import { getUsuarios } from "@/lib/data";

export default async function UsuariosPage() {
  const usuarios = await getUsuarios();

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <GerenciarUsuarios initialUsuarios={usuarios} />
    </div>
  );
}
import { GerenciarSetores } from "@/components/app/setores/gerenciar-setores";
import { getAbsoluteApiUrl } from "@/lib/utils";

async function getSetores() {
    try {
      // Usa a função para garantir que a URL seja absoluta, resolvendo o erro de fetch no servidor.
      const apiUrl = getAbsoluteApiUrl('/api/setores');
      const res = await fetch(apiUrl, { cache: 'no-store' });
      
      if (!res.ok) {
          console.error("Falha ao buscar setores:", res.status, res.statusText);
          const errorBody = await res.text();
          console.error("Corpo do erro:", errorBody);
          return [];
      }
      const data = await res.json();
      return data;
    } catch (error) {
      console.error("Erro de conexão ao buscar setores:", error);
      return [];
    }
}


export default async function SetoresPage() {
  const setores = await getSetores();

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <GerenciarSetores initialSetores={setores} />
    </div>
  );
}

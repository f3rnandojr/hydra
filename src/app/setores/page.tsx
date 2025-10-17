import { GerenciarSetores } from "@/components/app/setores/gerenciar-setores";

async function getSetores() {
    // A API é chamada usando um caminho relativo, que funciona no servidor e no cliente.
    const res = await fetch('/api/setores', { cache: 'no-store' });
    if (!res.ok) {
        // Retorna um array vazio em caso de erro para não quebrar a página.
        console.error("Falha ao buscar setores:", res.statusText);
        return [];
    }
    const data = await res.json();
    return data;
}


export default async function SetoresPage() {
  const setores = await getSetores();

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <GerenciarSetores initialSetores={setores} />
    </div>
  );
}

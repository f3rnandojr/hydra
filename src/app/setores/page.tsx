import { GerenciarSetores } from "@/components/app/setores/gerenciar-setores";

async function getSetores() {
    // No futuro, isso pode vir de uma chamada de dados no servidor
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/setores`, { cache: 'no-store' });
    if (!res.ok) {
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

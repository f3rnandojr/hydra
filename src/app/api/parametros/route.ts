
import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";

const defaultParameters = [
  {
    chave: "CAFETERIA_ATIVA",
    valor: "cafeteria_01",
    descricao: "Cafeteria ativa no sistema - valores: cafeteria_01, cafeteria_02, etc",
    dataCriacao: new Date(),
    dataAtualizacao: new Date()
  },
  {
    chave: "TAXA_SERVICO",
    valor: "0.10",
    descricao: "Taxa de serviço aplicável (decimal - ex: 0.10 para 10%)",
    dataCriacao: new Date(),
    dataAtualizacao: new Date()
  },
  {
    chave: "HORARIO_FUNCIONAMENTO",
    valor: "08:00-22:00",
    descricao: "Horário de funcionamento da cafeteria",
    dataCriacao: new Date(),
    dataAtualizacao: new Date()
  },
  {
    chave: "DIAS_FUNCIONAMENTO", 
    valor: "segunda-sabado",
    descricao: "Dias de funcionamento da cafeteria",
    dataCriacao: new Date(),
    dataAtualizacao: new Date()
  }
];

// GET - Buscar um ou todos os parâmetros
export async function GET(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("hydra");
    const parametrosCollection = db.collection("parametros");
    const { searchParams } = new URL(request.url);
    const chave = searchParams.get('chave');

    let resultado;
    if (chave) {
      // Busca um parâmetro específico
      resultado = await parametrosCollection.findOne({ chave });
      if (!resultado) {
        return NextResponse.json({ error: `Parâmetro ${chave} não encontrado.` }, { status: 404 });
      }
    } else {
      // Busca todos os parâmetros
      resultado = await parametrosCollection.find({}).sort({ chave: 1 }).toArray();
      // Se não houver parâmetros, insere os padrões (seeding)
      if (resultado.length === 0) {
        await parametrosCollection.insertMany(defaultParameters);
        resultado = await parametrosCollection.find({}).sort({ chave: 1 }).toArray();
      }
    }

    return NextResponse.json(resultado);
  } catch (error) {
    console.error("Erro ao buscar parâmetro(s):", error);
    return NextResponse.json({ error: "Erro interno ao buscar parâmetro(s)" }, { status: 500 });
  }
}


// POST - Atualizar um parâmetro (para admin)
export async function POST(request: Request) {
  try {
    const { chave, valor } = await request.json();
    if (!chave || valor === undefined) {
        return NextResponse.json({ error: "Os campos 'chave' e 'valor' são obrigatórios." }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("hydra");
    
    await db.collection("parametros").updateOne(
      { chave: chave },
      { 
        $set: { 
          valor: valor,
          dataAtualizacao: new Date()
        } 
      },
      { upsert: true }
    );

    return NextResponse.json({ success: true, message: `Parâmetro ${chave} atualizado com sucesso.` });
  } catch (error) {
    console.error("Erro ao atualizar parâmetro:", error);
    return NextResponse.json({ error: "Erro interno ao atualizar parâmetro" }, { status: 500 });
  }
}

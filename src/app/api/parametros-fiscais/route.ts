import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { z } from "zod";

const fiscalParamsSchema = z.object({
  cnpj: z.string().optional(),
  razaoSocial: z.string().optional(),
  nomeFantasia: z.string().optional(),
  endereco: z.object({
    logradouro: z.string().optional(),
    numero: z.string().optional(),
    bairro: z.string().optional(),
    cidade: z.string().optional(),
    estado: z.string().optional(),
    cep: z.string().optional(),
  }).optional(),
  inscricaoEstadual: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().email("Email inválido").optional(),
  numeroSat: z.string().optional(),
  modeloSat: z.string().optional(),
});

// Usaremos um ID fixo para o documento único de configuração fiscal
const CONFIG_ID = "66a16335d1b72e73752e50c7"; 

export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db("hydra");
    const collection = db.collection("configuracao_fiscal");

    let config = await collection.findOne({});

    if (!config) {
      // Se não existir, cria um documento vazio
      const emptyConfig = {
        _id: CONFIG_ID,
        cnpj: "",
        razaoSocial: "",
        nomeFantasia: "",
        endereco: {
          logradouro: "",
          numero: "",
          bairro: "",
          cidade: "",
          estado: "",
          cep: "",
        },
        inscricaoEstadual: "",
        telefone: "",
        email: "",
        numeroSat: "",
        modeloSat: "",
        dataAtualizacao: new Date(),
      };
      await collection.insertOne(emptyConfig as any);
      config = emptyConfig;
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error("Erro ao buscar configuração fiscal:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar configuração fiscal" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = fiscalParamsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validation.error.flatten() },
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db("hydra");
    const collection = db.collection("configuracao_fiscal");

    const updateData = {
      ...validation.data,
      dataAtualizacao: new Date(),
    };

    await collection.updateOne(
      {}, // Filtro vazio para pegar o único documento
      { $set: updateData },
      { upsert: true } // Cria se não existir
    );

    return NextResponse.json({
      success: true,
      message: "Configurações fiscais atualizadas com sucesso.",
    });

  } catch (error) {
    console.error("Erro ao atualizar configuração fiscal:", error);
    return NextResponse.json(
      { error: "Erro interno ao atualizar configuração fiscal" },
      { status: 500 }
    );
  }
}

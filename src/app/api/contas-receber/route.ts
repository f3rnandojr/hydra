import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const colaboradorId = searchParams.get('colaboradorId');

    const client = await clientPromise;
    const db = client.db("hydra");

    const filtro: any = {};
    if (status && status !== 'todos') filtro.status = status;
    if (colaboradorId && colaboradorId !== 'todos') filtro.colaboradorId = new ObjectId(colaboradorId);

    const contas = await db.collection("contas_receber")
      .aggregate([
        {
          $match: filtro
        },
        {
          $lookup: {
            from: "colaboradores",
            localField: "colaboradorId",
            foreignField: "_id",
            as: "colaborador"
          }
        },
        {
          $lookup: {
            from: "vendas",
            localField: "vendaId",
            foreignField: "_id",
            as: "venda"
          }
        },
        {
          $lookup: {
            from: "usuarios",
            localField: "usuarioQuitacaoId",
            foreignField: "_id",
            as: "usuarioQuitacao"
          }
        },
        {
          $unwind: { path: "$colaborador", preserveNullAndEmptyArrays: true }
        },
        {
          $unwind: { path: "$venda", preserveNullAndEmptyArrays: true }
        },
        {
          $unwind: { path: "$usuarioQuitacao", preserveNullAndEmptyArrays: true }
        },
        {
          $sort: { dataVenda: -1 }
        }
      ])
      .toArray();

    return NextResponse.json(contas.map(conta => ({
      ...conta,
      _id: conta._id.toString(),
      vendaId: conta.vendaId?.toString(),
      colaboradorId: conta.colaboradorId?.toString(),
      colaborador: conta.colaborador ? {
        ...conta.colaborador,
        _id: conta.colaborador._id.toString()
      } : null,
      venda: conta.venda ? {
        ...conta.venda,
        _id: conta.venda._id.toString()
      } : null,
      usuarioQuitacao: conta.usuarioQuitacao ? {
        _id: conta.usuarioQuitacao._id.toString(),
        nome: conta.usuarioQuitacao.nome
      } : null
    })));
  } catch (error) {
    console.error("Erro ao buscar contas a receber:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { contaId, status, formaQuitacao } = await request.json();
    const authHeader = request.headers.get('authorization');
    const usuarioId = authHeader?.split(' ')[1] || "669ff07e8c3395d96a513f18"; // Temporário

    if (!contaId || !status) {
      return NextResponse.json(
        { error: "ContaId e status são obrigatórios" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("hydra");

    const updateData: any = {
      status: status,
      dataAtualizacao: new Date(),
      usuarioQuitacaoId: new ObjectId(usuarioId),
    };

    if (status === "quitado") {
      updateData.dataQuitacao = new Date();
      updateData.formaQuitacao = formaQuitacao || "dinheiro";
    }

    const resultado = await db.collection("contas_receber").updateOne(
      { _id: new ObjectId(contaId) },
      { $set: updateData }
    );

    if (resultado.modifiedCount === 0) {
      return NextResponse.json(
        { error: "Conta não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: "Conta atualizada com sucesso" 
    });
  } catch (error) {
    console.error("Erro ao atualizar conta:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

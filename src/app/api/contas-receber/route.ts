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
    if (status) filtro.status = status;
    if (colaboradorId) filtro.colaboradorId = new ObjectId(colaboradorId);

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
          $unwind: { path: "$colaborador", preserveNullAndEmptyArrays: true }
        },
        {
          $unwind: { path: "$venda", preserveNullAndEmptyArrays: true }
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
  const session = (await clientPromise).startSession();
  try {
    const body = await request.json();
    const { contaIds, formaPagamento } = body;

    if (!Array.isArray(contaIds) || contaIds.length === 0) {
      return NextResponse.json({ message: "Nenhuma conta selecionada para quitação." }, { status: 400 });
    }
    if (!formaPagamento) {
      return NextResponse.json({ message: "Forma de pagamento da quitação é obrigatória." }, { status: 400 });
    }

    let result;
    await session.withTransaction(async () => {
      const db = (await clientPromise).db("hydra");
      const objectIds = contaIds.map(id => new ObjectId(id));

      result = await db.collection("contas_receber").updateMany(
        { _id: { $in: objectIds }, status: "em_debito" },
        {
          $set: {
            status: "quitado",
            dataQuitacao: new Date(),
            formaQuitacao: formaPagamento,
            dataAtualizacao: new Date()
          }
        },
        { session }
      );
    });

    if (result && result.modifiedCount > 0) {
      return NextResponse.json({ message: `${result.modifiedCount} conta(s) quitada(s) com sucesso.` });
    } else {
      return NextResponse.json({ message: "Nenhuma conta em débito foi encontrada para quitação." }, { status: 404 });
    }

  } catch (error) {
    console.error("Erro ao quitar contas:", error);
    return NextResponse.json({ message: "Falha ao quitar contas." }, { status: 500 });
  } finally {
    await session.endSession();
  }
}

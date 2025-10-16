import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const { contaIds, formaQuitacao } = await request.json();
    const authHeader = request.headers.get('authorization');
    const usuarioId = authHeader?.split(' ')[1];

    if (!usuarioId) {
        return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 });
    }

    if (!Array.isArray(contaIds) || contaIds.length === 0) {
      return NextResponse.json(
        { error: "O array 'contaIds' é obrigatório" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("hydra");

    const objectIds = contaIds.map(id => new ObjectId(id));

    const resultado = await db.collection("contas_receber").updateMany(
      { _id: { $in: objectIds }, status: "em_debito" },
      { 
        $set: { 
          status: "quitado",
          dataQuitacao: new Date(),
          dataAtualizacao: new Date(),
          formaQuitacao: formaQuitacao || "dinheiro",
          usuarioQuitacaoId: new ObjectId(usuarioId),
        } 
      }
    );

    if (resultado.matchedCount === 0) {
      return NextResponse.json(
        { message: "Nenhuma conta em débito foi encontrada para quitação." },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: `${resultado.modifiedCount} contas foram quitadas com sucesso.`
    });

  } catch (error) {
    console.error("Erro ao quitar contas em lote:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

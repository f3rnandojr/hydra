import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import type { Venda, ItemVenda } from '@/lib/definitions';

// Schema para validação dos dados da venda
const itemVendaSchema = z.object({
  produtoId: z.string().refine((val) => ObjectId.isValid(val), { message: "ID de produto inválido." }),
  nomeProduto: z.string(),
  codigoEAN: z.string().optional(),
  quantidade: z.number().min(0.01, "A quantidade deve ser positiva."),
  precoUnitario: z.number().min(0, "O preço unitário não pode ser negativo."),
  subtotal: z.number().min(0, "O subtotal não pode ser negativo."),
});

const vendaSchema = z.object({
  cafeteria: z.string().min(1, "A cafeteria é obrigatória."),
  tipoCliente: z.enum(["normal", "colaborador"]),
  colaboradorId: z.string().optional(),
  formaPagamento: z.enum(["dinheiro", "cartao_credito", "cartao_debito", "pix", "apagar"]),
  itens: z.array(itemVendaSchema).min(1, "A venda deve ter pelo menos um item."),
});

export async function POST(request: NextRequest) {
  const client = await clientPromise;
  const session = client.startSession();

  try {
    const body = await request.json();
    const validation = vendaSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: "Dados da venda inválidos.", errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { itens, ...vendaData } = validation.data;
    let message = "";
    let novaVenda: Venda | null = null;

    await session.withTransaction(async () => {
      const db = client.db("hydra");

      // 1. Verificar estoque de todos os itens
      for (const item of itens) {
        const produto = await db.collection("produtos").findOne(
          { _id: new ObjectId(item.produtoId), ativo: true },
          { session, projection: { saldo: 1, nome: 1 } }
        );

        if (!produto) {
          throw new Error(`Produto "${item.nomeProduto}" não encontrado ou inativo.`);
        }

        if (vendaData.tipoCliente === 'normal' && produto.saldo < item.quantidade) {
          throw new Error(`Estoque insuficiente para o produto "${produto.nome}". Disponível: ${produto.saldo}, Solicitado: ${item.quantidade}.`);
        }
      }

      // 2. Atualizar o estoque de cada produto
      const bulkOperations = itens.map(item => ({
        updateOne: {
          filter: { _id: new ObjectId(item.produtoId) },
          update: { 
            $inc: { saldo: -item.quantidade },
            $set: { dataAtualizacao: new Date() }
          }
        }
      }));
      await db.collection("produtos").bulkWrite(bulkOperations, { session });

      // 3. Criar a venda
      const totalVenda = itens.reduce((sum, item) => sum + item.subtotal, 0);
      const ultimoNumeroVendaDoc = await db.collection("vendas").find({}, { session }).sort({ _id: -1 }).limit(1).project({ numeroVenda: 1 }).toArray();
      const proximoNumero = ultimoNumeroVendaDoc.length > 0 ? parseInt(ultimoNumeroVendaDoc[0].numeroVenda) + 1 : 1;
      
      const vendaDoc: Omit<Venda, '_id'> = {
        numeroVenda: proximoNumero.toString().padStart(8, '0'),
        dataVenda: new Date(),
        cafeteria: vendaData.cafeteria as any,
        tipoCliente: vendaData.tipoCliente,
        colaboradorId: vendaData.colaboradorId,
        formaPagamento: vendaData.formaPagamento,
        itens: itens.map(it => ({...it, produtoId: it.produtoId})),
        total: totalVenda,
        status: "finalizada",
        dataCriacao: new Date(),
      };

      const result = await db.collection("vendas").insertOne(vendaDoc as any, { session });
      
      // Criar registro em contas_receber se for venda "À Pagar"
      if (vendaData.formaPagamento === 'apagar' && vendaData.colaboradorId) {
        await db.collection("contas_receber").insertOne({
          vendaId: result.insertedId,
          colaboradorId: new ObjectId(vendaData.colaboradorId),
          valor: totalVenda,
          dataVenda: new Date(),
          status: "em_debito",
          dataCriacao: new Date(),
          dataAtualizacao: new Date()
        }, { session });
      }

      novaVenda = { ...vendaDoc, _id: result.insertedId.toString() };
      message = "Venda finalizada com sucesso!";
    });

    return NextResponse.json({ message, venda: novaVenda }, { status: 201 });

  } catch (error: any) {
    console.error("Erro na transação de venda:", error);
    return NextResponse.json({ message: error.message || "Falha ao registrar a venda." }, { status: 500 });
  } finally {
    await session.endSession();
  }
}


"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// Schema para Nota Fiscal
const notaFiscalSchema = z.object({
  tipo: z.literal("nota_fiscal"),
  numeroNotaFiscal: z.string().min(1, "Número da nota é obrigatório"),
  itens: z.array(z.object({
    produtoId: z.string().min(1, "Produto é obrigatório"),
    quantidade: z.number().min(0.01, "Quantidade deve ser maior que zero")
  })).min(1, "Adicione pelo menos um item")
});

// Schema para Ajuste
const ajusteSchema = z.object({
  tipo: z.literal("ajuste"),
  produtoId: z.string().min(1, "Produto é obrigatório"),
  novoSaldo: z.number().min(0, "Saldo não pode ser negativo")
});

// Schema principal discriminado
const entradaSchema = z.discriminatedUnion("tipo", [
  notaFiscalSchema,
  ajusteSchema
]);

export async function createEntrada(prevState: any, formData: FormData) {
  // O frontend precisará formatar os itens como uma string JSON
  const rawItems = formData.get("itens");
  const parsedItems = rawItems ? JSON.parse(rawItems as string) : [];

  const rawData = {
    tipo: formData.get("tipo"),
    numeroNotaFiscal: formData.get("numeroNotaFiscal"),
    produtoId: formData.get("produtoId"),
    novoSaldo: formData.get("novoSaldo") ? Number(formData.get("novoSaldo")) : undefined,
    itens: parsedItems
  };

  const validatedFields = entradaSchema.safeParse(rawData);

  if (!validatedFields.success) {
    console.error(validatedFields.error.flatten());
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Erro de validação."
    };
  }

  const client = await clientPromise;
  const session = client.startSession();
  
  try {
    let message = "";
    await session.withTransaction(async () => {
      const db = client.db("hydra");
      const data = validatedFields.data;
      
      if (data.tipo === "nota_fiscal") {
        const itensComSaldos = await Promise.all(
          data.itens.map(async (item) => {
            const produto = await db.collection("produtos").findOne(
              { _id: new ObjectId(item.produtoId) },
              { session }
            );
            
            if (!produto) {
              throw new Error(`Produto ${item.produtoId} não encontrado`);
            }
            
            const saldoAnterior = produto.saldo;
            const saldoAtual = saldoAnterior + item.quantidade;
            
            await db.collection("produtos").updateOne(
              { _id: new ObjectId(item.produtoId) },
              { $set: { saldo: saldoAtual, dataAtualizacao: new Date() } },
              { session }
            );
            
            return {
              produtoId: new ObjectId(item.produtoId),
              quantidade: item.quantidade,
              saldoAnterior,
              saldoAtual
            };
          })
        );
        
        await db.collection("entradas").insertOne({
          tipo: data.tipo,
          numeroNotaFiscal: data.numeroNotaFiscal,
          itens: itensComSaldos,
          dataEntrada: new Date(),
          usuarioId: new ObjectId("669ff07e8c3395d96a513f18") // TODO: Substituir por ID de usuário autenticado
        }, { session });

        message = "Entrada de nota fiscal registrada com sucesso!";
        
      } else { // data.tipo === "ajuste"
        const produto = await db.collection("produtos").findOne(
          { _id: new ObjectId(data.produtoId) },
          { session }
        );
        
        if (!produto) {
          throw new Error("Produto não encontrado");
        }
        
        const saldoAnterior = produto.saldo;
        const saldoAtual = data.novoSaldo;
        
        await db.collection("produtos").updateOne(
          { _id: new ObjectId(data.produtoId) },
          { $set: { saldo: saldoAtual, dataAtualizacao: new Date() } },
          { session }
        );
        
        await db.collection("entradas").insertOne({
          tipo: data.tipo,
          itens: [{
            produtoId: new ObjectId(data.produtoId),
            quantidade: saldoAtual - saldoAnterior, // diferença
            saldoAnterior,
            saldoAtual
          }],
          observacao: "Ajuste de estoque",
          dataEntrada: new Date(),
          usuarioId: new ObjectId("669ff07e8c3395d96a513f18") // TODO: Substituir por ID de usuário autenticado
        }, { session });

        message = "Ajuste de estoque registrado com sucesso!";
      }
    });
    
    revalidatePath("/produtos");
    revalidatePath("/entradas");
    return { message };
    
  } catch (error: any) {
    // A transação já é abortada automaticamente por withTransaction em caso de erro
    console.error("Erro na transação:", error);
    return { message: "Falha ao registrar entrada: " + error.message };
  } finally {
    await session.endSession();
  }
}

"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

const itemSchema = z.object({
  produtoId: z.string().min(1, "Produto é obrigatório"),
  quantidade: z.number().min(0.01, "Quantidade deve ser maior que zero"),
  precoCusto: z.number().min(0.01, "Preço de custo deve ser maior que zero"),
});

const baseSchema = z.object({
  tipo: z.string(),
  cafeteria: z.string().min(1, "Cafeteria é obrigatória")
});

const notaFiscalSchema = baseSchema.extend({
  tipo: z.literal("nota_fiscal"),
  numeroNotaFiscal: z.string().min(1, "Número da nota é obrigatório"),
  itens: z.array(itemSchema).min(1, "Adicione pelo menos um item")
});

const ajusteSchema = baseSchema.extend({
  tipo: z.literal("ajuste"),
  produtoId: z.string().min(1, "Produto é obrigatório"),
  novoSaldo: z.number().min(0, "Saldo não pode ser negativo")
});

const entradaSchema = z.discriminatedUnion("tipo", [
  notaFiscalSchema,
  ajusteSchema
]);

export async function createEntrada(prevState: any, formData: FormData) {
  const rawItems = formData.get("itens");
  const parsedItems = rawItems ? JSON.parse(rawItems as string) : [];

  const rawData = {
    tipo: formData.get("tipo"),
    cafeteria: formData.get("cafeteria"),
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
  
  let message = "";
  try {
    await session.withTransaction(async () => {
      const db = client.db("hydra");
      const data = validatedFields.data;
      
      if (data.tipo === "nota_fiscal") {
        const itensComSaldos = await Promise.all(
          data.itens.map(async (item) => {
            const estoqueAtual = await db.collection("estoque").findOne(
              { 
                produtoId: new ObjectId(item.produtoId),
                cafeteria: data.cafeteria 
              },
              { session }
            );
            
            if (!estoqueAtual) {
              throw new Error(`Produto ${item.produtoId} não encontrado na cafeteria ${data.cafeteria}`);
            }
            
            const saldoAnterior = estoqueAtual.saldo;
            const saldoAtual = saldoAnterior + item.quantidade;
            
            await db.collection("estoque").updateOne(
              { 
                produtoId: new ObjectId(item.produtoId),
                cafeteria: data.cafeteria 
              },
              { $set: { saldo: saldoAtual, dataAtualizacao: new Date() } },
              { session }
            );
            
            return {
              produtoId: new ObjectId(item.produtoId),
              quantidade: item.quantidade,
              precoCusto: item.precoCusto,
              saldoAnterior,
              saldoAtual,
              cafeteria: data.cafeteria
            };
          })
        );
        
        await db.collection("entradas").insertOne({
          tipo: data.tipo,
          numeroNotaFiscal: data.numeroNotaFiscal,
          cafeteria: data.cafeteria,
          itens: itensComSaldos,
          dataEntrada: new Date(),
          usuarioId: new ObjectId("669ff07e8c3395d96a513f18") // TODO: Substituir por ID de usuário autenticado
        }, { session });

        message = "Entrada de nota fiscal registrada com sucesso!";
        
      } else { // data.tipo === "ajuste"
        const estoqueAtual = await db.collection("estoque").findOne(
          { 
            produtoId: new ObjectId(data.produtoId),
            cafeteria: data.cafeteria 
          },
          { session }
        );
        
        if (!estoqueAtual) {
          throw new Error("Produto não encontrado na cafeteria selecionada");
        }
        
        const saldoAnterior = estoqueAtual.saldo;
        const saldoAtual = data.novoSaldo;
        
        await db.collection("estoque").updateOne(
          { 
            produtoId: new ObjectId(data.produtoId),
            cafeteria: data.cafeteria 
          },
          { $set: { saldo: saldoAtual, dataAtualizacao: new Date() } },
          { session }
        );
        
        await db.collection("entradas").insertOne({
          tipo: data.tipo,
          cafeteria: data.cafeteria,
          itens: [{
            produtoId: new ObjectId(data.produtoId),
            quantidade: saldoAtual - saldoAnterior, // diferença
            saldoAnterior,
            saldoAtual,
            cafeteria: data.cafeteria
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

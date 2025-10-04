import clientPromise from './mongodb';
import { ObjectId, type WithId, MongoClient } from 'mongodb';
import type { Collaborator, Product, Entry, EntryItem } from './definitions';
import bcrypt from 'bcrypt';

async function getDb() {
  const client = await clientPromise;
  return client.db('hydra');
}

// Collaborators Functions
export async function getCollaborators(): Promise<Collaborator[]> {
  const db = await getDb();
  const collaborators = await db.collection('colaboradores').find({ deletedAt: null }).toArray();
  return collaborators.map(c => ({
    ...c,
    _id: c._id.toString(),
  })) as unknown as Collaborator[];
}

export async function getCollaboratorById(id: string): Promise<Collaborator | undefined> {
  if (!ObjectId.isValid(id)) {
    return undefined;
  }
  const db = await getDb();
  const collaborator = await db.collection('colaboradores').findOne({ _id: new ObjectId(id) });
  if (collaborator) {
    const { senha, ...rest } = collaborator;
    return {
        ...rest,
        _id: rest._id.toString(),
    } as unknown as Collaborator;
  }
  return undefined;
}

export async function createCollaborator(data: Omit<Collaborator, '_id' | 'dataCriacao' | 'dataAtualizacao' | 'deletedAt'>): Promise<WithId<Collaborator>> {
    const db = await getDb();
    
    const hashedPassword = await bcrypt.hash(data.senha!, 10);

    const newCollaborator = {
      ...data,
      senha: hashedPassword,
      dataCriacao: new Date(),
      dataAtualizacao: new Date(),
      deletedAt: null,
    };

    const result = await db.collection('colaboradores').insertOne(newCollaborator);
    
    return {
        ...newCollaborator,
        _id: result.insertedId,
    };
}

export async function updateCollaborator(id: string, data: Partial<Omit<Collaborator, '_id'>>): Promise<Collaborator | null> {
    if (!ObjectId.isValid(id)) {
        return null;
    }
    const db = await getDb();
    
    const dataToUpdate: any = { ...data };

    if (data.senha) {
        dataToUpdate.senha = await bcrypt.hash(data.senha, 10);
    } else {
        delete dataToUpdate.senha; // Don't update password if it's empty
    }
    
    const result = await db.collection('colaboradores').findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { ...dataToUpdate, dataAtualizacao: new Date() } },
        { returnDocument: 'after' }
    );

    if (result) {
        return {
            ...result,
            _id: result._id.toString(),
        } as unknown as Collaborator;
    }

    return null;
}

export async function deleteCollaborator(id: string): Promise<boolean> {
    if (!ObjectId.isValid(id)) {
        return false;
    }
    const db = await getDb();
    const result = await db.collection('colaboradores').updateOne(
        { _id: new ObjectId(id) },
        { $set: { deletedAt: new Date() } }
    );
    return result.modifiedCount === 1;
}

// Products Functions
export async function getProducts(): Promise<Product[]> {
    const db = await getDb();
    const products = await db.collection('produtos').find({ ativo: true }).toArray();
    return products.map(p => ({
        ...p,
        _id: p._id.toString(),
    })) as unknown as Product[];
}

export async function createProduct(data: Omit<Product, '_id' | 'dataCriacao' | 'dataAtualizacao' | 'ativo' | 'saldo'>): Promise<WithId<Product>> {
    const db = await getDb();
    const newProduct = {
        ...data,
        estoqueMinimo: data.estoqueMinimo || null,
        saldo: 0,
        ativo: true,
        dataCriacao: new Date(),
        dataAtualizacao: new Date(),
    };
    const result = await db.collection('produtos').insertOne(newProduct);
    return {
        ...newProduct,
        _id: result.insertedId,
    };
}

export async function updateProduct(id: string, data: Partial<Omit<Product, '_id'>>): Promise<Product | null> {
    if (!ObjectId.isValid(id)) {
        return null;
    }
    const db = await getDb();
    const result = await db.collection('produtos').findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { ...data, dataAtualizacao: new Date() } },
        { returnDocument: 'after' }
    );
    if (result) {
        return { ...result, _id: result._id.toString() } as unknown as Product;
    }
    return null;
}

export async function deleteProduct(id: string): Promise<boolean> {
    if (!ObjectId.isValid(id)) {
        return false;
    }
    const db = await getDb();
    const result = await db.collection('produtos').updateOne(
        { _id: new ObjectId(id) },
        { $set: { ativo: false, dataAtualizacao: new Date() } }
    );
    return result.modifiedCount === 1;
}


// Entries Functions
export async function createEntry(data: Omit<Entry, '_id' | 'dataEntrada' | 'itens' | 'usuarioId'> & { itens: Omit<EntryItem, 'saldoAnterior' | 'saldoAtual' | 'produtoId'> & {produtoId: string} [], usuarioId: string }) {
    const client = await clientPromise;
    const session = client.startSession();
    const db = client.db('hydra');

    try {
        await session.withTransaction(async () => {
            const productsCollection = db.collection('produtos');
            const entriesCollection = db.collection('entradas');

            const processedItems: EntryItem[] = [];

            for (const item of data.itens) {
                if (!ObjectId.isValid(item.produtoId)) {
                     throw new Error(`ID de produto inválido: ${item.produtoId}`);
                }
                const produtoId = new ObjectId(item.produtoId);

                const product = await productsCollection.findOne({ _id: produtoId }, { session });
                if (!product) {
                    throw new Error(`Produto com ID ${item.produtoId} não encontrado.`);
                }

                const saldoAnterior = product.saldo;
                const saldoAtual = saldoAnterior + item.quantidade;

                await productsCollection.updateOne(
                    { _id: produtoId },
                    { $set: { saldo: saldoAtual, dataAtualizacao: new Date() } },
                    { session }
                );

                processedItems.push({
                    produtoId: produtoId,
                    quantidade: item.quantidade,
                    saldoAnterior,
                    saldoAtual,
                });
            }

            const newEntry = {
                tipo: data.tipo,
                numeroNotaFiscal: data.numeroNotaFiscal,
                observacao: data.observacao,
                itens: processedItems,
                dataEntrada: new Date(),
                usuarioId: new ObjectId(data.usuarioId),
            };

            await entriesCollection.insertOne(newEntry, { session });
        });
    } finally {
        await session.endSession();
    }
}

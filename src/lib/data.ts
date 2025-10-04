import clientPromise from './mongodb';
import { ObjectId, type WithId } from 'mongodb';
import type { Collaborator, Product } from './definitions';
import bcrypt from 'bcrypt';

async function getDb() {
  const client = await clientPromise;
  return client.db('hydra');
}

// Collaborators Functions
export async function getCollaborators(): Promise<Collaborator[]> {
  const db = await getDb();
  const collaborators = await db.collection('colaboradores').find({ deletedAt: null }).sort({ nome: 1 }).toArray();
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
  const collaboratorDoc = await db.collection('colaboradores').findOne({ _id: new ObjectId(id) });
  if (collaboratorDoc) {
    const { senha, ...rest } = collaboratorDoc;
    return {
        ...rest,
        _id: rest._id.toString(),
    } as unknown as Collaborator;
  }
  return undefined;
}

export async function createCollaborator(data: Omit<Collaborator, '_id' | 'dataCriacao' | 'dataAtualizacao' | 'deletedAt'>): Promise<Collaborator> {
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
        _id: result.insertedId.toString(),
    } as Collaborator;
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
    const products = await db.collection('produtos').find({ ativo: true }).sort({ nome: 1 }).toArray();
    return products.map(p => ({
        ...p,
        _id: p._id.toString(),
    })) as unknown as Product[];
}

export async function createProduct(data: Partial<Omit<Product, '_id' | 'dataCriacao' | 'dataAtualizacao' | 'ativo' | 'saldo'>>): Promise<Product> {
    const db = await getDb();

    if (data.codigoEAN) {
        const existingProduct = await db.collection("produtos").findOne({
            codigoEAN: data.codigoEAN,
            ativo: true
        });
        if (existingProduct) {
            throw new Error("Já existe um produto com este código EAN");
        }
    }

    const newProduct = {
        nome: data.nome!,
        tipo: data.tipo!,
        codigoEAN: data.codigoEAN || null,
        estoqueMinimo: data.estoqueMinimo || null,
        saldo: 0,
        ativo: true,
        dataCriacao: new Date(),
        dataAtualizacao: new Date(),
    };
    const result = await db.collection('produtos').insertOne(newProduct);
    return {
        ...newProduct,
        _id: result.insertedId.toString(),
    } as Product;
}

export async function updateProduct(id: string, data: Partial<Omit<Product, '_id'>>): Promise<Product | null> {
    if (!ObjectId.isValid(id)) {
        return null;
    }
    const db = await getDb();

    if (data.codigoEAN) {
        const existingProduct = await db.collection("produtos").findOne({
            codigoEAN: data.codigoEAN,
            ativo: true,
            _id: { $ne: new ObjectId(id) }
        });
        if (existingProduct) {
            throw new Error("Já existe um outro produto com este código EAN");
        }
    }

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

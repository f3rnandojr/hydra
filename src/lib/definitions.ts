import type { ObjectId } from 'mongodb';

export type Collaborator = {
  _id: string | ObjectId;
  nome: string;
  email: string;
  senha?: string;
  status: boolean; // true=ativo, false=inativo
  dataCriacao: Date;
  dataAtualizacao: Date;
  deletedAt: Date | null;
};

export type Product = {
  _id: string | ObjectId;
  nome: string;
  tipo: "alimento" | "bebida";
  estoqueMinimo?: number | null;
  saldo: number;
  ativo: boolean;
  dataCriacao: Date;
  dataAtualizacao: Date;
};

export type EntryItem = {
  produtoId: string | ObjectId;
  quantidade: number;
  saldoAnterior: number;
  saldoAtual: number;
};

export type Entry = {
  _id: string | ObjectId;
  tipo: "nota_fiscal" | "ajuste";
  numeroNotaFiscal?: string;
  itens: EntryItem[];
  observacao?: string;
  dataEntrada: Date;
  usuarioId: string | ObjectId;
};

import type { ObjectId } from 'mongodb';

export type Collaborator = {
  _id: string;
  nome: string;
  email: string;
  senha?: string;
  status: boolean; // true=ativo, false=inativo
  dataCriacao: Date;
  dataAtualizacao: Date;
  deletedAt: Date | null;
};

export type Product = {
  _id: string;
  nome: string;
  tipo: "alimento" | "bebida";
  codigoEAN?: string | null;
  precoVenda: number;
  estoqueMinimo?: number | null;
  saldo: number;
  ativo: boolean;
  dataCriacao: Date;
  dataAtualizacao: Date;
};

export type EntryItem = {
  produtoId: string | ObjectId;
  quantidade: number;
  precoCusto: number;
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

// Tipos para o Módulo de Vendas
export type ItemVenda = {
  produtoId: string;
  nomeProduto: string;
  codigoEAN?: string;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
};

export type Venda = {
  _id: string;
  numeroVenda: string;
  dataVenda: Date;
  cafeteria: "cafeteria_1" | "cafeteria_2";
  tipoCliente: "normal" | "colaborador";
  colaboradorId?: string;
  itens: ItemVenda[];
  total: number;
  status: "finalizada" | "cancelada";
  dataCriacao: Date;
};

export type Caixa = {
  _id: string;
  cafeteria: string;
  dataAbertura: Date;
  dataFechamento?: Date;
  saldoInicial: number;
  saldoFinal?: number;
  vendas: string[]; // Array de IDs de vendas
  status: "aberto" | "fechado";
};

export type Cafeteria = {
  _id: string;
  nome: string;
  codigo: string;
  status: boolean;
  dataCriacao: Date;
  dataAtualizacao: Date;
};
"use client";

import { Venda } from "@/lib/definitions";

export interface Estabelecimento {
  cnpj?: string;
  razaoSocial?: string;
  nomeFantasia?: string;
  endereco?: {
    logradouro?: string;
    numero?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    cep?: string;
  };
  inscricaoEstadual?: string;
  telefone?: string;
  email?: string;
  numeroSat?: string;
  modeloSat?: string;
}

export interface CupomFiscalProps {
  venda: Venda;
  estabelecimento: Estabelecimento;
}

export function CupomFiscal({ venda, estabelecimento }: CupomFiscalProps) {
  
  const enderecoCompleto = [
    estabelecimento.endereco?.logradouro,
    estabelecimento.endereco?.numero,
    estabelecimento.endereco?.bairro,
  ].filter(Boolean).join(", ");
  
  const cidadeEstadoCep = [
    estabelecimento.endereco?.cidade,
    estabelecimento.endereco?.estado,
    estabelecimento.endereco?.cep,
  ].filter(Boolean).join(" - ");

  const formatPrice = (price: number) => `R$ ${price.toFixed(2).replace('.', ',')}`;

  return (
    <div className="bg-white p-4 rounded-lg shadow-md font-mono text-xs text-black max-w-sm mx-auto">
      <div className="text-center">
        <h2 className="font-bold uppercase">{estabelecimento.nomeFantasia || "Nome da Empresa"}</h2>
        <p>{enderecoCompleto}</p>
        <p>{cidadeEstadoCep}</p>
        <p>CNPJ: {estabelecimento.cnpj || "00.000.000/0000-00"}</p>
        <p>IE: {estabelecimento.inscricaoEstadual || "000.000.000.000"}</p>
        <p>IM: {estabelecimento.inscricaoEstadual || "0.000.000-0"}</p>
      </div>

      <hr className="my-2 border-black" />

      {venda.tipoCliente === 'colaborador' && venda.colaborador && (
        <>
          <div className="text-center">
            <p className="font-bold">DADOS DO COLABORADOR</p>
            <p>NOME: {venda.colaborador.nome}</p>
            {venda.colaborador.matricula && <p>MATRICULA: {venda.colaborador.matricula}</p>}
            {venda.colaborador.setor && <p>SETOR: {venda.colaborador.setor}</p>}
          </div>
          <hr className="my-2 border-black" />
        </>
      )}

      <div className="text-center">
        <p>{new Date(venda.dataVenda).toLocaleString('pt-BR')}</p>
        <p>CUPOM FISCAL ELETRÔNICO - SAT</p>
        <p>Extrato Nº {venda.numeroVenda?.toString().padStart(8, '0')}</p>
      </div>

      <hr className="my-2 border-black" />

      <div>
        <p className="text-center font-bold mb-2">DETALHE DA VENDA</p>
        <div className="w-full">
          {/* Cabeçalho da tabela */}
          <div className="flex text-[10px] font-bold border-b border-black pb-1 mb-1">
            <span className="w-8">#</span>
            <span className="w-12">COD</span>
            <span className="flex-1">DESC</span>
            <span className="w-8 text-center">QTD</span>
            <span className="w-8 text-center">UN</span>
            <span className="w-16 text-right">VL UN R$</span>
            <span className="w-16 text-right">VL ITEM R$</span>
          </div>
          
          {/* Itens da venda */}
          {venda.itens.map((item, index) => (
            <div key={index} className="flex items-start py-1 text-[10px]">
              <span className="w-8">{String(index + 1).padStart(3, '0')}</span>
              <span className="w-12">({item.codigoEAN || 'S/COD'})</span>
              <span className="flex-1 uppercase truncate pr-1">{item.nomeProduto}</span>
              <span className="w-8 text-center">{item.quantidade}</span>
              <span className="w-8 text-center">UN</span>
              <span className="w-16 text-right">{formatPrice(item.precoUnitario)}</span>
              <span className="w-16 text-right">{formatPrice(item.subtotal)}</span>
            </div>
          ))}
        </div>
      </div>

      <hr className="my-2 border-black" />

      <div className="space-y-1 text-[11px]">
        <div className="flex justify-between font-bold">
          <span>TOTAL R$</span>
          <span>{formatPrice(venda.total)}</span>
        </div>
        <div className="flex justify-between">
          <span>{venda.formaPagamento?.replace('_', ' ').toUpperCase() || 'DINHEIRO'}</span>
          <span>{formatPrice(venda.total)}</span>
        </div>
      </div>
      
      <hr className="my-2 border-black" />

      <div className="text-center text-[10px]">
        <p>SAT No. {estabelecimento.numeroSat || '000.000.000'}</p>
        <p>Consulte o QR Code pelo aplicativo DeOlhoNoImposto</p>
        <p className="font-bold my-2">-- CHAVE DE ACESSO --</p>
        <p className="break-all text-[8px] leading-tight">
          35240700000000000000590000000000000000000000
        </p>
      </div>
    </div>
  );
}

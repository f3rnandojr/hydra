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

      <hr className="my-2" />

      <div className="text-center">
        <p>{new Date(venda.dataVenda).toLocaleString('pt-BR')}</p>
        <p>CUPOM FISCAL ELETRÔNICO - SAT</p>
        <p>Extrato Nº {venda.numeroVenda}</p>
      </div>

      <hr className="my-2" />

      <div>
        <p className="text-center font-bold mb-2">DETALHE DA VENDA</p>
        <div className="w-full">
            <div className="flex font-bold">
                <div className="flex-grow">#|COD|DESC|QTD|UN|VL UN R$|VL ITEM R$</div>
            </div>
            {venda.itens.map((item, index) => (
            <div key={index} className="flex">
                <div className="w-full">
                    <span>{String(index + 1).padStart(3, '0')}</span>
                    <span className="ml-1">({item.codigoEAN || 'S/COD'})</span>
                    <p className="uppercase ml-1">{item.nomeProduto}</p>
                    <div className="flex justify-end">
                       <span>{item.quantidade} x {formatPrice(item.precoUnitario)}</span>
                       <span className="w-20 text-right">{formatPrice(item.subtotal)}</span>
                    </div>
                </div>
            </div>
            ))}
        </div>
      </div>

      <hr className="my-2" />

      <div className="space-y-1">
        <div className="flex justify-between font-bold">
          <span>TOTAL R$</span>
          <span>{formatPrice(venda.total)}</span>
        </div>
        <div className="flex justify-between">
          <span>{venda.formaPagamento.replace('_', ' ').toUpperCase()}</span>
          <span>{formatPrice(venda.total)}</span>
        </div>
      </div>
      
       <hr className="my-2" />

       <div className="text-center text-xs">
            <p>SAT No. {estabelecimento.numeroSat || '000.000.000'}</p>
            <p>Consulte o QR Code pelo aplicativo DeOlhoNoImposto</p>
            <p className="font-bold my-2">--CHAVE--DE--ACESSO--</p>
            <p className="break-all text-[10px]">35240700000000000000590000000000000000000000</p>
        </div>
    </div>
  );
}

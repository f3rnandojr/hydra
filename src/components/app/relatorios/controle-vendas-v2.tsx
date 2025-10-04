"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Usuario {
  _id: string;
  nome: string;
  email: string;
}

interface Colaborador {
  _id: string;
  nome: string;
  email: string;
}

interface ItemVenda {
  nomeProduto: string;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
}

interface Venda {
  _id: string;
  numeroVenda: string;
  dataVenda: string;
  cafeteria: string;
  formaPagamento: string;
  tipoCliente: string;
  total: number;
  usuarioId: string;
  colaboradorId: string;
  usuario: Usuario | null;
  colaborador: Colaborador | null;
  itens: ItemVenda[];
}

export function ControleVendasV2() {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Buscar vendas ao carregar o componente
  useEffect(() => {
    buscarVendas();
  }, []);

  async function buscarVendas() {
    try {
      console.log('=== FASE 2: INICIANDO BUSCA ===');
      setCarregando(true);
      
      const response = await fetch('/api/relatorios/vendas-v2');
      const data = await response.json();
      
      // DEBUG CRÍTICO - Verificar estrutura dos dados
      console.log('=== DADOS RECEBIDOS NA FASE 2 ===', data);
      if (data.length > 0) {
        console.log('Primeira venda no componente:', {
          numeroVenda: data[0].numeroVenda,
          usuario: data[0].usuario, // ← VERIFICAR SE TEM DADOS
          usuarioNome: data[0].usuario?.nome, // ← VERIFICAR NOME
          colaborador: data[0].colaborador, // ← VERIFICAR SE TEM DADOS
          colaboradorNome: data[0].colaborador?.nome // ← VERIFICAR NOME
        });
      }
      
      setVendas(data);
    } catch (error) {
      console.error('Erro ao buscar vendas:', error);
    } finally {
      setCarregando(false);
    }
  }

  // Função simples para formatar data
  const formatarData = (dataString: string) => {
    return new Date(dataString).toLocaleString('pt-BR');
  };

  // Função simples para formatar pagamento
  const getPaymentLabel = (tipo: string) => {
    const tipos: { [key: string]: string } = {
      'dinheiro': 'Dinheiro',
      'cartao_credito': 'Cartão Crédito', 
      'cartao_debito': 'Cartão Débito',
      'pix': 'PIX',
      'apagar': 'À Pagar'
    };
    return tipos[tipo] || tipo;
  };

  console.log('=== RENDERIZANDO COMPONENTE ===', {
    totalVendas: vendas.length,
    carregando: carregando
  });

  return (
    <div className="space-y-6">
      {/* Cabeçalho Simples */}
      <div>
        <h1 className="text-3xl font-bold">Controle de Vendas V2</h1>
        <p className="text-muted-foreground">
          Nova versão - Base sólida
        </p>
      </div>

      {/* Botão de Recarregar */}
      <Button onClick={buscarVendas} disabled={carregando}>
        {carregando ? "Carregando..." : "Recarregar Dados"}
      </Button>

      {/* Lista SIMPLES de Vendas */}
      <Card>
        <CardHeader>
          <CardTitle>Vendas Realizadas</CardTitle>
          <CardDescription>
            {vendas.length} vendas encontradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {carregando ? (
            <div className="text-center py-8">Carregando vendas...</div>
          ) : vendas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma venda encontrada
            </div>
          ) : (
            <div className="space-y-4">
              {vendas.map((venda) => (
                <Card key={venda._id} className="p-4 border">
                  {/* Debug Visual - Dados Brutos */}
                  <div className="text-xs text-gray-500 mb-2 p-2 bg-gray-50 rounded">
                    DEBUG: {JSON.stringify({
                      usuario: venda.usuario,
                      colaborador: venda.colaborador
                    })}
                  </div>
                  
                  {/* Informações Básicas */}
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-semibold">#{venda.numeroVenda}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatarData(venda.dataVenda)} • {venda.cafeteria}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <strong>Vendedor:</strong> {venda.usuario?.nome || 'N/A'}
                      </div>
                      <div className="text-sm">
                        <strong>Pagamento:</strong> {getPaymentLabel(venda.formaPagamento)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">R$ {venda.total.toFixed(2)}</div>
                    </div>
                  </div>

                  {/* Colaborador */}
                  {venda.tipoCliente === 'colaborador' && (
                    <div className="bg-blue-50 p-2 rounded mb-2">
                      <div className="text-sm">
                        <strong>Colaborador:</strong> {venda.colaborador?.nome || 'N/A'}
                        {venda.colaborador?.email && (
                          <span> ({venda.colaborador.email})</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Itens da Venda */}
                  <div className="text-sm">
                    {venda.itens.map((item, index) => (
                      <div key={index} className="flex justify-between">
                        <span>
                          {item.nomeProduto} {item.quantidade} × R$ {item.precoUnitario.toFixed(2)}
                        </span>
                        <span>R$ {item.subtotal.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
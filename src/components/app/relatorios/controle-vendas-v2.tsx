
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Filter, Search, User, Store, CreditCard, DollarSign, QrCode, Receipt } from "lucide-react";

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


interface Filtros {
  periodo: "hoje" | "semana" | "mes" | "todos";
  formaPagamento: string;
  tipoCliente: string;
  cafeteria: string;
}

export function ControleVendasV2() {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtros, setFiltros] = useState<Filtros>({
    periodo: "todos",
    formaPagamento: "todos",
    tipoCliente: "todos",
    cafeteria: "todos"
  });

  // Buscar vendas quando os filtros mudarem
  useEffect(() => {
    buscarVendas();
  }, [filtros]);

  async function buscarVendas() {
    try {
      console.log('=== FASE 3: BUSCANDO COM FILTROS ===', filtros);
      setCarregando(true);
      
      const params = new URLSearchParams();
      Object.entries(filtros).forEach(([key, value]) => {
        if (value && value !== 'todos') {
          params.append(key, value);
        }
      });

      const response = await fetch(`/api/relatorios/vendas-v2?${params}`);
      const data = await response.json();
      
      console.log('=== DADOS FILTRADOS ===', {
        totalVendas: data.length,
        filtrosAplicados: filtros
      });
      
      setVendas(data);
    } catch (error) {
      console.error('Erro ao buscar vendas:', error);
    } finally {
      setCarregando(false);
    }
  }

  const handleFiltroChange = (key: keyof Filtros, value: string) => {
    setFiltros(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const limparFiltros = () => {
    setFiltros({
      periodo: "todos",
      formaPagamento: "todos", 
      tipoCliente: "todos",
      cafeteria: "todos"
    });
  };

  const formatarData = (dataString: string) => {
    return new Date(dataString).toLocaleString('pt-BR');
  };

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
  
  const getPaymentIcon = (type: string) => {
    switch (type) {
      case 'dinheiro': return <DollarSign className="h-4 w-4" />;
      case 'cartao_credito': 
      case 'cartao_debito': return <CreditCard className="h-4 w-4" />;
      case 'pix': return <QrCode className="h-4 w-4" />;
      case 'apagar': return <Receipt className="h-4 w-4" />;
      default: return <DollarSign className="h-4 w-4" />;
    }
  };

  // Calcular totais para resumo
  const calcularTotalVendas = () => {
    return vendas.reduce((total, venda) => total + venda.total, 0);
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Controle de Vendas V2</h1>
          <p className="text-muted-foreground">
            Nova versão - Com filtros básicos
          </p>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros Básicos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Período */}
            <div className="space-y-2">
              <Label>Período</Label>
              <Select 
                value={filtros.periodo} 
                onValueChange={(value: Filtros['periodo']) => handleFiltroChange('periodo', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os períodos</SelectItem>
                  <SelectItem value="hoje">Hoje</SelectItem>
                  <SelectItem value="semana">Esta Semana</SelectItem>
                  <SelectItem value="mes">Este Mês</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Forma de Pagamento */}
            <div className="space-y-2">
              <Label>Forma de Pagamento</Label>
              <Select 
                value={filtros.formaPagamento} 
                onValueChange={(value) => handleFiltroChange('formaPagamento', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as formas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas as formas</SelectItem>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="cartao_credito">Cartão Crédito</SelectItem>
                  <SelectItem value="cartao_debito">Cartão Débito</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="apagar">À Pagar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tipo de Cliente */}
            <div className="space-y-2">
              <Label>Tipo de Cliente</Label>
              <Select 
                value={filtros.tipoCliente} 
                onValueChange={(value) => handleFiltroChange('tipoCliente', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os tipos</SelectItem>
                  <SelectItem value="normal">Cliente Normal</SelectItem>
                  <SelectItem value="colaborador">Colaborador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Cafeteria */}
            <div className="space-y-2">
              <Label>Cafeteria</Label>
              <Select 
                value={filtros.cafeteria} 
                onValueChange={(value) => handleFiltroChange('cafeteria', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as cafeterias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas as cafeterias</SelectItem>
                  <SelectItem value="cafeteria_01">Cafeteria 01</SelectItem>
                  <SelectItem value="cafeteria_02">Cafeteria 02</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={limparFiltros}>
              Limpar Filtros
            </Button>
            <Button onClick={buscarVendas} disabled={carregando}>
              <Search className="h-4 w-4 mr-2" />
              {carregando ? "Buscando..." : "Aplicar Filtros"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resumo Simples */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vendas.length}</div>
            <p className="text-xs text-muted-foreground">
              Vendas filtradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {calcularTotalVendas().toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Faturamento total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Vendas (MELHORADA) */}
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
              Nenhuma venda encontrada com os filtros selecionados
            </div>
          ) : (
            <div className="space-y-4">
              {vendas.map((venda) => (
                <Card key={venda._id} className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">#{venda.numeroVenda}</span>
                        <Badge variant="outline" className="flex items-center gap-1">
                          {getPaymentIcon(venda.formaPagamento)}
                          {getPaymentLabel(venda.formaPagamento)}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatarData(venda.dataVenda)} • {venda.cafeteria}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        <strong>Vendedor:</strong> {venda.usuario?.nome || 'N/A'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">R$ {venda.total.toFixed(2)}</div>
                    </div>
                  </div>

                  {venda.tipoCliente === 'colaborador' && (
                    <div className="bg-muted p-3 rounded-md mb-3">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4" />
                        <span className="font-medium">Colaborador:</span>
                        <span>{venda.colaborador?.nome || 'N/A'}</span>
                        {venda.colaborador?.email && (
                          <span className="text-muted-foreground">({venda.colaborador.email})</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Itens da Venda */}
                  <div className="space-y-2">
                    {venda.itens.map((item, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <div>
                          <span className="font-medium">{item.nomeProduto}</span>
                          <span className="text-muted-foreground ml-2">
                            {item.quantidade} × R$ {item.precoUnitario.toFixed(2)}
                          </span>
                        </div>
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

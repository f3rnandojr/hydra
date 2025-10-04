"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Filter, 
  Download, 
  ShoppingCart,
  CreditCard, 
  DollarSign, 
  QrCode, 
  User, 
  Store,
  Receipt
} from "lucide-react";
import type { Venda as VendaType } from "@/lib/definitions";


interface Venda extends VendaType {
    usuario?: {
        _id: string;
        nome: string;
    };
    colaborador?: {
        _id: string;
        nome: string;
        email: string;
    };
}


interface Filtros {
  periodo: "hoje" | "semana" | "mes" | "ano" | "personalizado";
  dataInicio?: string;
  dataFim?: string;
  formaPagamento: string;
  tipoCliente: string;
  cafeteria: string;
  colaboradorId?: string;
}

export function ControleVendas() {
  const { toast } = useToast();
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [filtros, setFiltros] = useState<Filtros>({
    periodo: "hoje",
    formaPagamento: "",
    tipoCliente: "",
    cafeteria: ""
  });

  const fetchVendasRef = useRef(buscarVendas);
  fetchVendasRef.current = buscarVendas;

  // Buscar vendas quando os filtros mudarem
  useEffect(() => {
    fetchVendasRef.current();
  }, [filtros]);

  async function buscarVendas() {
    setCarregando(true);
    try {
      const params = new URLSearchParams();
      
      // Adicionar filtros aos parâmetros
      Object.entries(filtros).forEach(([key, value]) => {
        if (value) {
          params.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/relatorios/vendas?${params}`);
      if (response.ok) {
        const data = await response.json();
        setVendas(data);
      } else {
        throw new Error('Erro ao buscar vendas');
      }
    } catch (error) {
      console.error('Erro:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as vendas.",
        variant: "destructive",
      });
    } finally {
      setCarregando(false);
    }
  };

  const handleFiltroChange = (key: keyof Omit<Filtros, 'dataInicio' | 'dataFim'>, value: string) => {
    setFiltros(prev => ({
      ...prev,
      [key]: value === 'todos' ? '' : value
    }));
  };

  const limparFiltros = () => {
    setFiltros({
      periodo: "hoje",
      formaPagamento: "",
      tipoCliente: "",
      cafeteria: "",
      dataInicio: "",
      dataFim: "",
    });
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

  const getPaymentLabel = (type: string) => {
    switch (type) {
      case 'dinheiro': return "Dinheiro";
      case 'cartao_credito': return "Cartão Crédito";
      case 'cartao_debito': return "Cartão Débito";
      case 'pix': return "PIX";
      case 'apagar': return "À Pagar";
      default: return type;
    }
  };

  const calcularTotalVendas = () => {
    return vendas.reduce((total, venda) => total + venda.total, 0);
  };

  const calcularQuantidadeVendas = () => {
    return vendas.length;
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Controle de Vendas</h1>
          <p className="text-muted-foreground">
            Relatório completo de todas as vendas realizadas
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Exportar
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
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
                  <SelectItem value="hoje">Hoje</SelectItem>
                  <SelectItem value="semana">Esta Semana</SelectItem>
                  <SelectItem value="mes">Este Mês</SelectItem>
                  <SelectItem value="ano">Este Ano</SelectItem>
                  <SelectItem value="personalizado">Personalizado</SelectItem>
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

          {/* Período Personalizado */}
          {filtros.periodo === 'personalizado' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <Label>Data Início</Label>
                <Input 
                  type="date" 
                  value={filtros.dataInicio || ''}
                  onChange={(e) => setFiltros(prev => ({ ...prev, dataInicio: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Data Fim</Label>
                <Input 
                  type="date" 
                  value={filtros.dataFim || ''}
                  onChange={(e) => setFiltros(prev => ({ ...prev, dataFim: e.target.value }))}
                />
              </div>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={limparFiltros}>
              Limpar Filtros
            </Button>
            <Button onClick={buscarVendas} disabled={carregando}>
              <Search className="h-4 w-4 mr-2" />
              {carregando ? "Buscando..." : "Buscar"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calcularQuantidadeVendas()}</div>
            <p className="text-xs text-muted-foreground">
              Vendas no período selecionado
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {vendas.length > 0 ? (calcularTotalVendas() / vendas.length).toFixed(2) : "0.00"}
            </div>
            <p className="text-xs text-muted-foreground">
              Valor médio por venda
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Vendas */}
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
                        {new Date(venda.dataVenda).toLocaleString('pt-BR')} • {venda.cafeteria}
                      </div>
                       <div className="text-sm text-muted-foreground mt-1">
                        Vendedor: {venda.usuario?.nome || 'N/A'}
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
                        <span>{venda.colaborador?.nome}</span>
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

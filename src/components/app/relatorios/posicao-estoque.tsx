"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Search, Filter, Download, Printer, Package, Store, AlertTriangle } from "lucide-react";
import { Product } from "@/lib/definitions";

interface PosicaoEstoqueItem {
  _id: string;
  produtoId: string;
  produto: {
    _id: string;
    nome: string;
    codigoEAN?: string;
    precoVenda: number;
  };
  cafeteria: string;
  saldo: number;
  estoqueMinimo: number;
  dataAtualizacao: string;
}

interface Filtros {
  cafeteria: string;
  produtoId?: string;
  dataInicio?: string;
  dataFim?: string;
  mostrarAbaixoMinimo: boolean;
}

export function PosicaoEstoque() {
  const { toast } = useToast();
  const [estoque, setEstoque] = useState<PosicaoEstoqueItem[]>([]);
  const [produtos, setProdutos] = useState<Product[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [filtros, setFiltros] = useState<Filtros>({
    cafeteria: "todos",
    mostrarAbaixoMinimo: false
  });

  // Buscar produtos para o filtro
  useEffect(() => {
    buscarProdutos();
  }, []);

  // Buscar estoque quando os filtros mudarem
  useEffect(() => {
    buscarEstoque();
  }, [filtros]);

  const buscarProdutos = async () => {
    try {
      const response = await fetch('/api/produtos');
      if (response.ok) {
        const data = await response.json();
        setProdutos(data);
      }
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    }
  };

  const buscarEstoque = async () => {
    setCarregando(true);
    try {
      const params = new URLSearchParams();
      
      if (filtros.cafeteria !== "todos") {
        params.append("cafeteria", filtros.cafeteria);
      }
      if (filtros.produtoId) {
        params.append("produtoId", filtros.produtoId);
      }
      if (filtros.dataInicio) {
        params.append("dataInicio", filtros.dataInicio);
      }
      if (filtros.dataFim) {
        params.append("dataFim", filtros.dataFim);
      }

      const response = await fetch(`/api/relatorios/estoque?${params}`);
      if (response.ok) {
        const data = await response.json();
        setEstoque(data);
      } else {
        throw new Error('Erro ao buscar estoque');
      }
    } catch (error) {
      console.error('Erro:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a posição de estoque.",
        variant: "destructive",
      });
    } finally {
      setCarregando(false);
    }
  };

  const handleFiltroChange = (key: keyof Filtros, value: any) => {
    setFiltros(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const limparFiltros = () => {
    setFiltros({
      cafeteria: "todos",
      mostrarAbaixoMinimo: false
    });
  };

  const imprimirRelatorio = () => {
    window.print();
  };

  // Aplicar filtro de estoque mínimo
  const estoqueFiltrado = filtros.mostrarAbaixoMinimo 
    ? estoque.filter(item => item.saldo < item.estoqueMinimo)
    : estoque;

  const exportarCSV = () => {
    // Implementação básica de exportação CSV
    const csvHeaders = ["Produto", "Cafeteria", "Saldo Atual", "Estoque Mínimo", "Status"];
    const csvData = estoqueFiltrado.map(item => [
      `"${item.produto.nome}"`,
      item.cafeteria,
      item.saldo.toString(),
      item.estoqueMinimo.toString(),
      item.saldo < item.estoqueMinimo ? "ABAIXO DO MÍNIMO" : "NORMAL"
    ]);

    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `posicao-estoque-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const calcularTotalItens = () => {
    return estoqueFiltrado.reduce((total, item) => total + item.saldo, 0);
  };

  const calcularProdutosAbaixoMinimo = () => {
    return estoque.filter(item => item.saldo < item.estoqueMinimo).length;
  };

  return (
    <div className="space-y-6 print:space-y-2">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between print:flex-col print:items-start print:space-y-2">
        <div>
          <h1 className="text-3xl font-bold print:text-2xl">Posição de Estoque</h1>
          <p className="text-muted-foreground print:text-sm">
            Relatório completo do estoque atual
          </p>
        </div>
        <div className="flex gap-2 print:hidden">
          <Button variant="outline" onClick={exportarCSV} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
          <Button onClick={imprimirRelatorio} className="flex items-center gap-2">
            <Printer className="h-4 w-4" />
            Imprimir
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card className="print:hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Cafeteria */}
            <div className="space-y-2">
              <Label>Cafeteria</Label>
              <Select 
                value={filtros.cafeteria} 
                onValueChange={(value) => handleFiltroChange('cafeteria', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas as Cafeterias</SelectItem>
                  <SelectItem value="cafeteria_01">Cafeteria 01</SelectItem>
                  <SelectItem value="cafeteria_02">Cafeteria 02</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Produto */}
            <div className="space-y-2">
              <Label>Produto</Label>
              <Select 
                value={filtros.produtoId || "todos"} 
                onValueChange={(value) => handleFiltroChange('produtoId', value === "todos" ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os produtos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os produtos</SelectItem>
                  {produtos.map((produto) => (
                    <SelectItem key={produto._id} value={produto._id}>
                      {produto.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Data Início */}
            <div className="space-y-2">
              <Label>Data Início</Label>
              <Input 
                type="date" 
                value={filtros.dataInicio || ''}
                onChange={(e) => handleFiltroChange('dataInicio', e.target.value)}
              />
            </div>

            {/* Data Fim */}
            <div className="space-y-2">
              <Label>Data Fim</Label>
              <Input 
                type="date" 
                value={filtros.dataFim || ''}
                onChange={(e) => handleFiltroChange('dataFim', e.target.value)}
              />
            </div>
          </div>

          {/* Filtro de Estoque Mínimo */}
          <div className="flex items-center space-x-2 mt-4">
            <input
              type="checkbox"
              id="mostrarAbaixoMinimo"
              checked={filtros.mostrarAbaixoMinimo}
              onChange={(e) => handleFiltroChange('mostrarAbaixoMinimo', e.target.checked)}
              className="rounded border-gray-300"
            />
            <Label htmlFor="mostrarAbaixoMinimo" className="text-sm font-normal">
              Mostrar apenas produtos abaixo do estoque mínimo
            </Label>
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={limparFiltros}>
              Limpar Filtros
            </Button>
            <Button onClick={buscarEstoque} disabled={carregando}>
              <Search className="h-4 w-4 mr-2" />
              {carregando ? "Buscando..." : "Buscar"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:grid-cols-3 print:gap-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Itens</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calcularTotalItens()}</div>
            <p className="text-xs text-muted-foreground">
              Itens em estoque
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produtos Cadastrados</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estoqueFiltrado.length}</div>
            <p className="text-xs text-muted-foreground">
              Produtos no relatório
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abaixo do Mínimo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {calcularProdutosAbaixoMinimo()}
            </div>
            <p className="text-xs text-muted-foreground">
              Necessitam reposição
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Estoque */}
      <Card>
        <CardHeader>
          <CardTitle>Posição de Estoque</CardTitle>
          <CardDescription>
            {estoqueFiltrado.length} produtos encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {carregando ? (
            <div className="text-center py-8">Carregando estoque...</div>
          ) : estoqueFiltrado.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum produto encontrado com os filtros selecionados
            </div>
          ) : (
            <div className="rounded-md border print:border-none">
              <table className="w-full text-sm print:text-xs">
                <thead className="print:bg-transparent">
                  <tr className="border-b bg-muted/50 print:bg-transparent">
                    <th className="p-2 text-left font-medium">Produto</th>
                    <th className="p-2 text-left font-medium">Cafeteria</th>
                    <th className="p-2 text-right font-medium">Saldo Atual</th>
                    <th className="p-2 text-right font-medium">Estoque Mínimo</th>
                    <th className="p-2 text-center font-medium">Status</th>
                    <th className="p-2 text-right font-medium">Última Atualização</th>
                  </tr>
                </thead>
                <tbody>
                  {estoqueFiltrado.map((item) => (
                    <tr key={item._id} className="border-b print:border-b">
                      <td className="p-2">{item.produto.nome}</td>
                      <td className="p-2">{item.cafeteria}</td>
                      <td className="p-2 text-right font-medium">{item.saldo}</td>
                      <td className="p-2 text-right">{item.estoqueMinimo}</td>
                      <td className="p-2 text-center">
                        <Badge 
                          variant={item.saldo < item.estoqueMinimo ? "destructive" : "outline"}
                          className="print:text-xs"
                        >
                          {item.saldo < item.estoqueMinimo ? "ABAIXO DO MÍNIMO" : "NORMAL"}
                        </Badge>
                      </td>
                      <td className="p-2 text-right text-muted-foreground print:text-xs">
                        {new Date(item.dataAtualizacao).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

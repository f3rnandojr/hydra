
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Filter, Search, User, Store, CreditCard, DollarSign, QrCode, Receipt, Printer } from "lucide-react";


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
  ordenacao: "horario" | "produto" | "pagamento";
}

interface OpcoesRelatorio {
  mostrarQuantidadeItens: boolean;
  mostrarResumoPagamentos: boolean;
}

export function ControleVendasV2() {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtros, setFiltros] = useState<Filtros>({
    periodo: "todos",
    formaPagamento: "todos",
    tipoCliente: "todos",
    cafeteria: "todos",
    ordenacao: "horario" 
  });
  const [opcoesRelatorio, setOpcoesRelatorio] = useState<OpcoesRelatorio>({
    mostrarQuantidadeItens: true,
    mostrarResumoPagamentos: true
  });


  const handlePrint = () => {
    // Mapeamento de formas de pagamento (deve vir antes do cálculo)
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
    
    // Calcular totais
    const totalGeral = vendas.reduce((total, venda) => total + venda.total, 0);
    const totalItens = vendas.flatMap(v => v.itens).reduce((sum, item) => sum + item.quantidade, 0);
  
    // Calcular resumo por forma de pagamento (SE a opção estiver ativa)
    const resumoPagamentos = opcoesRelatorio.mostrarResumoPagamentos 
      ? vendas.reduce((acc, venda) => {
          const forma = venda.formaPagamento;
          if (!acc[forma]) {
            acc[forma] = {
              quantidade: 0,
              total: 0,
              label: getPaymentLabel(forma)
            };
          }
          acc[forma].quantidade += 1;
          acc[forma].total += venda.total;
          return acc;
        }, {} as { [key: string]: { quantidade: number; total: number; label: string } })
      : {};
  
    // Calcular quantidade por produto (SE a opção estiver ativa)
    const quantidadePorProduto = opcoesRelatorio.mostrarQuantidadeItens 
      ? vendas.flatMap(v => v.itens).reduce((acc, item) => {
          if (!acc[item.nomeProduto]) {
            acc[item.nomeProduto] = 0;
          }
          acc[item.nomeProduto] += item.quantidade;
          return acc;
        }, {} as { [key: string]: number })
      : {};
  
    // Texto dos filtros aplicados
    const getFiltroTexto = (filtro: string, valor: string) => {
      if (valor === 'todos') return 'Todos';
      const map: { [key: string]: string } = {
        'hoje': 'Hoje',
        'semana': 'Esta Semana', 
        'mes': 'Este Mês',
        'dinheiro': 'Dinheiro',
        'cartao_credito': 'Cartão Crédito',
        'cartao_debito': 'Cartão Débito',
        'pix': 'PIX',
        'apagar': 'À Pagar',
        'normal': 'Cliente Normal',
        'colaborador': 'Colaborador',
        'cafeteria_01': 'Cafeteria 01',
        'cafeteria_02': 'Cafeteria 02',
        'horario': 'Horário',
        'produto': 'Produto', 
        'pagamento': 'Forma de Pagamento'
      };
      return map[valor] || valor;
    };
  
    // Preparar dados para o relatório
    const itensRelatorio = vendas.flatMap(venda => 
      venda.itens.map(item => ({
        horario: new Date(venda.dataVenda).toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        dataCompleta: venda.dataVenda,
        produto: item.nomeProduto,
        quantidade: item.quantidade,
        valorUnitario: item.precoUnitario,
        totalItem: item.subtotal,
        formaPagamento: getPaymentLabel(venda.formaPagamento),
        formaPagamentoOriginal: venda.formaPagamento
      }))
    );
  
    // Aplicar ordenação baseada no filtro
    switch (filtros.ordenacao) {
      case 'produto':
        itensRelatorio.sort((a, b) => a.produto.localeCompare(b.produto));
        break;
      case 'pagamento':
        itensRelatorio.sort((a, b) => a.formaPagamento.localeCompare(b.formaPagamento));
        break;
      case 'horario':
      default:
        itensRelatorio.sort((a, b) => a.horario.localeCompare(b.horario));
        break;
    }
  
    // Texto do resumo geral (adaptável conforme opções)
    const textoResumoGeral = [
      `${vendas.length} VENDAS`,
      opcoesRelatorio.mostrarQuantidadeItens && `${totalItens} ITENS`,
      `TOTAL: R$ ${totalGeral.toFixed(2)}`
    ].filter(Boolean).join(' • ');
  
    const conteudoImpressao = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Relatório de Vendas</title>
        <style>
          body { 
            font-family: 'Courier New', monospace; 
            margin: 15px;
            font-size: 11px;
            line-height: 1.2;
          }
          .header { 
            text-align: center; 
            margin-bottom: 15px;
            border-bottom: 1px solid #000;
            padding-bottom: 10px;
          }
          .filtros {
            margin-bottom: 15px;
            padding: 10px;
            border: 1px solid #ccc;
            background: #f9f9f9;
          }
          .filtros table {
            width: 100%;
            border-collapse: collapse;
          }
          .filtros td {
            padding: 3px 6px;
            border: 1px solid #ddd;
            font-size: 10px;
          }
          .resumo-geral {
            margin: 8px 0;
            text-align: center;
            font-weight: bold;
            font-size: 10px;
            padding: 8px;
            background: #f0f0f0;
            border-radius: 4px;
          }
          .resumo-produtos, .resumo-pagamentos {
            margin: 10px 0;
            padding: 8px;
            border: 1px solid #ccc;
            background: #f8f8f8;
            font-size: 10px;
          }
          .resumo-produtos table, .resumo-pagamentos table {
            width: 100%;
            border-collapse: collapse;
          }
          .resumo-produtos td, .resumo-pagamentos td {
            padding: 2px 5px;
            border-bottom: 1px dotted #ddd;
          }
          .resumo-pagamentos .total-linha {
            font-weight: bold;
            border-top: 1px solid #000;
            border-bottom: none;
          }
          .cabecalho-linhas {
            font-weight: bold;
            border-bottom: 1px solid #000;
            padding-bottom: 3px;
            margin-bottom: 5px;
            display: flex;
            justify-content: space-between;
          }
          .linha {
            display: flex;
            justify-content: space-between;
            margin: 2px 0;
            padding: 1px 0;
            border-bottom: 1px dotted #eee;
          }
          .total-geral {
            margin-top: 10px;
            border-top: 2px solid #000;
            padding-top: 5px;
            font-weight: bold;
            text-align: center;
          }
          .pagamento {
            font-size: 9px;
            color: #666;
            margin-left: 5px;
          }
          @media print {
            body { margin: 8px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>RELATÓRIO DE VENDAS</h1>
          <p>${new Date().toLocaleDateString('pt-BR', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric' 
          })} • Ordenado por: ${getFiltroTexto('ordenacao', filtros.ordenacao)}</p>
        </div>
  
        <!-- Filtros Aplicados -->
        <div class="filtros">
          <strong>FILTROS APLICADOS:</strong>
          <table>
            <tr>
              <td><strong>Período:</strong> ${getFiltroTexto('periodo', filtros.periodo)}</td>
              <td><strong>Forma Pagamento:</strong> ${getFiltroTexto('formaPagamento', filtros.formaPagamento)}</td>
            </tr>
            <tr>
              <td><strong>Tipo Cliente:</strong> ${getFiltroTexto('tipoCliente', filtros.tipoCliente)}</td>
              <td><strong>Cafeteria:</strong> ${getFiltroTexto('cafeteria', filtros.cafeteria)}</td>
            </tr>
          </table>
        </div>
  
        <!-- Resumo Geral -->
        <div class="resumo-geral">
          ${textoResumoGeral}
        </div>
  
        <!-- Resumo por Produto (SE ATIVADO) -->
        ${opcoesRelatorio.mostrarQuantidadeItens && Object.keys(quantidadePorProduto).length > 0 ? `
          <div class="resumo-produtos">
            <strong>QUANTIDADE POR PRODUTO:</strong>
            <table>
              ${Object.entries(quantidadePorProduto).map(([produto, quantidade]) => `
                <tr>
                  <td>${produto}:</td>
                  <td>${quantidade} unidades</td>
                </tr>
              `).join('')}
            </table>
          </div>
        ` : ''}
  
        <!-- Resumo por Forma de Pagamento (SE ATIVADO) -->
        ${opcoesRelatorio.mostrarResumoPagamentos && Object.keys(resumoPagamentos).length > 0 ? `
          <div class="resumo-pagamentos">
            <strong>RESUMO POR FORMA DE PAGAMENTO:</strong>
            <table>
              ${Object.entries(resumoPagamentos).map(([forma, dados]) => `
                <tr>
                  <td>${dados.label}:</td>
                  <td>${dados.quantidade} vendas</td>
                  <td>R$ ${dados.total.toFixed(2)}</td>
                </tr>
              `).join('')}
              <tr class="total-linha">
                <td><strong>TOTAL:</strong></td>
                <td><strong>${vendas.length} vendas</strong></td>
                <td><strong>R$ ${totalGeral.toFixed(2)}</strong></td>
              </tr>
            </table>
          </div>
        ` : ''}
  
        <!-- Cabeçalho Fixo das Colunas -->
        <div class="cabecalho-linhas">
          <span>HH:MM | PRODUTO | PAGAMENTO</span>
          <span>QTD x VALOR | TOTAL</span>
        </div>
  
        <!-- Itens -->
        ${itensRelatorio.map(item => `
          <div class="linha">
            <span>
              ${item.horario} | ${item.produto} 
              <span class="pagamento">${item.formaPagamento}</span>
            </span>
            <span>${item.quantidade} x R$ ${item.valorUnitario.toFixed(2)} | R$ ${item.totalItem.toFixed(2)}</span>
          </div>
        `).join('')}
  
        <div class="total-geral">
          TOTAL GERAL: R$ ${totalGeral.toFixed(2)}
        </div>
      </body>
      </html>
    `;
  
    // ✅ CORREÇÃO: Abrir janela e aguardar antes de imprimir
    const janela = window.open('', '_blank', 'width=800,height=600');
    if (janela) {
      janela.document.write(conteudoImpressao);
      janela.document.close();
      
      // ✅ AGUARDAR o carregamento completo antes de imprimir
      janela.onload = () => {
        setTimeout(() => {
          janela.print();
          // ✅ NÃO FECHAR automaticamente - deixar usuário controlar
        }, 500);
      };
      
      // ✅ Fallback caso onload não funcione
      setTimeout(() => {
        if (!janela.closed) {
          janela.print();
        }
      }, 1000);
    }
  };

  // Buscar vendas quando os filtros mudarem
  useEffect(() => {
    buscarVendas();
  }, [filtros]);

  async function buscarVendas() {
    try {
      setCarregando(true);
      
      const params = new URLSearchParams();
      Object.entries(filtros).forEach(([key, value]) => {
        if (value && value !== 'todos') {
          params.append(key, value);
        }
      });

      const response = await fetch(`/api/relatorios/vendas-v2?${params}`);
      const data = await response.json();
      
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
      cafeteria: "todos",
      ordenacao: "horario"
    });
  };

  const formatarData = (dataString: string) => {
    const data = new Date(dataString);
    // Força formato consistente entre servidor e cliente
    return data.toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
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
        <Button onClick={handlePrint} variant="outline" disabled={carregando || vendas.length === 0}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir Relatório
        </Button>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
            
            {/* Ordenação */}
            <div className="space-y-2">
              <Label>Ordenar por</Label>
              <Select 
                value={filtros.ordenacao} 
                onValueChange={(value: Filtros['ordenacao']) => handleFiltroChange('ordenacao', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="horario">Horário</SelectItem>
                  <SelectItem value="produto">Produto</SelectItem>
                  <SelectItem value="pagamento">Forma de Pagamento</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-4 border rounded-lg bg-muted/50">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Opções do Relatório</Label>
              
              {/* Checkbox para Quantidade de Itens */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="mostrarQuantidadeItens"
                  checked={opcoesRelatorio.mostrarQuantidadeItens}
                  onChange={(e) => setOpcoesRelatorio(prev => ({
                    ...prev,
                    mostrarQuantidadeItens: e.target.checked
                  }))}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="mostrarQuantidadeItens" className="text-sm">
                  Mostrar quantidade total de itens
                </Label>
              </div>

              {/* Checkbox para Resumo de Pagamentos */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="mostrarResumoPagamentos"
                  checked={opcoesRelatorio.mostrarResumoPagamentos}
                  onChange={(e) => setOpcoesRelatorio(prev => ({
                    ...prev,
                    mostrarResumoPagamentos: e.target.checked
                  }))}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="mostrarResumoPagamentos" className="text-sm">
                  Mostrar resumo por forma de pagamento
                </Label>
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              <p>💡 <strong>Para o setor financeiro:</strong> marque "Resumo por forma de pagamento"</p>
              <p>💡 <strong>Para a cafeteria:</strong> marque "Quantidade total de itens"</p>
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

    
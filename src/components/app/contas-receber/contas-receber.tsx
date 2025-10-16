"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Search, Filter, DollarSign, User, Calendar, CheckCircle, Clock, Printer } from "lucide-react";
import { useAuth } from '@/contexts/auth-context';
import type { ContaReceber as ContaReceberType, Collaborator, Usuario } from "@/lib/definitions";


interface ContaReceber extends ContaReceberType {
  colaborador: {
    _id: string;
    nome: string;
    email: string;
  };
  venda: {
    _id: string;
    numeroVenda: string;
    dataVenda: string;
    cafeteria: string;
    itens: Array<{
      nomeProduto: string;
      quantidade: number;
      precoUnitario: number;
    }>;
  };
  usuarioQuitacao?: {
    _id: string;
    nome: string;
    email: string;
  }
}

interface Filtros {
  status: string;
  colaboradorId: string;
}

export function ContasReceber() {
  const { toast } = useToast();
  const { usuario } = useAuth();
  const [todasAsContas, setTodasAsContas] = useState<ContaReceber[]>([]);
  const [colaboradores, setColaboradores] = useState<Collaborator[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [filtros, setFiltros] = useState<Filtros>({
    status: "em_debito",
    colaboradorId: "todos"
  });

  useEffect(() => {
    buscarColaboradores();
    buscarContas();
  }, []);

  const contasFiltradas = useMemo(() => {
    return todasAsContas.filter(conta => {
        const filtroStatusOk = filtros.status === 'todos' || conta.status === filtros.status;
        const filtroColaboradorOk = filtros.colaboradorId === 'todos' || conta.colaboradorId === filtros.colaboradorId;
        return filtroStatusOk && filtroColaboradorOk;
    });
  }, [todasAsContas, filtros]);


  const buscarColaboradores = async () => {
    try {
      const response = await fetch('/api/colaboradores?status=ativo');
      if (response.ok) {
        const data = await response.json();
        setColaboradores(data);
      }
    } catch (error) {
      console.error('Erro ao buscar colaboradores:', error);
    }
  };

  const buscarContas = async () => {
    setCarregando(true);
    try {
      const response = await fetch(`/api/contas-receber`);
      if (response.ok) {
        const data = await response.json();
        setTodasAsContas(data);
      } else {
        throw new Error('Erro ao buscar contas');
      }
    } catch (error) {
      console.error('Erro:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as contas a receber.",
        variant: "destructive",
      });
    } finally {
      setCarregando(false);
    }
  };

  const handleFiltroChange = (key: keyof Filtros, value: string) => {
    setFiltros(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const limparFiltros = () => {
    setFiltros({
      status: "todos",
      colaboradorId: "todos"
    });
    buscarContas();
  };

  const calcularTotalEmDebito = () => {
    return todasAsContas
      .filter(conta => conta.status === "em_debito")
      .reduce((total, conta) => total + conta.valor, 0);
  };

  const calcularTotalQuitado = () => {
    return todasAsContas
      .filter(conta => conta.status === "quitado")
      .reduce((total, conta) => total + conta.valor, 0);
  };

  const quitarConta = async (contaId: string) => {
    try {
      const response = await fetch('/api/contas-receber', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${usuario?._id}`,
        },
        body: JSON.stringify({
          contaId,
          status: "quitado",
          formaQuitacao: "dinheiro"
        }),
      });
  
      if (response.ok) {
        setTodasAsContas(prevContas => 
          prevContas.map(conta => 
            conta._id === contaId 
              ? { 
                  ...conta, 
                  status: "quitado",
                  dataQuitacao: new Date().toISOString(),
                  usuarioQuitacao: usuario ? {
                    _id: usuario._id,
                    nome: usuario.nome,
                    email: usuario.email
                  } : undefined
                }
              : conta
          )
        );
        
        toast({
          title: "Sucesso!",
          description: "Conta quitada com sucesso.",
        });
        
      } else {
        throw new Error('Erro ao quitar conta');
      }
    } catch (error) {
      console.error('Erro:', error);
      toast({
        title: "Erro",
        description: "Não foi possível quitar a conta.",
        variant: "destructive",
      });
    }
  };

  const handlePrintContasReceber = () => {
    // Calcular totais
    const totalEmDebito = calcularTotalEmDebito();
    const totalQuitado = calcularTotalQuitado();
    const totalContas = contasFiltradas.length;
    const contasEmDebito = contasFiltradas.filter(conta => conta.status === "em_debito").length;
    const contasQuitadas = contasFiltradas.filter(conta => conta.status === "quitado").length;
  
    // Mapeamento de formas de quitação
    const getFormaQuitacaoLabel = (forma?: string) => {
      if (!forma) return '-';
      const formas: { [key: string]: string } = {
        'dinheiro': 'Dinheiro',
        'cartao_credito': 'Cartão Crédito',
        'cartao_debito': 'Cartão Débito', 
        'pix': 'PIX',
        'transferencia': 'Transferência'
      };
      return formas[forma] || forma;
    };
  
    const conteudoImpressao = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Relatório de Contas a Receber</title>
        <style>
          body { 
            font-family: 'Courier New', monospace; 
            margin: 15px;
            font-size: 10px;
            line-height: 1.1;
          }
          .header { 
            text-align: center; 
            margin-bottom: 10px;
            border-bottom: 1px solid #000;
            padding-bottom: 5px;
          }
          .filtros {
            margin-bottom: 10px;
            padding: 8px;
            border: 1px solid #ccc;
            background: #f9f9f9;
          }
          .resumo-geral {
            margin: 8px 0;
            padding: 6px;
            background: #f0f0f0;
            text-align: center;
            font-weight: bold;
          }
          .cabecalho-linhas {
            font-weight: bold;
            border-bottom: 1px solid #000;
            padding-bottom: 3px;
            margin-bottom: 5px;
            display: flex;
            justify-content: space-between;
          }
          .linha-conta {
            display: flex;
            justify-content: space-between;
            margin: 2px 0;
            padding: 2px 0;
            border-bottom: 1px dotted #ddd;
            align-items: center;
          }
          .status-debito {
            color: #d97706;
            font-weight: bold;
          }
          .status-quitado {
            color: #059669;
            font-weight: bold;
          }
          .total-geral {
            margin-top: 10px;
            border-top: 2px solid #000;
            padding-top: 5px;
            font-weight: bold;
            display: flex;
            justify-content: space-between;
          }
          @media print {
            body { margin: 8px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>RELATÓRIO DE CONTAS A RECEBER</h1>
          <p>${new Date().toLocaleDateString('pt-BR')}</p>
        </div>
  
        <!-- Filtros Aplicados -->
        <div class="filtros">
          <strong>FILTROS:</strong> 
          Status: ${filtros.status === 'todos' ? 'Todos' : (filtros.status === 'em_debito' ? 'Em Débito' : 'Quitados')} | 
          Colaborador: ${filtros.colaboradorId === 'todos' ? 'Todos' : 'Filtrado'}
        </div>
  
        <!-- Resumo Geral -->
        <div class="resumo-geral">
          ${totalContas} CONTAS | ${contasEmDebito} EM DÉBITO | ${contasQuitadas} QUITADAS | 
          A RECEBER: R$ ${totalEmDebito.toFixed(2)} | RECEBIDO: R$ ${totalQuitado.toFixed(2)}
        </div>
  
        <!-- Cabeçalho das Colunas -->
        <div class="cabecalho-linhas">
          <span>VENDA | COLABORADOR | DATA | STATUS | VALOR | QUITAÇÃO</span>
        </div>
  
        <!-- Lista de Contas - UMA LINHA POR CONTA -->
        ${contasFiltradas.map(conta => {
          const dataVenda = new Date(conta.dataVenda).toLocaleDateString('pt-BR');
          const dataQuitacao = conta.dataQuitacao 
            ? new Date(conta.dataQuitacao).toLocaleDateString('pt-BR') 
            : '-';
          const formaQuitacao = getFormaQuitacaoLabel(conta.formaQuitacao);
          const status = conta.status === 'quitado' ? 'QUITADO' : 'EM DÉBITO';
          
          return `
            <div class="linha-conta">
              <span>
                #${conta.venda?.numeroVenda || 'N/A'} | 
                ${conta.colaborador?.nome || 'N/A'} | 
                ${dataVenda} | 
                <span class="${conta.status === 'em_debito' ? 'status-debito' : 'status-quitado'}">
                  ${status}
                </span> | 
                R$ ${conta.valor.toFixed(2)} | 
                ${conta.status === 'quitado' ? `${formaQuitacao} ${dataQuitacao}` : 'PENDENTE'}
              </span>
            </div>
          `;
        }).join('')}
  
        <!-- Totais -->
        <div class="total-geral">
          <span class="status-debito">TOTAL EM DÉBITO: R$ ${totalEmDebito.toFixed(2)}</span>
          <span class="status-quitado">TOTAL QUITADO: R$ ${totalQuitado.toFixed(2)}</span>
        </div>
      </body>
      </html>
    `;
  
    const janela = window.open('', '_blank');
    if (janela) {
      janela.document.write(conteudoImpressao);
      janela.document.close();
      janela.print();
    }
  };


  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contas a Receber</h1>
          <p className="text-muted-foreground">
            Controle de débitos dos colaboradores
          </p>
        </div>
        <Button 
          onClick={handlePrintContasReceber} 
          variant="outline" 
          disabled={carregando || todasAsContas.length === 0}
        >
          <Printer className="mr-2 h-4 w-4" />
          Imprimir Relatório
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select 
                value={filtros.status} 
                onValueChange={(value) => handleFiltroChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="em_debito">Em Débito</SelectItem>
                  <SelectItem value="quitado">Quitados</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Colaborador */}
            <div className="space-y-2">
              <Label>Colaborador</Label>
              <Select 
                value={filtros.colaboradorId} 
                onValueChange={(value) => handleFiltroChange('colaboradorId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os colaboradores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os colaboradores</SelectItem>
                  {colaboradores.map((colab) => (
                    <SelectItem key={colab._id} value={colab._id}>
                      {colab.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={limparFiltros}>
              Limpar Filtros
            </Button>
            <Button onClick={buscarContas} disabled={carregando}>
              <Search className="h-4 w-4 mr-2" />
              {carregando ? "Buscando..." : "Atualizar"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total em Débito</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              R$ {calcularTotalEmDebito().toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Valor total a receber
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quitado</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {calcularTotalQuitado().toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Valor já recebido
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Contas */}
      <Card>
        <CardHeader>
          <CardTitle>Contas a Receber</CardTitle>
          <CardDescription>
            {contasFiltradas.length} contas encontradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {carregando ? (
            <div className="text-center py-8">Carregando contas...</div>
          ) : contasFiltradas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma conta encontrada com os filtros selecionados
            </div>
          ) : (
            <div className="space-y-4">
              {contasFiltradas.map((conta) => (
                <Card key={conta._id} className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">Venda #{conta.venda?.numeroVenda}</span>
                        <Badge variant={conta.status === 'quitado' ? 'default' : 'secondary'} className={conta.status === 'quitado' ? 'bg-green-500/80' : 'bg-amber-500/80'}>
                          {conta.status === 'quitado' ? 'QUITADO' : 'EM DÉBITO'}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(conta.dataVenda).toLocaleString('pt-BR')} • {conta.venda?.cafeteria}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">R$ {conta.valor.toFixed(2)}</div>
                    </div>
                  </div>

                  {/* Informações do Colaborador */}
                  <div className="bg-muted p-3 rounded-md mb-3">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4" />
                      <span className="font-medium">Colaborador:</span>
                      <span>{conta.colaborador?.nome}</span>
                      <span className="text-muted-foreground">({conta.colaborador?.email})</span>
                    </div>
                  </div>

                  {/* Itens da Venda */}
                  {conta.venda && (
                    <div className="space-y-2 mb-4">
                      {conta.venda.itens.map((item, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <div>
                            <span className="font-medium">{item.nomeProduto}</span>
                            <span className="text-muted-foreground ml-2">
                              {item.quantidade} × R$ {item.precoUnitario.toFixed(2)}
                            </span>
                          </div>
                          <span>R$ {(item.quantidade * item.precoUnitario).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}


                  {/* Data de Quitação se estiver quitado */}
                  {conta.status === 'quitado' && conta.dataQuitacao && (
                    <div className="flex items-center gap-2 text-sm text-green-600 mb-3">
                      <CheckCircle className="h-4 w-4" />
                      <span>
                        Quitado em: {new Date(conta.dataQuitacao).toLocaleString('pt-BR')} por <b>{conta.usuarioQuitacao?.nome || 'N/A'}</b>
                      </span>
                    </div>
                  )}

                  {/* Botão de Quitação */}
                  {conta.status === 'em_debito' && (
                    <div className="flex justify-end">
                      <Button 
                        onClick={() => quitarConta(conta._id)}
                        className="flex items-center gap-2"
                        size="sm"
                      >
                        <DollarSign className="h-4 w-4" />
                        Marcar como Pago
                      </Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
    
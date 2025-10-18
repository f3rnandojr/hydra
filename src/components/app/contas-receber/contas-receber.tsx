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
import type { ContaReceber as ContaReceberType, Collaborator, Usuario, Setor } from "@/lib/definitions";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";


interface ContaReceber extends ContaReceberType {
  colaborador: {
    _id: string;
    nome: string;
    email: string;
    matricula?: string;
    setorId?: string;
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
  setorId: string;
}

export function ContasReceber() {
  const { toast } = useToast();
  const { usuario } = useAuth();
  const [todasAsContas, setTodasAsContas] = useState<ContaReceber[]>([]);
  const [colaboradores, setColaboradores] = useState<Collaborator[]>([]);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [quitandoTodas, setQuitandoTodas] = useState(false);
  const [filtros, setFiltros] = useState<Filtros>({
    status: "todos",
    colaboradorId: "todos",
    setorId: "todos"
  });

  useEffect(() => {
    buscarColaboradores();
    buscarSetores();
    buscarContas();
  }, []);

  const contasFiltradas = useMemo(() => {
    return todasAsContas.filter(conta => {
        const filtroStatusOk = filtros.status === 'todos' || conta.status === filtros.status;
        const filtroColaboradorOk = filtros.colaboradorId === 'todos' || conta.colaboradorId === filtros.colaboradorId;
        
        const colaborador = colaboradores.find(c => c._id === conta.colaboradorId);
        const filtroSetorOk = filtros.setorId === 'todos' || colaborador?.setorId === filtros.setorId;
        
        return filtroStatusOk && filtroColaboradorOk && filtroSetorOk;
    });
  }, [todasAsContas, filtros, colaboradores]);


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

  const buscarSetores = async () => {
    try {
      const response = await fetch('/api/setores?status=ativo');
      if (response.ok) {
        const data = await response.json();
        setSetores(data);
      }
    } catch (error) {
      console.error('Erro ao buscar setores:', error);
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
      colaboradorId: "todos",
      setorId: "todos"
    });
    buscarContas();
  };

  const calcularTotalEmDebito = () => {
    return contasFiltradas // Usar contas filtradas para os totais
      .filter(conta => conta.status === "em_debito")
      .reduce((total, conta) => total + conta.valor, 0);
  };

  const calcularTotalQuitado = () => {
    return contasFiltradas // Usar contas filtradas para os totais
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

  const quitarTodasContas = async () => {
    if (!usuario) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado.",
        variant: "destructive",
      });
      return;
    }

    const contasEmDebito = contasFiltradas.filter(conta => conta.status === "em_debito");
    
    if (contasEmDebito.length === 0) {
      toast({
        title: "Aviso",
        description: "Não há contas em débito para quitar com os filtros atuais.",
        variant: "default",
      });
      return;
    }

    setQuitandoTodas(true);

    try {
      const response = await fetch('/api/contas-receber/batch-quit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${usuario._id}`,
        },
        body: JSON.stringify({
          contaIds: contasEmDebito.map(conta => conta._id),
          formaQuitacao: "dinheiro"
        }),
      });

      if (response.ok) {
        setTodasAsContas(prevContas => 
          prevContas.map(conta => 
            contasEmDebito.some(debito => debito._id === conta._id)
              ? { 
                  ...conta, 
                  status: "quitado",
                  dataQuitacao: new Date().toISOString(),
                  formaQuitacao: "dinheiro",
                  usuarioQuitacao: {
                    _id: usuario._id,
                    nome: usuario.nome,
                    email: usuario.email
                  }
                }
              : conta
          )
        );

        toast({
          title: "Sucesso!",
          description: `${contasEmDebito.length} contas quitadas com sucesso.`,
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao quitar contas');
      }
    } catch (error: any) {
      console.error('Erro:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível quitar as contas.",
        variant: "destructive",
      });
    } finally {
      setQuitandoTodas(false);
    }
  };

  const handlePrintContasReceber = async () => {
    let logoUrl = '/logo.svg';
    try {
      const logoRes = await fetch('/api/configuracoes/logo');
      if (logoRes.ok) {
        const logoData = await logoRes.json();
        logoUrl = logoData.url;
      }
    } catch (e) {
      console.error("Não foi possível buscar a logo para o relatório.");
    }
  
    const totalEmDebito = calcularTotalEmDebito();
    const totalQuitado = calcularTotalQuitado();
    const totalContas = contasFiltradas.length;
    const contasEmDebito = contasFiltradas.filter(conta => conta.status === "em_debito").length;
    const contasQuitadas = contasFiltradas.filter(conta => conta.status === "quitado").length;
  
    const getFormaQuitacaoLabel = (forma?: string) => {
      if (!forma) return '-';
      const formas: { [key: string]: string } = {
        'dinheiro': 'Dinheiro', 'cartao_credito': 'Cartão Crédito', 'cartao_debito': 'Cartão Débito', 'pix': 'PIX', 'transferencia': 'Transferência'
      };
      return formas[forma] || forma;
    };
  
    const conteudoImpressao = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Relatório de Contas a Receber</title>
        <style>
          body { font-family: 'Courier New', monospace; margin: 15px; font-size: 10px; line-height: 1.1; }
          .header { text-align: center; margin-bottom: 10px; border-bottom: 1px solid #000; padding-bottom: 5px; }
          .logo-relatorio { text-align: center; margin-bottom: 10px; }
          .logo-relatorio img { height: 40px; max-width: 180px; object-fit: contain; }
          .filtros { margin-bottom: 10px; padding: 8px; border: 1px solid #ccc; background: #f9f9f9; text-align: center; }
          .resumo-geral { margin: 8px 0; padding: 6px; background: #f0f0f0; text-align: center; font-weight: bold; }
          .cabecalho-linhas, .linha-conta { display: grid; grid-template-columns: 80px 120px 70px 70px 60px 80px 80px; gap: 5px; text-align: center; align-items: center; }
          .cabecalho-linhas { font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 3px; margin-bottom: 5px; }
          .linha-conta { margin: 2px 0; padding: 2px 0; border-bottom: 1px dotted #ddd; }
          .status-debito { color: #d97706; font-weight: bold; }
          .status-quitado { color: #059669; font-weight: bold; }
          .total-geral { margin-top: 10px; border-top: 2px solid #000; padding-top: 5px; font-weight: bold; display: flex; justify-content: space-between; }
          .col-venda, .col-valor { font-weight: bold; }
          @media print { body { margin: 8px; } }
        </style>
      </head>
      <body>
        <div class="logo-relatorio"><img src="${logoUrl}" alt="Logo" onerror="this.style.display='none'" /></div>
        <div class="header"><h1>RELATÓRIO DE CONTAS A RECEBER</h1><p>${new Date().toLocaleDateString('pt-BR')}</p></div>
        <div class="filtros">
          <strong>FILTROS:</strong> 
          Status: ${filtros.status === 'todos' ? 'Todos' : (filtros.status === 'em_debito' ? 'Em Débito' : 'Quitados')} | 
          Colaborador: ${filtros.colaboradorId === 'todos' ? 'Todos' : (colaboradores.find(c => c._id === filtros.colaboradorId)?.nome || 'Filtrado')} |
          Setor: ${filtros.setorId === 'todos' ? 'Todos' : (setores.find(s => s._id === filtros.setorId)?.nome || 'Filtrado')}
        </div>
        <div class="resumo-geral">${totalContas} CONTAS | ${contasEmDebito} EM DÉBITO | ${contasQuitadas} QUITADAS | A RECEBER: R$ ${totalEmDebito.toFixed(2)} | RECEBIDO: R$ ${totalQuitado.toFixed(2)}</div>
        <div class="cabecalho-linhas"><span>VENDA</span><span>COLABORADOR</span><span>DATA</span><span>STATUS</span><span>VALOR</span><span>QUITAÇÃO</span><span>DATA</span></div>
        ${contasFiltradas.map(conta => `
          <div class="linha-conta">
            <span class="col-venda">#${conta.venda?.numeroVenda || 'N/A'}</span>
            <span>${conta.colaborador?.nome || 'N/A'}</span>
            <span>${new Date(conta.dataVenda).toLocaleDateString('pt-BR')}</span>
            <span class="${conta.status === 'em_debito' ? 'status-debito' : 'status-quitado'}">${conta.status === 'quitado' ? 'QUITADO' : 'EM DÉBITO'}</span>
            <span class="col-valor">R$ ${conta.valor.toFixed(2)}</span>
            <span>${conta.status === 'quitado' ? getFormaQuitacaoLabel(conta.formaQuitacao) : '-'}</span>
            <span>${conta.dataQuitacao ? new Date(conta.dataQuitacao).toLocaleDateString('pt-BR') : '-'}</span>
          </div>
        `).join('')}
        <div class="total-geral"><span class="status-debito">TOTAL EM DÉBITO: R$ ${totalEmDebito.toFixed(2)}</span><span class="status-quitado">TOTAL QUITADO: R$ ${totalQuitado.toFixed(2)}</span></div>
        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `;
  
    const janela = window.open('', '_blank');
    if (janela) {
      janela.document.write(conteudoImpressao);
      janela.document.close();
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
        <div className="flex gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  disabled={carregando || quitandoTodas || contasFiltradas.filter(conta => conta.status === "em_debito").length === 0}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Marcar Todos como Pago
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar Quitação em Lote</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja marcar TODAS as {contasFiltradas.filter(conta => conta.status === "em_debito").length} contas em débito como pagas?
                    <br /><br />
                    <strong>Esta ação não pode ser desfeita.</strong>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={quitandoTodas}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={quitarTodasContas}
                    disabled={quitandoTodas}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {quitandoTodas ? (
                      <>
                        <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Quitando...
                      </>
                    ) : (
                      'Sim, Quitar Todas'
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button 
              onClick={handlePrintContasReceber} 
              variant="outline" 
              disabled={carregando || todasAsContas.length === 0}
            >
              <Printer className="mr-2 h-4 w-4" />
              Imprimir Relatório
            </Button>
          </div>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            {/* Setor */}
            <div className="space-y-2">
              <Label>Setor</Label>
              <Select 
                value={filtros.setorId} 
                onValueChange={(value) => handleFiltroChange('setorId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os setores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os setores</SelectItem>
                  {setores.map((setor) => (
                    <SelectItem key={setor._id} value={setor._id}>
                      {setor.nome}
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
              Valor total a receber (considerando filtros)
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
              Valor já recebido (considerando filtros)
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
                    <div className="flex items-center gap-2 text-sm flex-wrap">
                      <User className="h-4 w-4" />
                      <span className="font-medium">Colaborador:</span>
                      <span>{conta.colaborador?.nome}</span>
                      {conta.colaborador?.matricula && (
                        <span className="text-muted-foreground">(Mat: {conta.colaborador.matricula})</span>
                      )}
                      {colaboradores.find(c => c._id === conta.colaboradorId)?.setorId && (
                        <span className="text-muted-foreground">- {setores.find(s => s._id === colaboradores.find(c => c._id === conta.colaboradorId)?.setorId)?.nome || 'Setor não encontrado'}</span>
                      )}
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

"use client";

import { useState, useEffect } from "react";
import { Check, Users, User, AlertTriangle, CreditCard, DollarSign, QrCode, RefreshCw, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { Product, Collaborator, Venda } from "@/lib/definitions";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from '@/contexts/auth-context';
import { useCafeteria } from '@/contexts/cafeteria-context';
import { CupomFiscalDialog } from "@/components/app/vendas/cupom-fiscal-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { cn } from "@/lib/utils";

interface FinalizarVendaProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itens: Array<{
    produto: Product;
    quantidade: number;
    precoUnitario: number;
  }>;
  tipoCliente: "normal" | "colaborador";
  onVendaFinalizada: (venda: Venda) => void;
}

export function FinalizarVenda({ 
  open, 
  onOpenChange, 
  itens,
  tipoCliente,
  onVendaFinalizada 
}: FinalizarVendaProps) {
  const { toast } = useToast();
  const { usuario } = useAuth();
  const { cafeteriaAtiva, abrirModal } = useCafeteria();

  const [colaboradorId, setColaboradorId] = useState("");
  const [colaboradores, setColaboradores] = useState<Collaborator[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingParams, setIsLoadingParams] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comboboxOpen, setComboboxOpen] = useState(false);
  
  const [formaPagamento, setFormaPagamento] = useState<"dinheiro" | "cartao_credito" | "cartao_debito" | "pix" | "apagar">("dinheiro");

  const [cupomOpen, setCupomOpen] = useState(false);
  const [vendaCriadaId, setVendaCriadaId] = useState<string | null>(null);


  useEffect(() => {
    async function fetchData() {
      if (!open) return;

      if (!cafeteriaAtiva) {
        abrirModal();
        onOpenChange(false); // Fecha o modal de finalizar venda
        return;
      }
      
      setIsLoadingParams(true);
      setError(null);
      try {
        if (tipoCliente === 'colaborador') {
          const colabRes = await fetch('/api/colaboradores?status=ativo');
           if (!colabRes.ok) {
             throw new Error("Não foi possível carregar a lista de colaboradores.");
           }
          const colabData = await colabRes.json();
          setColaboradores(colabData);
        }
      } catch (err: any) {
        setError(err.message);
        console.error('Erro ao buscar dados para finalização:', err);
      } finally {
        setIsLoadingParams(false);
      }
    }
    
    fetchData();
  }, [open, tipoCliente, cafeteriaAtiva, abrirModal, onOpenChange]);
  
  useEffect(() => {
    if (tipoCliente === 'colaborador') {
      setFormaPagamento('apagar');
    } else {
      setFormaPagamento('dinheiro');
    }
  }, [tipoCliente]);

  useEffect(() => {
    if (tipoCliente === 'normal') {
      setColaboradorId('');
    }
  }, [tipoCliente]);

  const calcularTotal = () => {
    return itens.reduce((total, item) => 
      total + (item.quantidade * item.precoUnitario), 0
    );
  };

  const handleFinalizarVenda = async () => {
    if (!cafeteriaAtiva) {
      abrirModal();
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      const vendaData = {
        cafeteria: cafeteriaAtiva,
        tipoCliente,
        colaboradorId: tipoCliente === "colaborador" && colaboradorId ? colaboradorId : undefined,
        formaPagamento,
        itens: itens.map(item => ({
          produtoId: item.produto._id.toString(),
          nomeProduto: item.produto.nome,
          codigoEAN: item.produto.codigoEAN || "",
          quantidade: item.quantidade,
          precoUnitario: item.precoUnitario,
          subtotal: item.quantidade * item.precoUnitario
        }))
      };

      const response = await fetch('/api/vendas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${usuario?._id}`,
        },
        body: JSON.stringify(vendaData),
      });

      const result = await response.json();

      if (response.ok) {
        setVendaCriadaId(result.venda._id);
        setCupomOpen(true);
        onVendaFinalizada(result.venda);
        onOpenChange(false);
        setColaboradorId("");
        setFormaPagamento("dinheiro");
      } else {
        throw new Error(result.message || 'Erro desconhecido ao finalizar venda');
      }
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Erro ao Finalizar Venda",
        description: err.message || 'Não foi possível registrar a venda.',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isFinalizarDisabled = isLoading ||
                              isLoadingParams ||
                              !cafeteriaAtiva || 
                              !!error ||
                              (tipoCliente === "colaborador" && !colaboradorId);

  const getPaymentIcon = (type: string) => {
    switch (type) {
      case 'dinheiro': return <DollarSign className="h-4 w-4" />;
      case 'cartao_credito': 
      case 'cartao_debito': return <CreditCard className="h-4 w-4" />;
      case 'pix': return <QrCode className="h-4 w-4" />;
      case 'apagar': return <User className="h-4 w-4" />;
      default: return <DollarSign className="h-4 w-4" />;
    }
  };

  const getPaymentLabel = (type: string) => {
    switch (type) {
      case 'dinheiro': return "Dinheiro";
      case 'cartao_credito': return "Cartão de Crédito";
      case 'cartao_debito': return "Cartão de Débito";
      case 'pix': return "PIX";
      case 'apagar': return "À Pagar";
      default: return type;
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Finalizar Venda</DialogTitle>
            <DialogDescription>
              {tipoCliente === "colaborador"
                ? "Venda para colaborador - selecione o colaborador"
                : "Confirme os detalhes da venda antes de finalizar."}
            </DialogDescription>
          </DialogHeader>

          {isLoadingParams && (
              <div className="flex justify-center items-center h-24">
                  <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2">Carregando parâmetros...</span>
              </div>
          )}

          {error && !isLoadingParams && (
              <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Erro de Configuração</AlertTitle>
                  <AlertDescription>
                      {error}
                  </AlertDescription>
              </Alert>
          )}

          {!isLoadingParams && !error && cafeteriaAtiva && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Cafeteria</Label>
                  <div className="p-3 bg-muted rounded-md text-sm font-medium">
                    {cafeteriaAtiva === 'cafeteria_01' ? 'Cafeteria 01' : 'Cafeteria 02'}
                  </div>
                </div>
              
                <div className="space-y-3">
                  <Label>Tipo de Cliente</Label>
                  <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-md border ${
                      tipoCliente === "colaborador" 
                          ? "bg-accent/10 text-accent-foreground border-accent/20" 
                          : "bg-muted text-muted-foreground border-border"
                      }`}>
                      {tipoCliente === 'colaborador' ? (
                          <>
                              <Users className="h-4 w-4" />
                              <span>Venda para Colaborador</span>
                          </>
                      ) : (
                          <>
                              <User className="h-4 w-4" />
                              <span>Venda para Cliente Normal</span>
                          </>
                      )}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="forma-pagamento">Forma de Pagamento</Label>
                  <Select 
                    value={formaPagamento} 
                    onValueChange={(value: "dinheiro" | "cartao_credito" | "cartao_debito" | "pix" | "apagar") => 
                      setFormaPagamento(value)
                    }
                    disabled={tipoCliente === 'colaborador' || isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue>
                        <div className="flex items-center gap-2">
                          {getPaymentIcon(formaPagamento)}
                          {getPaymentLabel(formaPagamento)}
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dinheiro">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Dinheiro
                        </div>
                      </SelectItem>
                      <SelectItem value="cartao_credito">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          Cartão de Crédito
                        </div>
                      </SelectItem>
                      <SelectItem value="cartao_debito">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          Cartão de Débito
                        </div>
                      </SelectItem>
                      <SelectItem value="pix">
                        <div className="flex items-center gap-2">
                          <QrCode className="h-4 w-4" />
                          PIX
                        </div>
                      </SelectItem>
                      <SelectItem 
                        value="apagar" 
                        disabled={tipoCliente !== 'colaborador'}
                      >
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {tipoCliente === 'colaborador' ? "À Pagar" : "Somente para colaboradores"}
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {tipoCliente === 'colaborador' && (
                    <p className="text-sm text-muted-foreground">
                      Pagamento automaticamente definido como "À Pagar" para colaboradores
                    </p>
                  )}
                </div>

                {tipoCliente === "colaborador" && (
                  <div className="space-y-3">
                    <Label htmlFor="colaborador">Colaborador *</Label>
                    <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={comboboxOpen}
                          className="w-full justify-between"
                          disabled={isLoading || !colaboradores.length}
                        >
                          {colaboradorId
                            ? colaboradores.find((colab) => colab._id === colaboradorId)?.nome
                            : "Selecione o colaborador"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[450px] p-0">
                        <Command>
                          <CommandInput placeholder="Buscar colaborador..." />
                          <CommandEmpty>Nenhum colaborador encontrado.</CommandEmpty>
                          <CommandGroup>
                            {colaboradores.map((colab) => (
                              <CommandItem
                                key={colab._id}
                                value={colab.nome}
                                onSelect={() => {
                                  setColaboradorId(colab._id);
                                  setComboboxOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    colaboradorId === colab._id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {colab.nome} ({colab.email})
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {colaboradores.length === 0 && !isLoading && (
                      <p className="text-sm text-destructive">Nenhum colaborador ativo encontrado.</p>
                    )}
                  </div>
                )}

                <div className="space-y-3">
                  <Label>Resumo da Venda</Label>
                  <div className="border rounded-lg p-4 space-y-2">
                    {itens.map((item, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <div className="flex-1">
                          <div className="font-medium">{item.produto.nome}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.quantidade} × R$ {item.precoUnitario.toFixed(2)}
                          </div>
                        </div>
                        <Badge variant="secondary">
                          R$ {(item.quantidade * item.precoUnitario).toFixed(2)}
                        </Badge>
                      </div>
                    ))}
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between items-center font-bold">
                        <span>TOTAL</span>
                        <span>R$ {calcularTotal().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleFinalizarVenda}
              disabled={isFinalizarDisabled}
              className="gap-2"
            >
              <Check className="h-4 w-4" />
              {isLoading ? "Processando..." : "Finalizar Venda"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {vendaCriadaId && (
        <CupomFiscalDialog
            open={cupomOpen}
            onOpenChange={setCupomOpen}
            vendaId={vendaCriadaId}
        />
      )}
    </>
  );
}

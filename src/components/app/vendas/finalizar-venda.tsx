"use client";

import { useState, useEffect } from "react";
import { Check, Users, User, AlertTriangle } from "lucide-react";
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
import type { Product, Collaborator } from "@/lib/definitions";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface FinalizarVendaProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itens: Array<{
    produto: Product;
    quantidade: number;
    precoUnitario: number;
  }>;
  tipoCliente: "normal" | "colaborador";
  onVendaFinalizada: () => void;
}

export function FinalizarVenda({ 
  open, 
  onOpenChange, 
  itens,
  tipoCliente,
  onVendaFinalizada 
}: FinalizarVendaProps) {
  const { toast } = useToast();
  const [colaboradorId, setColaboradorId] = useState("");
  const [colaboradores, setColaboradores] = useState<Collaborator[]>([]);
  const [cafeteriaAtiva, setCafeteriaAtiva] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Buscar colaboradores e cafeteria ativa
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);
      try {
        // Buscar cafeteria ativa - ✅ CORREÇÃO
        const cafeteriaRes = await fetch('/api/parametros?chave=CAFETERIA_ATIVA');
        if (!cafeteriaRes.ok) {
          const errorData = await cafeteriaRes.json();
          throw new Error(errorData.error || "Não foi possível carregar a configuração da cafeteria.");
        }
        const cafeteriaParam = await cafeteriaRes.json();
        setCafeteriaAtiva(cafeteriaParam?.valor || null);

        // Buscar colaboradores se necessário
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
        setIsLoading(false);
      }
    }
    
    if (open) {
      fetchData();
    }
  }, [open, tipoCliente]);
  
  // Resetar colaborador selecionado quando o tipo de cliente muda
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
    setIsLoading(true);
    setError(null);
    try {
      if (!cafeteriaAtiva) {
        throw new Error("A cafeteria ativa não está configurada.");
      }

      const vendaData = {
        cafeteria: cafeteriaAtiva,
        tipoCliente,
        colaboradorId: tipoCliente === "colaborador" && colaboradorId ? colaboradorId : undefined,
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
        },
        body: JSON.stringify(vendaData),
      });

      if (response.ok) {
        onVendaFinalizada();
        onOpenChange(false);
        setColaboradorId(""); // Reset form
      } else {
        const errorResult = await response.json();
        throw new Error(errorResult.message || 'Erro desconhecido ao finalizar venda');
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
                              !cafeteriaAtiva || 
                              !!error ||
                              (tipoCliente === "colaborador" && !colaboradorId);

  return (
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

        {error && (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Erro de Configuração</AlertTitle>
                <AlertDescription>
                    {error}
                </AlertDescription>
            </Alert>
        )}

        <div className="space-y-6">
           {/* Cafeteria (somente leitura) */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Cafeteria</Label>
            <div className="p-3 bg-muted rounded-md text-sm font-medium text-muted-foreground">
              {isLoading ? "Carregando..." : cafeteriaAtiva || "Não configurada"}
            </div>
          </div>
        
          {/* Tipo de Cliente (Informativo) */}
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

          {/* Seleção de Colaborador (se for venda para colaborador) */}
          {tipoCliente === "colaborador" && (
            <div className="space-y-3">
              <Label htmlFor="colaborador">Colaborador *</Label>
              <Select value={colaboradorId} onValueChange={setColaboradorId} disabled={isLoading || !colaboradores.length}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o colaborador" />
                </SelectTrigger>
                <SelectContent>
                  {colaboradores.map((colab) => (
                    <SelectItem key={colab._id.toString()} value={colab._id.toString()}>
                      {colab.nome} ({colab.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {colaboradores.length === 0 && !isLoading && (
                 <p className="text-sm text-destructive">Nenhum colaborador ativo encontrado.</p>
              )}
            </div>
          )}

          {/* Resumo da Venda */}
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
  );
}

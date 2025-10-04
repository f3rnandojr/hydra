"use client";

import { useState, useEffect } from "react";
import { Check, Users, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  const [cafeteria, setCafeteria] = useState<"cafeteria_1" | "cafeteria_2">("cafeteria_1");
  const [isLoading, setIsLoading] = useState(false);

  // Buscar colaboradores ativos
  useEffect(() => {
    async function fetchColaboradores() {
      try {
        const response = await fetch('/api/colaboradores?status=ativo');
        const data = await response.json();
        setColaboradores(data);
      } catch (error) {
        console.error('Erro ao buscar colaboradores:', error);
         toast({
          title: "Erro ao buscar colaboradores",
          description: "Não foi possível carregar a lista de colaboradores.",
          variant: "destructive",
        });
      }
    }
    
    if (open && tipoCliente === 'colaborador') {
      fetchColaboradores();
    }
  }, [open, tipoCliente, toast]);
  
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
    try {
      const vendaData = {
        cafeteria,
        tipoCliente,
        colaboradorId: tipoCliente === "colaborador" ? colaboradorId : undefined,
        itens: itens.map(item => ({
          produtoId: item.produto._id.toString(),
          nomeProduto: item.produto.nome,
          codigoEAN: item.produto.codigoEAN,
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
        // Reset form
        setColaboradorId("");
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao finalizar venda');
      }
    } catch (error: any) {
      console.error('Erro:', error);
       toast({
        title: "Erro ao Finalizar Venda",
        description: error.message || 'Não foi possível registrar a venda.',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Finalizar Venda</DialogTitle>
          <DialogDescription>
            Confirme os detalhes da venda antes de finalizar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Cafeteria */}
          <div className="space-y-3">
            <Label htmlFor="cafeteria">Cafeteria</Label>
            <Select value={cafeteria} onValueChange={(value: "cafeteria_1" | "cafeteria_2") => setCafeteria(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cafeteria_1">Cafeteria 1</SelectItem>
                <SelectItem value="cafeteria_2">Cafeteria 2</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tipo de Cliente (Informativo) */}
          <div className="space-y-2">
             <Label>Tipo de Cliente</Label>
             <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm border ${
                tipoCliente === "colaborador" 
                    ? "bg-accent/10 text-accent-foreground border-accent/20" 
                    : "bg-muted text-muted-foreground border-border"
                }`}>
                {tipoCliente === 'colaborador' ? 'Colaborador' : 'Cliente Normal'}
            </div>
          </div>


          {/* Seleção de Colaborador (se for venda para colaborador) */}
          {tipoCliente === "colaborador" && (
            <div className="space-y-3">
              <Label htmlFor="colaborador">Colaborador</Label>
              <Select value={colaboradorId} onValueChange={setColaboradorId}>
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
            disabled={isLoading || (tipoCliente === "colaborador" && !colaboradorId)}
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

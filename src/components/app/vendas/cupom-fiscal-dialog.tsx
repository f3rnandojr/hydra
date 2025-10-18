"use client";

import { useEffect, useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader, AlertCircle, Printer } from "lucide-react";
import { CupomFiscal, type CupomFiscalProps } from "./cupom-fiscal";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface CupomFiscalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendaId: string;
}

export function CupomFiscalDialog({ open, onOpenChange, vendaId }: CupomFiscalDialogProps) {
  const [data, setData] = useState<CupomFiscalProps | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cupomRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (open && vendaId) {
      setIsLoading(true);
      setError(null);
      
      const fetchData = async () => {
        try {
          const [vendaRes, estabRes] = await Promise.all([
            fetch(`/api/relatorios/vendas-v2?id=${vendaId}`),
            fetch('/api/parametros-fiscais')
          ]);
          
          if (!vendaRes.ok) throw new Error("Falha ao buscar dados da venda.");
          if (!estabRes.ok) throw new Error("Falha ao buscar dados do estabelecimento.");

          const vendaDataArray = await vendaRes.json();
          if (vendaDataArray.length === 0) throw new Error(`Venda com ID ${vendaId} não encontrada.`);
          
          const estabData = await estabRes.json();
          
          setData({
            venda: vendaDataArray[0],
            estabelecimento: estabData
          });
          
        } catch (err: any) {
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchData();
    }
  }, [open, vendaId]);

  const handlePrint = () => {
    const printContent = cupomRef.current;
    if (printContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Cupom Fiscal</title>
              <style>
                body { font-family: monospace; font-size: 11px; line-height: 1.3; margin: 0; padding: 10px; color: black; }
                .cupom-copy { break-after: page; }
                .cupom-copy:last-child { break-after: avoid; }
                @media print {
                  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
              </style>
            </head>
            <body>
              <div class="cupom-copy">${printContent.innerHTML}</div>
              <div class="cupom-copy">${printContent.innerHTML}</div>
              <script>
                setTimeout(() => {
                  window.print();
                  setTimeout(() => window.close(), 100);
                }, 250);
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cupom Fiscal</DialogTitle>
          <DialogDescription>
            Venda finalizada. Visualize e imprima o cupom fiscal.
          </DialogDescription>
        </DialogHeader>

        <div className="my-4">
          {isLoading && (
            <div className="flex justify-center items-center h-48">
              <Loader className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Carregando dados do cupom...</span>
            </div>
          )}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erro ao carregar</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {data && (
            <div ref={cupomRef}>
              <CupomFiscal {...data} />
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
          <Button onClick={handlePrint} disabled={isLoading || !!error}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir (2 vias)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

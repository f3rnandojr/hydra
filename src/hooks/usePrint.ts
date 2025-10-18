
"use client";

import { useCallback } from 'react';

export const usePrint = () => {
  const handlePrint = useCallback((content: HTMLElement | null, title: string = 'Relatório') => {
    if (!content) {
      console.error('Elemento de conteúdo não encontrado');
      return;
    }

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      alert('Permita pop-ups para imprimir o relatório');
      return;
    }

    // Clonar o conteúdo
    const contentClone = content.cloneNode(true) as HTMLElement;
    
    // Remover elementos interativos
    const interactiveElements = contentClone.querySelectorAll('button, input, select, .no-print');
    interactiveElements.forEach(el => el.remove());

    // ✅ CORREÇÃO: APENAS UMA CÓPIA para relatórios
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <meta charset="utf-8">
          <style>
            body { 
              font-family: 'Arial', sans-serif; 
              margin: 15px;
              color: #000;
              font-size: 12px;
              line-height: 1.3;
            }
            .hidden { display: none !important; }
            .print\\:block { display: block !important; }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 11px;
            }
            th, td {
              border: 1px solid #000;
              padding: 4px 6px;
              text-align: left;
            }
            th {
              background-color: #f0f0f0;
              font-weight: bold;
            }
            hr {
              border: 1px solid #000;
              margin: 10px 0;
            }
            @media print {
              body { margin: 10px; }
            }
          </style>
        </head>
        <body onload="window.print()">
          ${contentClone.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    
    // Fallback para impressão
    setTimeout(() => {
      if (!printWindow.closed) {
        printWindow.print();
      }
    }, 1000);

  }, []);

  return { handlePrint };
};

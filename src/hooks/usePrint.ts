"use client";

import { useCallback } from 'react';

const getPrintStyles = () => `
  body { 
    font-family: 'Arial', sans-serif; 
    margin: 15px;
    color: #000;
    font-size: 12px;
    line-height: 1.3;
  }
  @media print {
    body { margin: 10px; }
    .no-print { display: none !important; }
  }
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
  .header {
    text-align: center;
    margin-bottom: 15px;
  }
  .total {
    font-weight: bold;
    background-color: #f9f9f9;
    padding: 8px;
    margin: 10px 0;
  }
`;

export const usePrint = () => {
  const handlePrint = useCallback((content: HTMLElement | null, title: string = 'Relatório') => {
    if (!content) {
      console.error('Elemento de conteúdo para impressão não foi encontrado.');
      return;
    }

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      alert('Por favor, permita pop-ups para imprimir o relatório.');
      return;
    }

    const contentClone = content.cloneNode(true) as HTMLElement;
    
    // Remove elementos que não devem aparecer na impressão
    const noPrintElements = contentClone.querySelectorAll('.no-print');
    noPrintElements.forEach(el => el.remove());

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <meta charset="utf-8">
          <style>
            ${getPrintStyles()}
          </style>
        </head>
        <body onload="setTimeout(function() { window.print(); }, 500);">
          <div class="print-container">
            <div class="header">
              <h2>${title}</h2>
              <p>Emitido em: ${new Date().toLocaleString('pt-BR')}</p>
            </div>
            ${contentClone.innerHTML}
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    
  }, []);

  return { handlePrint };
};

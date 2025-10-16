
import React from 'react';

interface Venda {
  _id: string;
  dataVenda: string;
  itens: {
    nomeProduto: string;
    quantidade: number;
    precoUnitario: number;
    subtotal: number;
  }[];
}

interface Filtros {
  periodo: string;
  formaPagamento: string;
  tipoCliente: string;
  cafeteria: string;
}

interface VendasPrintReportProps {
  vendas: Venda[];
  filtros: Filtros;
}

export const VendasPrintReport = React.forwardRef<HTMLDivElement, VendasPrintReportProps>(
  ({ vendas, filtros }, ref) => {
    
    const formatarHora = (dataString: string) => {
      return new Date(dataString).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const itensParaRelatorio = vendas.flatMap(venda => 
      venda.itens.map(item => ({
        horario: formatarHora(venda.dataVenda),
        produto: item.nomeProduto,
        quantidade: item.quantidade,
        valorUnitario: item.precoUnitario,
        totalItem: item.subtotal
      }))
    );

    itensParaRelatorio.sort((a, b) => a.horario.localeCompare(b.horario));

    const totalGeral = itensParaRelatorio.reduce((sum, item) => sum + item.totalItem, 0);

    const getFiltroLabel = (filtro: keyof Filtros, valor: string) => {
        if (!valor || valor === 'todos') return 'Todos';
        if (filtro === 'cafeteria') {
            return valor === 'cafeteria_01' ? 'Cafeteria 01' : 'Cafeteria 02';
        }
        return valor.charAt(0).toUpperCase() + valor.slice(1);
    }

    return (
      <div ref={ref} className="p-8 font-sans">
        <div className="text-center mb-8">
            <h1 className="text-2xl font-bold">Relatório de Vendas</h1>
            <p className="text-sm text-gray-500">Gerado em: {new Date().toLocaleString('pt-BR')}</p>
        </div>

        <div className="mb-6 p-4 border rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Filtros Aplicados</h2>
            <div className="grid grid-cols-2 gap-2 text-sm">
                <p><strong>Período:</strong> {getFiltroLabel('periodo', filtros.periodo)}</p>
                <p><strong>Pagamento:</strong> {getFiltroLabel('formaPagamento', filtros.formaPagamento)}</p>
                <p><strong>Cliente:</strong> {getFiltroLabel('tipoCliente', filtros.tipoCliente)}</p>
                <p><strong>Cafeteria:</strong> {getFiltroLabel('cafeteria', filtros.cafeteria)}</p>
            </div>
        </div>

        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b-2 border-black">
              <th className="py-2">Horário</th>
              <th className="py-2">Produto</th>
              <th className="py-2 text-right">Detalhes</th>
              <th className="py-2 text-right">Total Item</th>
            </tr>
          </thead>
          <tbody>
            {itensParaRelatorio.map((item, index) => (
              <tr key={index} className="border-b">
                <td className="py-2">{item.horario}</td>
                <td className="py-2 font-medium">{item.produto}</td>
                <td className="py-2 text-right">
                    {item.quantidade} x R$ {item.valorUnitario.toFixed(2)}
                </td>
                <td className="py-2 text-right font-semibold">
                    R$ {item.totalItem.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="mt-6 text-right">
            <div className="text-xl font-bold">
                TOTAL GERAL: R$ {totalGeral.toFixed(2)}
            </div>
        </div>

        <div className="text-center mt-8 text-xs text-gray-400">
            <p>Hydra Sales System</p>
        </div>
      </div>
    );
  }
);

VendasPrintReport.displayName = 'VendasPrintReport';

import { Layout } from "@/components/Layout";
import { useSimulations } from "@/hooks/use-simulations";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

export default function HistoryPage() {
  const { data: simulations, isLoading } = useSimulations();

  const formatCurrency = (value: string | number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(Number(value));
  };

  return (
    <Layout>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-display">Histórico de Simulações</h1>
        <p className="text-slate-500">Visualize todas as antecipações salvas no sistema.</p>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Operações Salvas</CardTitle>
          <CardDescription>Lista completa de cálculos realizados</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
          ) : !simulations || simulations.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              Nenhuma simulação encontrada.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead className="text-right">Valor Bruto</TableHead>
                    <TableHead className="text-right">Valor Líquido</TableHead>
                    <TableHead className="text-center">Prazo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {simulations.map((sim) => (
                    <TableRow key={sim.id}>
                      <TableCell className="font-medium">
                        {format(new Date(sim.createdAt!), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-slate-50">
                          {sim.modelConfig.name}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(sim.dueDate), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(sim.titleValue)}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-emerald-600">
                        {formatCurrency(sim.netValue)}
                      </TableCell>
                      <TableCell className="text-center">
                        {sim.days} dias
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </Layout>
  );
}

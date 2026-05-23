import { Layout } from "@/components/Layout";
import { useModelConfigs } from "@/hooks/use-models";
import { useCalculate, useSaveSimulation } from "@/hooks/use-calculator";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Loader2, Calculator, Save, AlertCircle, Calendar as CalendarIcon, DollarSign } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

// Format currency BRL
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export default function Simulator() {
  const { data: models } = useModelConfigs();
  const calculate = useCalculate();
  const saveSimulation = useSaveSimulation();
  const { toast } = useToast();

  const [titleValue, setTitleValue] = useState("10000");
  const [emissionDate, setEmissionDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [dueDate, setDueDate] = useState(format(new Date(new Date().setDate(new Date().getDate() + 30)), "yyyy-MM-dd"));
  const [selectedModelIds, setSelectedModelIds] = useState<number[]>([]);
  const [results, setResults] = useState<any[]>([]);

  const toggleModel = (id: number) => {
    setSelectedModelIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleCalculate = async () => {
    if (selectedModelIds.length === 0) {
      toast({ title: "Selecione pelo menos um modelo", variant: "destructive" });
      return;
    }
    
    setResults([]);
    const promises = selectedModelIds.map(modelId => 
      calculate.mutateAsync({
        titleValue: parseFloat(titleValue),
        emissionDate: new Date(emissionDate).toISOString(),
        dueDate: new Date(dueDate).toISOString(),
        modelConfigId: modelId
      })
    );

    try {
      const responses = await Promise.all(promises);
      setResults(responses);
    } catch (err) {
      toast({ title: "Erro no cálculo", description: "Verifique os dados inseridos", variant: "destructive" });
    }
  };

  const handleSave = async (result: any, modelId: number) => {
    try {
      await saveSimulation.mutateAsync({
        modelConfigId: modelId,
        result: result,
        titleData: {
          value: parseFloat(titleValue),
          emissionDate: new Date(emissionDate).toISOString(),
          dueDate: new Date(dueDate).toISOString(),
        }
      });
      toast({ title: "Simulação salva com sucesso!" });
    } catch (err) {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    }
  };

  // Chart data preparation
  const chartData = results.map(r => ({
    name: r.model.name,
    liquido: r.result.netValue,
    custo: r.result.grossValue - r.result.netValue,
  }));

  const days = differenceInDays(new Date(dueDate), new Date(emissionDate));

  return (
    <Layout>
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-display">Simulador</h1>
        <p className="text-slate-500">Compare custos de antecipação entre diferentes modelos.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* INPUTS PANEL */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-slate-200 shadow-sm bg-white">
            <CardHeader className="bg-slate-50 border-b border-slate-100">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                Dados do Título
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <Label>Valor Nominal (R$)</Label>
                <Input 
                  type="number" 
                  value={titleValue} 
                  onChange={e => setTitleValue(e.target.value)}
                  className="text-lg font-medium text-slate-900 border-slate-300 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Emissão</Label>
                  <Input 
                    type="date" 
                    value={emissionDate} 
                    onChange={e => setEmissionDate(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Vencimento</Label>
                  <Input 
                    type="date" 
                    value={dueDate} 
                    onChange={e => setDueDate(e.target.value)} 
                  />
                </div>
              </div>
              
              <div className="pt-2">
                <div className="flex items-center justify-between text-sm text-slate-500 bg-slate-50 p-3 rounded-md border border-slate-100">
                  <span>Prazo da operação:</span>
                  <span className="font-bold text-slate-900">{days > 0 ? days : 0} dias</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm bg-white">
            <CardHeader className="bg-slate-50 border-b border-slate-100">
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-indigo-600" />
                Selecionar Modelos
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {models?.filter(m => m.isActive).map(model => (
                  <div key={model.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors">
                    <Checkbox 
                      id={`model-${model.id}`} 
                      checked={selectedModelIds.includes(model.id)}
                      onCheckedChange={() => toggleModel(model.id)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label
                        htmlFor={`model-${model.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {model.name}
                      </Label>
                      <p className="text-xs text-slate-500">
                        {model.type} • {model.taxRegime.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                ))}
                {models?.filter(m => m.isActive).length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-4">Nenhum modelo ativo disponível.</p>
                )}
              </div>
              <Button 
                className="w-full mt-6 bg-slate-900 hover:bg-slate-800" 
                size="lg"
                onClick={handleCalculate}
                disabled={calculate.isPending}
              >
                {calculate.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Calcular Cenários"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* RESULTS PANEL */}
        <div className="lg:col-span-8 space-y-6">
          {results.length > 0 && (
            <Card className="border-slate-200 shadow-sm p-6 bg-white">
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{fill: '#64748b'}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fill: '#64748b'}} axisLine={false} tickLine={false} tickFormatter={(value) => `R$${value/1000}k`} />
                    <Tooltip 
                      cursor={{fill: '#f1f5f9'}}
                      contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                    />
                    <Bar dataKey="liquido" name="Valor Líquido" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                    <Bar dataKey="custo" name="Custos Totais" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {results.map((item, idx) => (
              <ResultCard 
                key={idx} 
                model={item.model} 
                result={item.result} 
                onSave={() => handleSave(item.result, item.model.id)} 
              />
            ))}
            
            {results.length === 0 && !calculate.isPending && (
              <div className="col-span-full h-64 flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                <Calculator className="w-12 h-12 mb-4 opacity-20" />
                <p>Os resultados da simulação aparecerão aqui.</p>
              </div>
            )}
            
            {calculate.isPending && (
              <div className="col-span-full h-64 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

function ResultCard({ model, result, onSave }: { model: any, result: any, onSave: () => void }) {
  const taxes = result.breakdown.taxes.reduce((acc: number, curr: any) => acc + curr.value, 0);
  const tariffs = result.breakdown.tariffs.reduce((acc: number, curr: any) => acc + curr.value, 0);

  return (
    <Card className="border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
      <div className="h-2 bg-gradient-to-r from-emerald-500 to-teal-600" />
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-bold text-slate-900">{model.name}</CardTitle>
            <CardDescription>{model.type}</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500 uppercase font-semibold">Valor Líquido</div>
            <div className="text-2xl font-bold text-emerald-600 font-display">{formatCurrency(result.netValue)}</div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 flex-1">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-1 border-b border-slate-50">
            <span className="text-slate-600">Deságio Financeiro</span>
            <span className="font-medium text-slate-900 text-red-600">- {formatCurrency(result.discount)}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-50">
            <span className="text-slate-600">Tarifas</span>
            <span className="font-medium text-slate-900 text-red-600">- {formatCurrency(tariffs)}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-50">
            <span className="text-slate-600">Impostos</span>
            <span className="font-medium text-slate-900 text-red-600">- {formatCurrency(taxes)}</span>
          </div>
        </div>

        <div className="bg-slate-50 p-3 rounded-lg space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">CET Mensal</span>
            <span className="font-bold text-slate-900">{result.indicators.cetMonthly.toFixed(2)}%</span>
          </div>
           <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">Taxa Efetiva Total</span>
            <span className="font-bold text-slate-900">{(( (result.grossValue - result.netValue) / result.grossValue ) * 100).toFixed(2)}%</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="bg-slate-50 border-t border-slate-100 p-4">
        <Button variant="outline" size="sm" className="w-full" onClick={onSave}>
          <Save className="w-4 h-4 mr-2" />
          Salvar Simulação
        </Button>
      </CardFooter>
    </Card>
  );
}

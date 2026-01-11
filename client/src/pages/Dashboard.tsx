import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, TrendingUp, Calculator, Building2 } from "lucide-react";
import { useModelConfigs } from "@/hooks/use-models";
import { useSimulations } from "@/hooks/use-simulations";
import { isToday, subDays } from "date-fns";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const { data: models } = useModelConfigs();
  const { data: simulations } = useSimulations();

  const simulationsToday = simulations?.filter(s => isToday(new Date(s.createdAt!))).length || 0;
  const simulationsYesterday = simulations?.filter(s => {
    const date = new Date(s.createdAt!);
    const yesterday = subDays(new Date(), 1);
    return date.getDate() === yesterday.getDate() && 
           date.getMonth() === yesterday.getMonth() && 
           date.getFullYear() === yesterday.getFullYear();
  }).length || 0;

  const percentChange = simulationsYesterday === 0 
    ? (simulationsToday > 0 ? 100 : 0)
    : Math.round(((simulationsToday - simulationsYesterday) / simulationsYesterday) * 100);

  return (
    <Layout>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-display">Visão Geral</h1>
        <p className="text-slate-500">Bem-vindo ao sistema de cálculo de antecipação de recebíveis.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/20 border-0">
          <CardHeader className="pb-2">
            <CardDescription className="text-indigo-100">Modelos Ativos</CardDescription>
            <CardTitle className="text-4xl font-bold font-display">{models?.length || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-indigo-100 flex items-center gap-1">
              <Building2 className="w-4 h-4" />
              Configurações disponíveis
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Simulações Hoje</CardDescription>
            <CardTitle className="text-4xl font-bold font-display text-slate-900">{simulationsToday}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-slate-500 flex items-center gap-1">
              <TrendingUp className={cn("w-4 h-4", percentChange >= 0 ? "text-emerald-500" : "text-rose-500")} />
              <span className={cn("font-medium", percentChange >= 0 ? "text-emerald-600" : "text-rose-600")}>
                {percentChange >= 0 ? "+" : ""}{percentChange}%
              </span> vs. ontem
            </div>
          </CardContent>
        </Card>

        <Link href="/simulator">
          <Card className="bg-white border-slate-200 shadow-sm group hover:border-emerald-500/50 transition-colors cursor-pointer">
             <CardHeader className="pb-2">
              <CardDescription>Ação Rápida</CardDescription>
              <CardTitle className="text-2xl font-bold font-display text-emerald-600 group-hover:text-emerald-500 transition-colors">Nova Simulação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-slate-500">
                Calcular antecipação de título
              </div>
              <div className="mt-4 flex justify-end">
                 <div className="bg-emerald-50 text-emerald-600 p-2 rounded-full group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                   <ArrowRight className="w-5 h-5" />
                 </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="col-span-1 border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Modelos de Operação</CardTitle>
            <CardDescription>Configurações de cálculo disponíveis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {models?.slice(0, 3).map((model) => (
                <div key={model.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-50 border border-slate-100">
                  <div>
                    <h3 className="font-semibold text-slate-900">{model.name}</h3>
                    <p className="text-sm text-slate-500">{model.type} • {model.taxRegime.replace('_', ' ')}</p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/settings?modelId=${model.id}`}>Editar</Link>
                  </Button>
                </div>
              ))}
              {models?.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  Nenhum modelo configurado.
                </div>
              )}
              <Button className="w-full" variant="ghost" asChild>
                <Link href="/settings">Gerenciar Modelos</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <div className="rounded-xl bg-slate-900 p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
          <div className="relative z-10">
            <h2 className="text-2xl font-bold font-display mb-4">Pronto para começar?</h2>
            <p className="text-slate-400 mb-6 max-w-sm">
              Configure seus modelos de cálculo, defina as taxas e tarifas para começar a simular operações.
            </p>
            <Button asChild size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white border-0 shadow-lg shadow-emerald-500/25">
              <Link href="/simulator">
                <Calculator className="mr-2 w-5 h-5" />
                Iniciar Simulador
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

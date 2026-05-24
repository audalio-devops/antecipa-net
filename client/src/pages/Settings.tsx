import { Layout } from "@/components/Layout";
import { useModelConfigs, useCreateModelConfig, useUpdateModelConfig, useCreateTariff, useDeleteTariff, useUpdateTariff, useModelConfig } from "@/hooks/use-models";
import type { Tariff } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, Save, Pencil, Percent, AlertCircle, Settings as SettingsIcon, CircleCheck, CircleX } from "lucide-react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertModelConfigSchema, insertTariffSchema, MODEL_TYPES, TAX_REGIMES, TARIFF_CHARGE_TYPES, type InsertModelConfig } from "@shared/schema";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

export default function Settings() {
  const { data: models, isLoading } = useModelConfigs();
  const [selectedModelId, setSelectedModelId] = useState<number | null>(null);
  
  // Create Model Dialog State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  // Select first model on load if none selected
  useEffect(() => {
    if (models && models.length > 0 && !selectedModelId) {
      setSelectedModelId(models[0].id);
    }
  }, [models, selectedModelId]);

  return (
    <Layout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-display">Configurações</h1>
          <p className="text-slate-500">Gerencie modelos de cálculo, taxas e tributos.</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-slate-900 hover:bg-slate-800 text-white shadow-md">
              <Plus className="w-4 h-4 mr-2" />
              Novo Modelo
            </Button>
          </DialogTrigger>
          <CreateModelDialog onClose={() => setIsCreateOpen(false)} />
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-12rem)]">
        {/* Sidebar List of Models */}
        <Card className="lg:col-span-3 h-full border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <CardHeader className="bg-slate-50 border-b border-slate-100 py-4">
            <CardTitle className="text-sm font-medium uppercase tracking-wider text-slate-500">Modelos</CardTitle>
          </CardHeader>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {isLoading ? (
                <div className="p-4 text-center text-sm text-slate-400">Carregando...</div>
              ) : models?.map((model) => (
                <button
                  key={model.id}
                  onClick={() => setSelectedModelId(model.id)}
                  className={`w-full text-left p-3 rounded-lg text-sm font-medium transition-all ${
                    selectedModelId === model.id
                      ? "bg-slate-900 text-white shadow-md"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <div className="truncate">{model.name}</div>
                  <div className="flex items-center justify-between mt-1">
                    <span className={`text-xs ${selectedModelId === model.id ? "text-slate-400" : "text-slate-400"}`}>
                      {model.type}
                    </span>
                    <span className={`flex items-center gap-1 text-xs font-medium ${
                      model.isActive
                        ? selectedModelId === model.id ? "text-emerald-400" : "text-emerald-600"
                        : selectedModelId === model.id ? "text-red-400" : "text-red-500"
                    }`}>
                      {model.isActive
                        ? <><CircleCheck className="w-3 h-3" /> Ativo</>
                        : <><CircleX className="w-3 h-3" /> Inativo</>
                      }
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </Card>

        {/* Configuration Area */}
        <div className="lg:col-span-9 h-full">
          {selectedModelId ? (
            <ModelEditor modelId={selectedModelId} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              <SettingsIcon className="w-12 h-12 mb-4 opacity-20" />
              <p>Selecione um modelo para editar ou crie um novo.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

function CreateModelDialog({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const createModel = useCreateModelConfig();
  const form = useForm<InsertModelConfig>({
    resolver: zodResolver(insertModelConfigSchema),
    defaultValues: {
      name: "",
      type: "FACTORING",
      taxRegime: "LUCRO_REAL",
      discountRateMonthly: "3.0",
      adValoremRate: "0.5",
      floatingDays: 3,
      minFee: "50.00",
      // Defaults for taxes
      iofDailyRate: "0.0041",
      iofAdditionalRate: "0.38",
      pisRate: "0.65",
      cofinsRate: "3.00",
      issRate: "2.00",
      irRate: "1.50",
      csllRate: "1.00",
      enableIof: true,
      enablePisCofins: true,
      enableIss: true,
      enableIrCsll: true,
    }
  });

  const onSubmit = (data: InsertModelConfig) => {
    createModel.mutate(data, {
      onSuccess: () => {
        toast({ title: "Modelo criado com sucesso!" });
        onClose();
      },
      onError: (err) => {
        toast({ title: "Erro ao criar modelo", description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <DialogContent className="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>Criar Novo Modelo</DialogTitle>
        <DialogDescription>
          Configure os parâmetros iniciais do seu modelo de cálculo.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Nome do Modelo</Label>
          <Input id="name" {...form.register("name")} placeholder="Ex: FIDC Padrão" />
          {form.formState.errors.name && <span className="text-xs text-red-500">{form.formState.errors.name.message}</span>}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="type">Tipo</Label>
            <Select onValueChange={(val) => form.setValue("type", val)} defaultValue={form.getValues("type")}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                {MODEL_TYPES.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="taxRegime">Regime Tributário</Label>
            <Select onValueChange={(val) => form.setValue("taxRegime", val)} defaultValue={form.getValues("taxRegime")}>
              <SelectTrigger>
                <SelectValue placeholder="Regime" />
              </SelectTrigger>
              <SelectContent>
                {TAX_REGIMES.map(regime => (
                  <SelectItem key={regime} value={regime}>{regime.replace("_", " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={createModel.isPending}>
            {createModel.isPending ? "Criando..." : "Criar Modelo"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function ModelEditor({ modelId }: { modelId: number }) {
  const { data: modelDetails, isLoading } = useModelConfig(modelId);
  const updateModel = useUpdateModelConfig();
  const createTariff = useCreateTariff();
  const updateTariff = useUpdateTariff();
  const deleteTariff = useDeleteTariff();
  const { toast } = useToast();

  // Edit tariff state
  const [editingTariff, setEditingTariff] = useState<Tariff | null>(null);
  const [editName, setEditName] = useState("");
  const [editValue, setEditValue] = useState("");
  const [editType, setEditType] = useState<"FIXED" | "PERCENT">("FIXED");
  const [editChargeType, setEditChargeType] = useState<"UNICA" | "POR_CLIENTE" | "POR_TITULO">("UNICA");

  const openEditDialog = (tariff: Tariff) => {
    setEditingTariff(tariff);
    setEditName(tariff.name);
    setEditValue(String(tariff.value));
    setEditType(tariff.type as "FIXED" | "PERCENT");
    setEditChargeType((tariff.chargeType ?? "UNICA") as "UNICA" | "POR_CLIENTE" | "POR_TITULO");
  };

  const handleSaveTariff = () => {
    if (!editingTariff || !editName || !editValue) return;
    updateTariff.mutate({
      id: editingTariff.id,
      modelId,
      data: { name: editName, value: editValue, type: editType, chargeType: editChargeType }
    }, {
      onSuccess: () => {
        setEditingTariff(null);
        toast({ title: "Tarifa atualizada!" });
      },
      onError: () => toast({ title: "Erro ao atualizar tarifa", variant: "destructive" })
    });
  };
  
  // Local state for the form to handle immediate feedback before submit
  const form = useForm<InsertModelConfig>({
    resolver: zodResolver(insertModelConfigSchema),
  });

  // Sync form with loaded data
  useEffect(() => {
    if (modelDetails) {
      form.reset(modelDetails);
    }
  }, [modelDetails, form]);

  const onSave = (data: InsertModelConfig) => {
    updateModel.mutate({ id: modelId, data }, {
      onSuccess: () => toast({ title: "Configurações salvas!" }),
      onError: () => toast({ title: "Erro ao salvar", variant: "destructive" })
    });
  };

  // Tariff handling
  const [newTariffName, setNewTariffName] = useState("");
  const [newTariffValue, setNewTariffValue] = useState("");
  const [newTariffType, setNewTariffType] = useState<"FIXED" | "PERCENT">("FIXED");
  const [newTariffChargeType, setNewTariffChargeType] = useState<"UNICA" | "POR_CLIENTE" | "POR_TITULO">("UNICA");

  const handleAddTariff = () => {
    if (!newTariffName || !newTariffValue) return;
    createTariff.mutate({
      modelId,
      data: {
        name: newTariffName,
        value: newTariffValue,
        type: newTariffType,
        chargeType: newTariffChargeType,
        isActive: true
      }
    }, {
      onSuccess: () => {
        setNewTariffName("");
        setNewTariffValue("");
        setNewTariffChargeType("UNICA");
        toast({ title: "Tarifa adicionada!" });
      }
    });
  };

  if (isLoading || !modelDetails) return <div className="p-8 text-center">Carregando detalhes...</div>;

  return (
    <Card className="h-full border-slate-200 shadow-sm flex flex-col">
      <CardHeader className="border-b border-slate-100 bg-slate-50/50">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl font-display text-slate-900">{modelDetails.name}</CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-xs font-semibold">{modelDetails.type}</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-xs font-semibold">{modelDetails.taxRegime.replace('_', ' ')}</span>
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50">
              <Switch
                data-testid="switch-model-active"
                checked={form.watch("isActive") ?? true}
                onCheckedChange={(checked) => form.setValue("isActive", checked)}
              />
              <span className={`text-sm font-medium flex items-center gap-1 ${form.watch("isActive") ? "text-emerald-600" : "text-red-500"}`}>
                {form.watch("isActive")
                  ? <><CircleCheck className="w-4 h-4" /> Ativo</>
                  : <><CircleX className="w-4 h-4" /> Inativo</>
                }
              </span>
            </div>
            <Button onClick={form.handleSubmit(onSave)} disabled={updateModel.isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Save className="w-4 h-4 mr-2" />
              {updateModel.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <div className="flex-1 overflow-hidden flex flex-col">
        <Tabs defaultValue="rates" className="h-full flex flex-col">
          <div className="px-6 pt-4">
            <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
              <TabsTrigger value="rates">Taxas Financeiras</TabsTrigger>
              <TabsTrigger value="tariffs">Tarifas</TabsTrigger>
              <TabsTrigger value="taxes">Impostos</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto p-6 bg-white">
            <TabsContent value="rates" className="mt-0 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border border-slate-200 shadow-none">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium">Fator de Compra</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Taxa Mensal (%)</Label>
                      <div className="relative">
                        <Input {...form.register("discountRateMonthly")} className="pl-9" />
                        <Percent className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      </div>
                      <p className="text-xs text-slate-500">Taxa base de juros mensal</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Ad Valorem (%)</Label>
                      <div className="relative">
                        <Input {...form.register("adValoremRate")} className="pl-9" />
                        <Percent className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      </div>
                      <p className="text-xs text-slate-500">Taxa administrativa sobre o valor de face</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-slate-200 shadow-none">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium">Parâmetros Gerais</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Float (Dias)</Label>
                      <Input type="number" {...form.register("floatingDays", { valueAsNumber: true })} />
                      <p className="text-xs text-slate-500">Dias adicionais para liquidação</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Tarifa Mínima (R$)</Label>
                      <Input {...form.register("minFee")} />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="tariffs" className="mt-0 space-y-6">
               <div className="grid grid-cols-1 gap-3 mb-6 p-4 bg-slate-50 rounded-lg border border-slate-100">
                 <div className="grid grid-cols-2 gap-3">
                   <div className="space-y-2">
                     <Label>Nome da Tarifa</Label>
                     <Input placeholder="Ex: TED" value={newTariffName} onChange={e => setNewTariffName(e.target.value)} />
                   </div>
                   <div className="space-y-2">
                     <Label>Tipo de Cobrança</Label>
                     <Select value={newTariffChargeType} onValueChange={(val: any) => setNewTariffChargeType(val)}>
                       <SelectTrigger>
                         <SelectValue />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="UNICA">Única</SelectItem>
                         <SelectItem value="POR_CLIENTE">Por Cliente</SelectItem>
                         <SelectItem value="POR_TITULO">Por Título</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>
                 </div>
                 <div className="grid grid-cols-3 gap-3 items-end">
                   <div className="space-y-2">
                     <Label>Tipo de Cálculo</Label>
                     <Select value={newTariffType} onValueChange={(val: any) => setNewTariffType(val)}>
                       <SelectTrigger>
                         <SelectValue />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="FIXED">Fixo (R$)</SelectItem>
                         <SelectItem value="PERCENT">Percentual (%)</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>
                   <div className="space-y-2">
                     <Label>Valor</Label>
                     <Input placeholder="0.00" value={newTariffValue} onChange={e => setNewTariffValue(e.target.value)} />
                   </div>
                   <Button onClick={handleAddTariff} disabled={createTariff.isPending} className="w-full">
                     <Plus className="w-4 h-4 mr-2" />
                     Adicionar
                   </Button>
                 </div>
               </div>

               <div className="space-y-2">
                 {modelDetails.tariffs?.map(tariff => {
                   const chargeLabels: Record<string, string> = {
                     UNICA: "Única",
                     POR_CLIENTE: "Por Cliente",
                     POR_TITULO: "Por Título",
                   };
                   const chargeColors: Record<string, string> = {
                     UNICA: "bg-purple-50 text-purple-700 border-purple-200",
                     POR_CLIENTE: "bg-blue-50 text-blue-700 border-blue-200",
                     POR_TITULO: "bg-amber-50 text-amber-700 border-amber-200",
                   };
                   return (
                     <div key={tariff.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg hover:shadow-sm transition-shadow">
                       <div className="flex items-center gap-3">
                         <div className="p-2 bg-slate-100 rounded-full">
                           <AlertCircle className="w-4 h-4 text-slate-500" />
                         </div>
                         <div>
                           <p className="font-medium text-slate-900">{tariff.name}</p>
                           <p className="text-xs text-slate-500">
                             {tariff.type === 'FIXED' ? `R$ ${Number(tariff.value).toFixed(2)}` : `${tariff.value}%`}
                             {" · "}
                             <span className={`inline-block px-1.5 py-0.5 rounded border text-xs font-medium ${chargeColors[tariff.chargeType ?? "UNICA"]}`}>
                               {chargeLabels[tariff.chargeType ?? "UNICA"] ?? "Única"}
                             </span>
                           </p>
                         </div>
                       </div>
                       <div className="flex items-center gap-1">
                         <Button variant="ghost" size="icon" onClick={() => openEditDialog(tariff)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                           <Pencil className="w-4 h-4" />
                         </Button>
                         <Button variant="ghost" size="icon" onClick={() => deleteTariff.mutate({ id: tariff.id, modelId })} className="text-red-400 hover:text-red-500 hover:bg-red-50">
                           <Trash2 className="w-4 h-4" />
                         </Button>
                       </div>
                     </div>
                   );
                 })}
                 {(!modelDetails.tariffs || modelDetails.tariffs.length === 0) && (
                   <div className="text-center py-8 text-slate-400">Nenhuma tarifa cadastrada.</div>
                 )}
               </div>
            </TabsContent>

            <TabsContent value="taxes" className="mt-0 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border border-slate-200 shadow-none">
                  <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-base font-medium">IOF</CardTitle>
                    <Switch 
                      checked={form.watch("enableIof")}
                      onCheckedChange={(checked) => form.setValue("enableIof", checked)}
                    />
                  </CardHeader>
                  <CardContent className="space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                         <Label>Diário (%)</Label>
                         <Input {...form.register("iofDailyRate")} disabled={!form.watch("enableIof")} />
                       </div>
                       <div className="space-y-2">
                         <Label>Adicional (%)</Label>
                         <Input {...form.register("iofAdditionalRate")} disabled={!form.watch("enableIof")} />
                       </div>
                     </div>
                  </CardContent>
                </Card>

                <Card className="border border-slate-200 shadow-none">
                  <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-base font-medium">PIS / COFINS</CardTitle>
                    <Switch 
                      checked={form.watch("enablePisCofins")}
                      onCheckedChange={(checked) => form.setValue("enablePisCofins", checked)}
                    />
                  </CardHeader>
                  <CardContent className="space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                         <Label>PIS (%)</Label>
                         <Input {...form.register("pisRate")} disabled={!form.watch("enablePisCofins")} />
                       </div>
                       <div className="space-y-2">
                         <Label>COFINS (%)</Label>
                         <Input {...form.register("cofinsRate")} disabled={!form.watch("enablePisCofins")} />
                       </div>
                     </div>
                  </CardContent>
                </Card>

                <Card className="border border-slate-200 shadow-none">
                  <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-base font-medium">ISS</CardTitle>
                    <Switch 
                      checked={form.watch("enableIss")}
                      onCheckedChange={(checked) => form.setValue("enableIss", checked)}
                    />
                  </CardHeader>
                  <CardContent className="space-y-4">
                     <div className="space-y-2">
                       <Label>ISS (%)</Label>
                       <Input {...form.register("issRate")} disabled={!form.watch("enableIss")} />
                     </div>
                  </CardContent>
                </Card>

                <Card className="border border-slate-200 shadow-none">
                  <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-base font-medium">IR / CSLL</CardTitle>
                    <Switch 
                      checked={form.watch("enableIrCsll")}
                      onCheckedChange={(checked) => form.setValue("enableIrCsll", checked)}
                    />
                  </CardHeader>
                  <CardContent className="space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                         <Label>IR (%)</Label>
                         <Input {...form.register("irRate")} disabled={!form.watch("enableIrCsll")} />
                       </div>
                       <div className="space-y-2">
                         <Label>CSLL (%)</Label>
                         <Input {...form.register("csllRate")} disabled={!form.watch("enableIrCsll")} />
                       </div>
                     </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Edit Tariff Dialog */}
      <Dialog open={!!editingTariff} onOpenChange={(open) => { if (!open) setEditingTariff(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Alterar Tarifa</DialogTitle>
            <DialogDescription>Edite os campos da tarifa e clique em Salvar.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome da Tarifa</Label>
              <Input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Ex: TED" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Tipo de Cálculo</Label>
                <Select value={editType} onValueChange={(val: any) => setEditType(val)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIXED">Fixo (R$)</SelectItem>
                    <SelectItem value="PERCENT">Percentual (%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Valor</Label>
                <Input value={editValue} onChange={e => setEditValue(e.target.value)} placeholder="0.00" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tipo de Cobrança</Label>
              <Select value={editChargeType} onValueChange={(val: any) => setEditChargeType(val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UNICA">Única</SelectItem>
                  <SelectItem value="POR_CLIENTE">Por Cliente</SelectItem>
                  <SelectItem value="POR_TITULO">Por Título</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTariff(null)}>Cancelar</Button>
            <Button onClick={handleSaveTariff} disabled={updateTariff.isPending}>
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

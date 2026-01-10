import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { differenceInDays, parseISO } from "date-fns";
import { 
  type CalculateInput, 
  type CalculationResult, 
  type ModelConfig, 
  type Tariff 
} from "@shared/schema";

// === CALCULATION ENGINE ===
function calculateReceivable(input: CalculateInput, config: ModelConfig, tariffs: Tariff[]): CalculationResult {
  const { titleValue, emissionDate, dueDate } = input;
  
  // 1. Calculate Days (Prazo)
  const days = differenceInDays(parseISO(dueDate), parseISO(emissionDate));
  const effectiveDays = Math.max(days + config.floatingDays, 1); // Apply floating
  
  // 2. Financial Discount (Juros)
  // Simple: Value * Rate * Days / 30
  // Compound: Value * ((1 + Rate)^(Days/30) - 1)
  // Converting Monthly Rate to Daily: (1 + Monthly)^ (1/30) - 1
  
  const monthlyRateDecimal = Number(config.discountRateMonthly) / 100;
  let discountFactor = 0;
  
  if (config.calculationType === "COMPOUND") {
    const dailyRate = Math.pow(1 + monthlyRateDecimal, 1 / 30) - 1;
    discountFactor = Math.pow(1 + dailyRate, effectiveDays) - 1;
  } else {
    // Simple
    discountFactor = (monthlyRateDecimal / 30) * effectiveDays;
  }
  
  const financialDiscount = titleValue * discountFactor;
  
  // 3. Ad Valorem (Fator de compra) - usually flat % on face value
  const adValorem = titleValue * (Number(config.adValoremRate) / 100);
  
  const totalDiscount = financialDiscount + adValorem;
  
  // 4. Tariffs
  let tariffsTotal = 0;
  const tariffsBreakdown: { name: string; value: number }[] = [];
  
  for (const tariff of tariffs) {
    if (!tariff.isActive) continue;
    
    let value = 0;
    if (tariff.type === "FIXED") {
      value = Number(tariff.value);
    } else {
      value = titleValue * (Number(tariff.value) / 100);
    }
    
    // Min/Max constraints
    if (tariff.minValue && value < Number(tariff.minValue)) value = Number(tariff.minValue);
    if (tariff.maxValue && value > Number(tariff.maxValue)) value = Number(tariff.maxValue);
    
    tariffsTotal += value;
    tariffsBreakdown.push({ name: tariff.name, value });
  }
  
  // 5. Taxes (IOF, PIS, COFINS, ISS, IR, CSLL)
  let taxesTotal = 0;
  const taxesBreakdown: { name: string; value: number }[] = [];
  
  // IOF (Only if enabled)
  if (config.enableIof) {
    // IOF Daily limited to 365 days usually, but simple logic here
    const iofDaily = titleValue * (Number(config.iofDailyRate) / 100) * effectiveDays;
    const iofAdditional = titleValue * (Number(config.iofAdditionalRate) / 100);
    const iofTotal = iofDaily + iofAdditional;
    
    taxesTotal += iofTotal;
    taxesBreakdown.push({ name: "IOF", value: iofTotal });
  }
  
  // PIS/COFINS (Usually on the revenue/discount, not face value, but simplified here as per "Base de cálculo configurável" - assuming on Revenue (Discount + AdValorem))
  const revenueBase = totalDiscount; // Revenue for the factor is the discount
  
  if (config.enablePisCofins) {
    const pis = revenueBase * (Number(config.pisRate) / 100);
    const cofins = revenueBase * (Number(config.cofinsRate) / 100);
    
    taxesTotal += pis + cofins;
    taxesBreakdown.push({ name: "PIS/COFINS", value: pis + cofins });
  }
  
  if (config.enableIss) {
    const iss = revenueBase * (Number(config.issRate) / 100);
    taxesTotal += iss;
    taxesBreakdown.push({ name: "ISS", value: iss });
  }
  
  if (config.enableIrCsll) {
    const ir = revenueBase * (Number(config.irRate) / 100);
    const csll = revenueBase * (Number(config.csllRate) / 100);
    
    taxesTotal += ir + csll;
    taxesBreakdown.push({ name: "IR/CSLL", value: ir + csll });
  }

  // 6. Net Value
  const totalCost = totalDiscount + tariffsTotal + taxesTotal;
  const netValue = titleValue - totalCost;
  
  // 7. Indicators
  const cetValue = totalCost; // Total Cost
  const cetPercent = (cetValue / netValue) * 100; // Over net value
  const cetMonthly = (Math.pow(1 + (cetPercent / 100), 30 / effectiveDays) - 1) * 100;
  const cetYearly = (Math.pow(1 + (cetPercent / 100), 365 / effectiveDays) - 1) * 100;

  return {
    days: effectiveDays,
    grossValue: titleValue,
    netValue,
    discount: totalDiscount,
    tariffsTotal,
    taxesTotal,
    breakdown: {
      tariffs: tariffsBreakdown,
      taxes: taxesBreakdown
    },
    indicators: {
      cetMonthly,
      cetYearly,
      factorRate: (totalDiscount / titleValue) * 100
    }
  };
}


export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // === API ROUTES ===
  
  // Model Configs
  app.get(api.modelConfigs.list.path, async (req, res) => {
    const configs = await storage.getModelConfigs();
    res.json(configs);
  });

  app.get(api.modelConfigs.get.path, async (req, res) => {
    const config = await storage.getModelConfig(Number(req.params.id));
    if (!config) return res.status(404).json({ message: "Config not found" });
    res.json(config);
  });

  app.post(api.modelConfigs.create.path, async (req, res) => {
    try {
      const input = api.modelConfigs.create.input.parse(req.body);
      const config = await storage.createModelConfig(input);
      res.status(201).json(config);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  });

  app.put(api.modelConfigs.update.path, async (req, res) => {
    const config = await storage.updateModelConfig(Number(req.params.id), req.body);
    res.json(config);
  });

  // Tariffs
  app.post(api.tariffs.create.path, async (req, res) => {
    const input = api.tariffs.create.input.parse(req.body);
    const tariff = await storage.createTariff({
      ...input,
      modelConfigId: Number(req.params.modelId)
    });
    res.status(201).json(tariff);
  });

  app.delete(api.tariffs.delete.path, async (req, res) => {
    await storage.deleteTariff(Number(req.params.id));
    res.sendStatus(204);
  });

  // Calculator
  app.post(api.calculator.calculate.path, async (req, res) => {
    const input = api.calculator.calculate.input.parse(req.body);
    
    const config = await storage.getModelConfig(input.modelConfigId);
    if (!config) return res.status(404).json({ message: "Model config not found" });
    
    const result = calculateReceivable(input, config, config.tariffs);
    
    res.json({ result, model: config });
  });

  app.post(api.calculator.saveSimulation.path, async (req, res) => {
    const { modelConfigId, result, titleData } = req.body;
    
    const simulation = await storage.createSimulation({
      modelConfigId,
      titleValue: titleData.value,
      emissionDate: new Date(titleData.emissionDate),
      dueDate: new Date(titleData.dueDate),
      days: result.days,
      netValue: result.netValue.toString(),
      discountValue: result.discount.toString(),
      totalTariffs: result.tariffsTotal.toString(),
      totalTaxes: result.taxesTotal.toString(),
      cetMonthly: result.indicators.cetMonthly.toString(),
      cetYearly: result.indicators.cetYearly.toString()
    });
    
    res.status(201).json(simulation);
  });

  // Seed Data (if empty)
  const configs = await storage.getModelConfigs();
  if (configs.length === 0) {
    console.log("Seeding initial data...");
    
    // 1. Factoring Standard
    const factoring = await storage.createModelConfig({
      name: "Factoring Padrão",
      type: "FACTORING",
      taxRegime: "LUCRO_REAL",
      discountRateMonthly: "3.5",
      adValoremRate: "0.5",
      enableIof: true,
      enablePisCofins: true,
    });
    
    await storage.createTariff({ modelConfigId: factoring.id, name: "TED", type: "FIXED", value: "15.00" });
    await storage.createTariff({ modelConfigId: factoring.id, name: "Boleto", type: "FIXED", value: "4.50" });

    // 2. Securitizadora
    const securitizadora = await storage.createModelConfig({
      name: "Securitizadora",
      type: "SECURITIZADORA",
      taxRegime: "LUCRO_PRESUMIDO",
      discountRateMonthly: "2.8",
      adValoremRate: "0.3",
      enableIof: false, // Often exempt or different structure
      enablePisCofins: true,
    });
    
    await storage.createTariff({ modelConfigId: securitizadora.id, name: "Emissão", type: "PERCENT", value: "0.1" });

    // 3. FIDC
    const fidc = await storage.createModelConfig({
      name: "Fundo de Investimento (FIDC)",
      type: "FIDC",
      taxRegime: "LUCRO_REAL",
      discountRateMonthly: "2.2",
      adValoremRate: "0.0",
      enableIof: false,
      enablePisCofins: false, // Exempt from most operational taxes
      enableIss: false
    });
    
    await storage.createTariff({ modelConfigId: fidc.id, name: "Taxa de Gestão", type: "PERCENT", value: "0.5" });
  }

  return httpServer;
}

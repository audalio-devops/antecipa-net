import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { differenceInDays, parseISO } from "date-fns";
import bcrypt from "bcryptjs";
import { 
  type CalculateInput, 
  type CalculationResult, 
  type ModelConfig, 
  type Tariff 
} from "@shared/schema";

// === AUTH MIDDLEWARE ===
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Não autenticado" });
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Não autenticado" });
  }
  if (req.session.userRole !== "ADMIN") {
    return res.status(403).json({ message: "Acesso negado. Apenas administradores." });
  }
  next();
}

// === CALCULATION ENGINE ===
function calculateReceivable(input: CalculateInput, config: ModelConfig, tariffs: Tariff[]): CalculationResult {
  const { titleValue, emissionDate, dueDate } = input;
  
  const days = differenceInDays(parseISO(dueDate), parseISO(emissionDate));
  const effectiveDays = Math.max(days + config.floatingDays, 1);
  
  const monthlyRateDecimal = Number(config.discountRateMonthly) / 100;
  let discountFactor = 0;
  
  if (config.calculationType === "COMPOUND") {
    const dailyRate = Math.pow(1 + monthlyRateDecimal, 1 / 30) - 1;
    discountFactor = Math.pow(1 + dailyRate, effectiveDays) - 1;
  } else {
    discountFactor = (monthlyRateDecimal / 30) * effectiveDays;
  }
  
  const financialDiscount = titleValue * discountFactor;
  const adValorem = titleValue * (Number(config.adValoremRate) / 100);
  const totalDiscount = financialDiscount + adValorem;
  
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
    
    if (tariff.minValue && value < Number(tariff.minValue)) value = Number(tariff.minValue);
    if (tariff.maxValue && value > Number(tariff.maxValue)) value = Number(tariff.maxValue);
    
    tariffsTotal += value;
    tariffsBreakdown.push({ name: tariff.name, value });
  }
  
  let taxesTotal = 0;
  const taxesBreakdown: { name: string; value: number }[] = [];
  
  if (config.enableIof) {
    const iofDaily = titleValue * (Number(config.iofDailyRate) / 100) * effectiveDays;
    const iofAdditional = titleValue * (Number(config.iofAdditionalRate) / 100);
    const iofTotal = iofDaily + iofAdditional;
    taxesTotal += iofTotal;
    taxesBreakdown.push({ name: "IOF", value: iofTotal });
  }
  
  const revenueBase = totalDiscount;
  
  if (config.enablePisCofins) {
    const pis = revenueBase * (parseFloat(config.pisRate.toString()) / 100);
    const cofins = revenueBase * (parseFloat(config.cofinsRate.toString()) / 100);
    taxesTotal += pis + cofins;
    taxesBreakdown.push({ name: "PIS/COFINS", value: pis + cofins });
  }
  
  if (config.enableIss) {
    const iss = revenueBase * (parseFloat(config.issRate.toString()) / 100);
    taxesTotal += iss;
    taxesBreakdown.push({ name: "ISS", value: iss });
  }
  
  if (config.enableIrCsll) {
    const ir = revenueBase * (parseFloat(config.irRate.toString()) / 100);
    const csll = revenueBase * (parseFloat(config.csllRate.toString()) / 100);
    taxesTotal += ir + csll;
    taxesBreakdown.push({ name: "IR/CSLL", value: ir + csll });
  }

  const totalCost = totalDiscount + tariffsTotal + taxesTotal;
  const netValue = titleValue - totalCost;
  
  const cetValue = totalCost;
  const cetPercent = (cetValue / netValue) * 100;
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
  
  // === AUTH ROUTES ===

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = z.object({
        username: z.string().min(1),
        password: z.string().min(1),
      }).parse(req.body);

      const user = await storage.getUserByUsername(username);
      if (!user || !user.isActive) {
        return res.status(401).json({ message: "Usuário ou senha incorretos" });
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ message: "Usuário ou senha incorretos" });
      }

      req.session.userId = user.id;
      req.session.userRole = user.role;

      const { password: _, ...safeUser } = user;

      req.session.save((err) => {
        if (err) {
          return res.status(500).json({ message: "Erro ao iniciar sessão" });
        }
        res.json(safeUser);
      });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: "Dados inválidos" });
      throw err;
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ ok: true });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Não autenticado" });
    }
    const user = await storage.getUserById(req.session.userId);
    if (!user) {
      req.session.destroy(() => {});
      return res.status(401).json({ message: "Usuário não encontrado" });
    }
    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  });

  // === USER MANAGEMENT (Admin only) ===

  app.get("/api/users", requireAdmin, async (req, res) => {
    const allUsers = await storage.getUsers();
    res.json(allUsers);
  });

  app.post("/api/users", requireAdmin, async (req, res) => {
    try {
      const input = z.object({
        username: z.string().min(3),
        password: z.string().min(6),
        name: z.string().min(1),
        role: z.enum(["ADMIN", "OPERATOR"]),
        isActive: z.boolean().optional().default(true),
      }).parse(req.body);

      const existing = await storage.getUserByUsername(input.username);
      if (existing) {
        return res.status(400).json({ message: "Nome de usuário já existe" });
      }

      const hashedPassword = await bcrypt.hash(input.password, 10);
      const user = await storage.createUser({ ...input, password: hashedPassword });
      const { password: _, ...safeUser } = user;
      res.status(201).json(safeUser);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  });

  app.put("/api/users/:id", requireAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const input = z.object({
        name: z.string().min(1).optional(),
        role: z.enum(["ADMIN", "OPERATOR"]).optional(),
        isActive: z.boolean().optional(),
        password: z.string().min(6).optional(),
      }).parse(req.body);

      const updateData: any = { ...input };
      if (input.password) {
        updateData.password = await bcrypt.hash(input.password, 10);
      }

      const user = await storage.updateUser(id, updateData);
      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  });

  // === API ROUTES (protected) ===
  
  // Model Configs
  app.get(api.modelConfigs.list.path, requireAuth, async (req, res) => {
    const configs = await storage.getModelConfigs();
    res.json(configs);
  });

  app.get(api.modelConfigs.get.path, requireAuth, async (req, res) => {
    const config = await storage.getModelConfig(Number(req.params.id));
    if (!config) return res.status(404).json({ message: "Config not found" });
    res.json(config);
  });

  app.post(api.modelConfigs.create.path, requireAdmin, async (req, res) => {
    try {
      const input = api.modelConfigs.create.input.parse(req.body);
      const config = await storage.createModelConfig(input);
      res.status(201).json(config);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  });

  app.put(api.modelConfigs.update.path, requireAdmin, async (req, res) => {
    const config = await storage.updateModelConfig(Number(req.params.id), req.body);
    res.json(config);
  });

  // Tariffs
  app.post(api.tariffs.create.path, requireAdmin, async (req, res) => {
    const input = api.tariffs.create.input.parse(req.body);
    const tariff = await storage.createTariff({
      ...input,
      modelConfigId: Number(req.params.modelId)
    });
    res.status(201).json(tariff);
  });

  app.delete(api.tariffs.delete.path, requireAdmin, async (req, res) => {
    await storage.deleteTariff(Number(req.params.id));
    res.sendStatus(204);
  });

  // Calculator
  app.post(api.calculator.calculate.path, requireAuth, async (req, res) => {
    const input = api.calculator.calculate.input.parse(req.body);
    
    const config = await storage.getModelConfig(input.modelConfigId);
    if (!config) return res.status(404).json({ message: "Model config not found" });
    
    const result = calculateReceivable(input, config, config.tariffs);
    
    res.json({ result, model: config });
  });

  app.post(api.calculator.saveSimulation.path, requireAuth, async (req, res) => {
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

  app.get(api.calculator.listSimulations.path, requireAuth, async (req, res) => {
    const sims = await storage.getSimulations();
    res.json(sims);
  });

  // Seed Data (if empty)
  const configs = await storage.getModelConfigs();
  if (configs.length === 0) {
    console.log("Seeding initial model data...");
    
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

    const securitizadora = await storage.createModelConfig({
      name: "Securitizadora",
      type: "SECURITIZADORA",
      taxRegime: "LUCRO_PRESUMIDO",
      discountRateMonthly: "2.8",
      adValoremRate: "0.3",
      enableIof: false,
      enablePisCofins: true,
    });
    
    await storage.createTariff({ modelConfigId: securitizadora.id, name: "Emissão", type: "PERCENT", value: "0.1" });

    const fidc = await storage.createModelConfig({
      name: "Fundo de Investimento (FIDC)",
      type: "FIDC",
      taxRegime: "LUCRO_REAL",
      discountRateMonthly: "2.2",
      adValoremRate: "0.0",
      enableIof: false,
      enablePisCofins: false,
      enableIss: false
    });
    
    await storage.createTariff({ modelConfigId: fidc.id, name: "Taxa de Gestão", type: "PERCENT", value: "0.5" });
  }

  // Seed Admin user (if no users exist)
  const existingUsers = await storage.getUsers();
  if (existingUsers.length === 0) {
    console.log("Seeding admin user...");
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await storage.createUser({
      username: "admin",
      password: hashedPassword,
      name: "Administrador",
      role: "ADMIN",
      isActive: true,
    });
    console.log("Admin user created: admin / admin123");
  }

  return httpServer;
}

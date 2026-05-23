import { pgTable, text, serial, integer, boolean, numeric, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// === ENUMS ===
export const MODEL_TYPES = ["FACTORING", "SECURITIZADORA", "FIDC"] as const;
export const TAX_REGIMES = ["SIMPLES", "LUCRO_PRESUMIDO", "LUCRO_REAL"] as const;
export const CALCULATION_TYPES = ["SIMPLE", "COMPOUND"] as const;
export const USER_ROLES = ["ADMIN", "OPERATOR"] as const;

// === TABLES ===

// Users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("OPERATOR"), // ADMIN or OPERATOR
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Configuration for each Operation Model (The "Scenario")
export const modelConfigs = pgTable("model_configs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // e.g., "Factoring Padrão", "FIDC High Yield"
  type: text("type").notNull(), // FACTORING, SECURITIZADORA, FIDC
  taxRegime: text("tax_regime").default("LUCRO_REAL").notNull(),
  
  // Financial Rates
  discountRateMonthly: numeric("discount_rate_monthly").notNull().default("3.0"),
  adValoremRate: numeric("ad_valorem_rate").notNull().default("0.5"), // Fator de compra
  floatingDays: integer("floating_days").notNull().default(3),
  minFee: numeric("min_fee").notNull().default("50.00"),
  
  // Calculation Settings
  calculationType: text("calculation_type").default("COMPOUND").notNull(),
  applyProRata: boolean("apply_pro_rata").default(true).notNull(),

  // Tax Settings (Rates in %)
  iofDailyRate: numeric("iof_daily_rate").notNull().default("0.0041"),
  iofAdditionalRate: numeric("iof_additional_rate").notNull().default("0.38"),
  pisRate: numeric("pis_rate").notNull().default("0.65"),
  cofinsRate: numeric("cofins_rate").notNull().default("3.00"),
  issRate: numeric("iss_rate").notNull().default("2.00"),
  irRate: numeric("ir_rate").notNull().default("1.50"),
  csllRate: numeric("csll_rate").notNull().default("1.00"),

  // Toggles for Taxes
  enableIof: boolean("enable_iof").default(true).notNull(),
  enablePisCofins: boolean("enable_pis_cofins").default(true).notNull(),
  enableIss: boolean("enable_iss").default(true).notNull(),
  enableIrCsll: boolean("enable_ir_csll").default(true).notNull(),

  // Status
  isActive: boolean("is_active").default(true).notNull(),

  createdAt: timestamp("created_at").defaultNow(),
});

// Configurable Tariffs for each model
export const tariffs = pgTable("tariffs", {
  id: serial("id").primaryKey(),
  modelConfigId: integer("model_config_id").references(() => modelConfigs.id).notNull(),
  name: text("name").notNull(), // e.g., "Tarifa de Boleto", "TED"
  type: text("type").notNull(), // FIXED, PERCENT
  value: numeric("value").notNull(),
  minValue: numeric("min_value"),
  maxValue: numeric("max_value"),
  isActive: boolean("is_active").default(true).notNull(),
});

// Saved Simulations
export const simulations = pgTable("simulations", {
  id: serial("id").primaryKey(),
  titleValue: numeric("title_value").notNull(),
  emissionDate: timestamp("emission_date").notNull(),
  dueDate: timestamp("due_date").notNull(),
  days: integer("days").notNull(),
  
  // The snapshot of results
  netValue: numeric("net_value").notNull(),
  discountValue: numeric("discount_value").notNull(),
  totalTariffs: numeric("total_tariffs").notNull(),
  totalTaxes: numeric("total_taxes").notNull(),
  cetMonthly: numeric("cet_monthly").notNull(),
  cetYearly: numeric("cet_yearly").notNull(),
  
  modelConfigId: integer("model_config_id").references(() => modelConfigs.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// === RELATIONS ===
export const modelConfigsRelations = relations(modelConfigs, ({ many }) => ({
  tariffs: many(tariffs),
  simulations: many(simulations),
}));

export const tariffsRelations = relations(tariffs, ({ one }) => ({
  modelConfig: one(modelConfigs, {
    fields: [tariffs.modelConfigId],
    references: [modelConfigs.id],
  }),
}));

export const simulationsRelations = relations(simulations, ({ one }) => ({
  modelConfig: one(modelConfigs, {
    fields: [simulations.modelConfigId],
    references: [modelConfigs.id],
  }),
}));

// === ZOD SCHEMAS ===
export const insertModelConfigSchema = createInsertSchema(modelConfigs).omit({ id: true, createdAt: true });
export const insertTariffSchema = createInsertSchema(tariffs).omit({ id: true });
export const insertSimulationSchema = createInsertSchema(simulations).omit({ id: true, createdAt: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });

export type ModelConfig = typeof modelConfigs.$inferSelect;
export type InsertModelConfig = z.infer<typeof insertModelConfigSchema>;
export type Tariff = typeof tariffs.$inferSelect;
export type InsertTariff = z.infer<typeof insertTariffSchema>;
export type Simulation = typeof simulations.$inferSelect;
export type InsertSimulation = z.infer<typeof insertSimulationSchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type SafeUser = Omit<User, "password">;

// Input for the Calculation Engine (not just DB insert)
export const calculateInputSchema = z.object({
  titleValue: z.number().positive(),
  emissionDate: z.string(), // ISO date
  dueDate: z.string(), // ISO date
  modelConfigId: z.number(),
});

export type CalculateInput = z.infer<typeof calculateInputSchema>;

export interface CalculationResult {
  days: number;
  grossValue: number;
  netValue: number;
  discount: number;
  tariffsTotal: number;
  taxesTotal: number;
  breakdown: {
    tariffs: { name: string; value: number }[];
    taxes: { name: string; value: number }[];
  };
  indicators: {
    cetMonthly: number;
    cetYearly: number;
    factorRate: number; // ad valorem + discount converted
  };
}

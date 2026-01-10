import { 
  modelConfigs, tariffs, simulations,
  type InsertModelConfig, type InsertTariff, type InsertSimulation,
  type ModelConfig, type Tariff, type Simulation
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Model Configs
  getModelConfigs(): Promise<ModelConfig[]>;
  getModelConfig(id: number): Promise<(ModelConfig & { tariffs: Tariff[] }) | undefined>;
  createModelConfig(config: InsertModelConfig): Promise<ModelConfig>;
  updateModelConfig(id: number, config: Partial<InsertModelConfig>): Promise<ModelConfig>;
  
  // Tariffs
  getTariffsByModelId(modelId: number): Promise<Tariff[]>;
  createTariff(tariff: InsertTariff): Promise<Tariff>;
  deleteTariff(id: number): Promise<void>;

  // Simulations
  createSimulation(simulation: InsertSimulation): Promise<Simulation>;
  getSimulations(): Promise<Simulation[]>;
}

export class DatabaseStorage implements IStorage {
  async getModelConfigs(): Promise<ModelConfig[]> {
    return await db.select().from(modelConfigs).orderBy(modelConfigs.id);
  }

  async getModelConfig(id: number): Promise<(ModelConfig & { tariffs: Tariff[] }) | undefined> {
    const config = await db.query.modelConfigs.findFirst({
      where: eq(modelConfigs.id, id),
      with: {
        tariffs: true
      }
    });
    return config;
  }

  async createModelConfig(config: InsertModelConfig): Promise<ModelConfig> {
    const [newConfig] = await db.insert(modelConfigs).values(config).returning();
    return newConfig;
  }

  async updateModelConfig(id: number, config: Partial<InsertModelConfig>): Promise<ModelConfig> {
    const [updated] = await db.update(modelConfigs)
      .set(config)
      .where(eq(modelConfigs.id, id))
      .returning();
    return updated;
  }

  async getTariffsByModelId(modelId: number): Promise<Tariff[]> {
    return await db.select().from(tariffs).where(eq(tariffs.modelConfigId, modelId));
  }

  async createTariff(tariff: InsertTariff): Promise<Tariff> {
    const [newTariff] = await db.insert(tariffs).values(tariff).returning();
    return newTariff;
  }

  async deleteTariff(id: number): Promise<void> {
    await db.delete(tariffs).where(eq(tariffs.id, id));
  }

  async createSimulation(simulation: InsertSimulation): Promise<Simulation> {
    const [newSim] = await db.insert(simulations).values(simulation).returning();
    return newSim;
  }

  async getSimulations(): Promise<Simulation[]> {
    return await db.select().from(simulations).orderBy(simulations.createdAt);
  }
}

export const storage = new DatabaseStorage();

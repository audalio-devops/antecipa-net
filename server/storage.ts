import { 
  modelConfigs, tariffs, simulations, users,
  type InsertModelConfig, type InsertTariff, type InsertSimulation, type InsertUser,
  type ModelConfig, type Tariff, type Simulation, type User, type SafeUser
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Users
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;
  getUsers(): Promise<SafeUser[]>;

  // Model Configs
  getModelConfigs(): Promise<ModelConfig[]>;
  getModelConfig(id: number): Promise<(ModelConfig & { tariffs: Tariff[] }) | undefined>;
  createModelConfig(config: InsertModelConfig): Promise<ModelConfig>;
  updateModelConfig(id: number, config: Partial<InsertModelConfig>): Promise<ModelConfig>;
  
  // Tariffs
  getTariffsByModelId(modelId: number): Promise<Tariff[]>;
  createTariff(tariff: InsertTariff): Promise<Tariff>;
  updateTariff(id: number, tariff: Partial<InsertTariff>): Promise<Tariff>;
  deleteTariff(id: number): Promise<void>;

  // Simulations
  createSimulation(simulation: InsertSimulation): Promise<Simulation>;
  getSimulations(): Promise<Simulation[]>;
}

export class DatabaseStorage implements IStorage {
  // === USERS ===
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User> {
    const [updated] = await db.update(users).set(user).where(eq(users.id, id)).returning();
    return updated;
  }

  async getUsers(): Promise<SafeUser[]> {
    const result = await db.select({
      id: users.id,
      username: users.username,
      name: users.name,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
    }).from(users).orderBy(users.id);
    return result as SafeUser[];
  }

  // === MODEL CONFIGS ===
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

  // === TARIFFS ===
  async getTariffsByModelId(modelId: number): Promise<Tariff[]> {
    return await db.select().from(tariffs).where(eq(tariffs.modelConfigId, modelId));
  }

  async createTariff(tariff: InsertTariff): Promise<Tariff> {
    const [newTariff] = await db.insert(tariffs).values(tariff).returning();
    return newTariff;
  }

  async updateTariff(id: number, tariff: Partial<InsertTariff>): Promise<Tariff> {
    const [updated] = await db.update(tariffs).set(tariff).where(eq(tariffs.id, id)).returning();
    return updated;
  }

  async deleteTariff(id: number): Promise<void> {
    await db.delete(tariffs).where(eq(tariffs.id, id));
  }

  // === SIMULATIONS ===
  async createSimulation(simulation: InsertSimulation): Promise<Simulation> {
    const [newSim] = await db.insert(simulations).values(simulation).returning();
    return newSim;
  }

  async getSimulations(): Promise<(Simulation & { modelConfig: ModelConfig })[]> {
    const sims = await db.query.simulations.findMany({
      with: {
        modelConfig: true
      },
      orderBy: (sims, { desc }) => [desc(sims.createdAt)]
    });
    return sims as (Simulation & { modelConfig: ModelConfig })[];
  }
}

export const storage = new DatabaseStorage();

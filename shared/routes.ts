import { z } from 'zod';
import { 
  insertModelConfigSchema, 
  insertTariffSchema, 
  modelConfigs, 
  tariffs, 
  calculateInputSchema,
  simulations
} from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  modelConfigs: {
    list: {
      method: 'GET' as const,
      path: '/api/models',
      responses: {
        200: z.array(z.custom<typeof modelConfigs.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/models/:id',
      responses: {
        200: z.custom<typeof modelConfigs.$inferSelect & { tariffs: typeof tariffs.$inferSelect[] }>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/models',
      input: insertModelConfigSchema,
      responses: {
        201: z.custom<typeof modelConfigs.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/models/:id',
      input: insertModelConfigSchema.partial(),
      responses: {
        200: z.custom<typeof modelConfigs.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  tariffs: {
    create: {
      method: 'POST' as const,
      path: '/api/models/:modelId/tariffs',
      input: insertTariffSchema.omit({ modelConfigId: true }),
      responses: {
        201: z.custom<typeof tariffs.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/tariffs/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    }
  },
  calculator: {
    calculate: {
      method: 'POST' as const,
      path: '/api/calculate',
      input: calculateInputSchema,
      responses: {
        200: z.custom<{
          result: any; // Using any here for the complex result object defined in schema, but could be stricter
          model: typeof modelConfigs.$inferSelect;
        }>(),
        404: errorSchemas.notFound,
      },
    },
    saveSimulation: {
      method: 'POST' as const,
      path: '/api/simulations',
      input: z.object({
        modelConfigId: z.number(),
        result: z.any(), // The calculation result
        titleData: z.object({
          value: z.number(),
          emissionDate: z.string(),
          dueDate: z.string(),
        })
      }),
      responses: {
        201: z.custom<typeof simulations.$inferSelect>(),
      }
    },
    listSimulations: {
      method: 'GET' as const,
      path: '/api/simulations',
      responses: {
        200: z.array(z.custom<typeof simulations.$inferSelect & { modelConfig: typeof modelConfigs.$inferSelect }>()),
      }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

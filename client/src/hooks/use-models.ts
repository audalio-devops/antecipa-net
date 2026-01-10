import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { InsertModelConfig, InsertTariff, Tariff, ModelConfig } from "@shared/schema";

export function useModelConfigs() {
  return useQuery({
    queryKey: [api.modelConfigs.list.path],
    queryFn: async () => {
      const res = await fetch(api.modelConfigs.list.path);
      if (!res.ok) throw new Error("Failed to fetch model configurations");
      const data = await res.json();
      return api.modelConfigs.list.responses[200].parse(data);
    },
  });
}

export function useModelConfig(id: number | null) {
  return useQuery({
    queryKey: [api.modelConfigs.get.path, id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) throw new Error("ID required");
      const url = buildUrl(api.modelConfigs.get.path, { id });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch model details");
      const data = await res.json();
      return api.modelConfigs.get.responses[200].parse(data);
    },
  });
}

export function useCreateModelConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertModelConfig) => {
      const res = await fetch(api.modelConfigs.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create model config");
      }
      const json = await res.json();
      return api.modelConfigs.create.responses[201].parse(json);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.modelConfigs.list.path] });
    },
  });
}

export function useUpdateModelConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertModelConfig> }) => {
      const url = buildUrl(api.modelConfigs.update.path, { id });
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update model config");
      const json = await res.json();
      return api.modelConfigs.update.responses[200].parse(json);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.modelConfigs.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.modelConfigs.get.path, variables.id] });
    },
  });
}

export function useCreateTariff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ modelId, data }: { modelId: number; data: Omit<InsertTariff, "modelConfigId"> }) => {
      const url = buildUrl(api.tariffs.create.path, { modelId });
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create tariff");
      const json = await res.json();
      return api.tariffs.create.responses[201].parse(json);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.modelConfigs.get.path, variables.modelId] });
    },
  });
}

export function useDeleteTariff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, modelId }: { id: number; modelId: number }) => {
      const url = buildUrl(api.tariffs.delete.path, { id });
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete tariff");
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.modelConfigs.get.path, variables.modelId] });
    },
  });
}

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { type CalculateInput } from "@shared/schema";

export function useCalculate() {
  return useMutation({
    mutationFn: async (data: CalculateInput) => {
      const res = await fetch(api.calculator.calculate.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Calculation failed");
      const json = await res.json();
      return api.calculator.calculate.responses[200].parse(json);
    },
  });
}

export function useSaveSimulation() {
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(api.calculator.saveSimulation.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save simulation");
      const json = await res.json();
      return api.calculator.saveSimulation.responses[201].parse(json);
    },
  });
}

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type CalculateInput, type NoteResponse } from "@shared/routes"; // NoteResponse is wrong here, fixing usage

export function useCalculate() {
  return useMutation({
    mutationFn: async (data: CalculateInput) => {
      const res = await fetch(api.calculator.calculate.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Calculation failed");
      return api.calculator.calculate.responses[200].parse(await res.json());
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
      return api.calculator.saveSimulation.responses[201].parse(await res.json());
    },
  });
}

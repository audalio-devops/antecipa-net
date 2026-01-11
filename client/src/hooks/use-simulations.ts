import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useSimulations() {
  return useQuery({
    queryKey: [api.calculator.listSimulations.path],
    queryFn: async () => {
      const res = await fetch(api.calculator.listSimulations.path);
      if (!res.ok) throw new Error("Failed to fetch simulations");
      const data = await res.json();
      return api.calculator.listSimulations.responses[200].parse(data);
    },
  });
}

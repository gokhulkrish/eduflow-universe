import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPromotionRules,
  savePromotionRule,
  deletePromotionRule,
  getPromotionRuns,
  checkEligibility,
  executePromotion,
} from "../../core/academics/promotion";
import type { PromotionRule, PromotionRun, StudentEligibility } from "../../core/academics/promotion";

export function usePromotionRules() {
  return useQuery({
    queryKey: ["promotion", "rules"],
    queryFn: getPromotionRules,
  });
}

export function useSavePromotionRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rule: PromotionRule) => savePromotionRule(rule),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["promotion", "rules"] }),
  });
}

export function useDeletePromotionRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePromotionRule(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["promotion", "rules"] }),
  });
}

export function usePromotionRuns() {
  return useQuery({
    queryKey: ["promotion", "runs"],
    queryFn: getPromotionRuns,
  });
}

export function useCheckEligibility() {
  return useMutation({
    mutationFn: (rule: PromotionRule) => checkEligibility(rule),
  });
}

export function useExecutePromotion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ rule, eligible }: { rule: PromotionRule; eligible: StudentEligibility[] }) =>
      executePromotion(rule, eligible),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["promotion", "runs"] });
      qc.invalidateQueries({ queryKey: ["promotion", "rules"] });
    },
  });
}

import { useMutation } from "@tanstack/react-query";
import {
  evaluateObservation,
  batchEvaluateObservations,
  aggregateScores,
  persistScoringAudit,
} from "../../core/scoring/subjectiveToStandard";
import type { ObservationEvent, StandardizedScore } from "../../core/scoring/subjectiveToStandard";

export function useEvaluateObservation() {
  return useMutation({
    mutationFn: async (event: ObservationEvent) => {
      const result = evaluateObservation(event);
      await persistScoringAudit(result, event);
      return result;
    },
  });
}

export function useBatchEvaluate() {
  return useMutation({
    mutationFn: async (events: ObservationEvent[]) => {
      const results = batchEvaluateObservations(events);
      await Promise.all(events.map((event, i) => persistScoringAudit(results[i], event)));
      return results;
    },
  });
}

export function useAggregateScores() {
  return useMutation({
    mutationFn: async (scores: StandardizedScore[]) => aggregateScores(scores),
  });
}

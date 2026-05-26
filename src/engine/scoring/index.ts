export { computeDataCompleteness } from './completeness';
export type { CompletenessConfig } from './completeness';

export { computePerformanceScore } from './performance';
export type { PerformanceInput, PerformanceConfig } from './performance';

export { getScoreBand, getScoreLabel, SCORE_BANDS } from './bands';
export type { ScoreBand, ScoreBandInfo } from './bands';

export {
  recordObservation,
  getScoresForStudent,
} from '../../core/scoring/service';
export type { RecordObservationInput, ScoreRow } from '../../core/scoring/service';

export { scoreObservation } from '../../../lib/scoring/subjectiveToScore';
export type { RubricDimension as LibRubricDimension } from '../../../lib/scoring/subjectiveToScore';

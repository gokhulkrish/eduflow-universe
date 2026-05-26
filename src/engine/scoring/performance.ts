export interface PerformanceInput {
  completeness: number;
  attendance: number;
  academic: number;
  behavior: number;
}

export interface PerformanceConfig {
  completenessWeight: number;
  attendanceWeight: number;
  academicWeight: number;
  behaviorWeight: number;
  minScore: number;
  maxScore: number;
}

const DEFAULT_CONFIG: PerformanceConfig = {
  completenessWeight: 0.20,
  attendanceWeight: 0.30,
  academicWeight: 0.35,
  behaviorWeight: 0.15,
  minScore: 1,
  maxScore: 10,
};

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function computePerformanceScore(
  input: PerformanceInput,
  config?: Partial<PerformanceConfig>,
): number {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const totalWeight =
    cfg.completenessWeight +
    cfg.attendanceWeight +
    cfg.academicWeight +
    cfg.behaviorWeight;

  if (totalWeight === 0) return cfg.minScore;

  const weighted =
    (clamp(input.completeness, cfg.minScore, cfg.maxScore) * cfg.completenessWeight +
      clamp(input.attendance, cfg.minScore, cfg.maxScore) * cfg.attendanceWeight +
      clamp(input.academic, cfg.minScore, cfg.maxScore) * cfg.academicWeight +
      clamp(input.behavior, cfg.minScore, cfg.maxScore) * cfg.behaviorWeight) / totalWeight;

  return Math.round(clamp(weighted, cfg.minScore, cfg.maxScore) * 10) / 10;
}

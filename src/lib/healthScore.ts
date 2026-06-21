import { ClusterMetrics } from './aggregation';

export type HealthBand = 'Healthy' | 'Watch' | 'At Risk';

export interface HealthScoreResult {
  score: number;
  band: HealthBand;
  internalComponent: number;
  leadTimeComponent: number;
  exposureMultiplier: number;
}

export interface HealthScoreConfig {
  targetInternalPercent: number; // e.g. 70
  benchmarkLeadTime: number; // e.g. 45 days
}

const DEFAULT_CONFIG: HealthScoreConfig = {
  targetInternalPercent: 70,
  benchmarkLeadTime: 45 // roughly midpoint of internal (30) and external (60)
};

/**
 * Calculates fulfillment health score for a cluster based on internal % and lead time.
 * Weighting: 45% internal-ratio / 55% lead-time.
 */
export function calculateHealthScore(
  metrics: ClusterMetrics,
  config: HealthScoreConfig = DEFAULT_CONFIG
): HealthScoreResult {
  // 1. Internal Ratio Component (0-100)
  // Caps at 100 once the target is met or exceeded
  const internalRatio = Math.min(100, (metrics.internalPercent / config.targetInternalPercent) * 100);
  
  // 2. Lead Time Component (0-100)
  // If lead time is 0, score is 100. If it hits 2x benchmark, score is 0.
  // Example: benchmark = 45. leadTime = 45 -> score 50. leadTime = 90 -> score 0.
  let leadTimeScore = 0;
  if (metrics.avgLeadTimeDays === 0) {
    leadTimeScore = 100;
  } else {
    leadTimeScore = Math.max(0, 100 - (metrics.avgLeadTimeDays / (config.benchmarkLeadTime * 2)) * 100);
  }
  
  // Blended Formula
  const blendedScore = Math.round((internalRatio * 0.45) + (leadTimeScore * 0.55));
  
  // Determine Band
  let band: HealthBand = 'At Risk';
  if (blendedScore >= 75) band = 'Healthy';
  else if (blendedScore >= 50) band = 'Watch';
  
  // Exposure Multiplier (based on open requisitions count)
  // This is used for visual sorting/emphasis, not added to the score directly.
  const exposureMultiplier = metrics.openReqsCount;
  
  return {
    score: blendedScore,
    band,
    internalComponent: Math.round(internalRatio),
    leadTimeComponent: Math.round(leadTimeScore),
    exposureMultiplier
  };
}

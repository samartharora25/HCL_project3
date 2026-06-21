import { describe, it, expect } from 'vitest';
import { calculateHealthScore, HealthScoreResult } from '../healthScore';
import { ClusterMetrics } from '../aggregation';

describe('calculateHealthScore', () => {
  const baseMetrics: ClusterMetrics = {
    cluster: 'Test',
    totalCount: 10,
    internalCount: 5,
    externalCount: 5,
    internalPercent: 50,
    externalPercent: 50,
    avgLeadTimeDays: 45,
    avgLeadTimeInternal: 30,
    avgLeadTimeExternal: 60,
    openReqsCount: 2
  };

  it('scenario 1: high internal (90%), low lead time (20 days) -> should be Healthy', () => {
    const metrics: ClusterMetrics = { ...baseMetrics, internalPercent: 90, avgLeadTimeDays: 20 };
    const result = calculateHealthScore(metrics, { targetInternalPercent: 70, benchmarkLeadTime: 45 });
    
    expect(result.band).toBe('Healthy');
    expect(result.score).toBeGreaterThanOrEqual(75);
  });

  it('scenario 2: low internal (30%), high lead time (80 days) -> should be At Risk', () => {
    const metrics: ClusterMetrics = { ...baseMetrics, internalPercent: 30, avgLeadTimeDays: 80 };
    const result = calculateHealthScore(metrics, { targetInternalPercent: 70, benchmarkLeadTime: 45 });
    
    expect(result.band).toBe('At Risk');
    expect(result.score).toBeLessThan(50);
  });

  it('scenario 3: balanced but lower volume (70% internal, 45 days) -> should be Watch or lower boundary of Healthy', () => {
    const metrics: ClusterMetrics = { ...baseMetrics, internalPercent: 70, avgLeadTimeDays: 45 };
    const result = calculateHealthScore(metrics, { targetInternalPercent: 70, benchmarkLeadTime: 45 });
    
    // Internal Ratio = 100 * 0.45 = 45
    // Lead Time = 50 * 0.55 = 27.5
    // Total = 72.5 -> 73 (Watch)
    expect(result.score).toBe(73);
    expect(result.band).toBe('Watch');
  });
});

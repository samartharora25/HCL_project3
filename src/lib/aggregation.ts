import { FulfillmentRecord } from './types';

export interface ClusterMetrics {
  cluster: string;
  totalCount: number;
  internalCount: number;
  externalCount: number;
  internalPercent: number;
  externalPercent: number;
  avgLeadTimeDays: number;
  avgLeadTimeInternal: number;
  avgLeadTimeExternal: number;
  openReqsCount: number;
}

/**
 * Aggregates fulfillment records into cluster-level metrics.
 */
export function aggregateByCluster(records: FulfillmentRecord[]): ClusterMetrics[] {
  const clusterMap = new Map<string, FulfillmentRecord[]>();
  
  for (const record of records) {
    const cluster = record.skillCluster;
    if (!clusterMap.has(cluster)) {
      clusterMap.set(cluster, []);
    }
    clusterMap.get(cluster)!.push(record);
  }
  
  const metrics: ClusterMetrics[] = [];
  
  for (const [cluster, clusterRecords] of clusterMap.entries()) {
    const totalCount = clusterRecords.length;
    const internalRecords = clusterRecords.filter(r => r.hiringType === 'Internal');
    const externalRecords = clusterRecords.filter(r => r.hiringType === 'External');
    
    const internalCount = internalRecords.length;
    const externalCount = externalRecords.length;
    
    // Average Lead Times (excluding nulls)
    const calcAvg = (recs: FulfillmentRecord[]) => {
      const withLeadTime = recs.filter(r => r.leadTimeDays !== null);
      if (withLeadTime.length === 0) return 0;
      const sum = withLeadTime.reduce((acc, r) => acc + (r.leadTimeDays as number), 0);
      return Math.round(sum / withLeadTime.length);
    };
    
    const openReqsCount = clusterRecords.filter(r => r.fulfilledDate === null).length;
    
    metrics.push({
      cluster,
      totalCount,
      internalCount,
      externalCount,
      internalPercent: totalCount > 0 ? (internalCount / totalCount) * 100 : 0,
      externalPercent: totalCount > 0 ? (externalCount / totalCount) * 100 : 0,
      avgLeadTimeDays: calcAvg(clusterRecords),
      avgLeadTimeInternal: calcAvg(internalRecords),
      avgLeadTimeExternal: calcAvg(externalRecords),
      openReqsCount
    });
  }
  
  return metrics;
}

/**
 * Aggregates lead time by location.
 */
export function aggregateByLocation(records: FulfillmentRecord[]): Record<string, number> {
  const locMap = new Map<string, number[]>();
  
  for (const record of records) {
    if (record.leadTimeDays === null || !record.location) continue;
    
    const loc = record.location.trim() || 'Unknown';
    if (!locMap.has(loc)) locMap.set(loc, []);
    locMap.get(loc)!.push(record.leadTimeDays);
  }
  
  const result: Record<string, number> = {};
  for (const [loc, times] of locMap.entries()) {
    if (times.length === 0) continue;
    const sum = times.reduce((a, b) => a + b, 0);
    result[loc] = Math.round(sum / times.length);
  }
  
  return result;
}

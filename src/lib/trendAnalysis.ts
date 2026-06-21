export interface TrendData {
  cluster: string;
  previousVolume: number;
  currentVolume: number;
  growthPercent: number | null;
  isTrending: boolean;
}

export interface TrendConfig {
  magnitudeThresholdPercent: number; // e.g. 25
  minVolumeFloor: number; // e.g. 10
}

const DEFAULT_CONFIG: TrendConfig = {
  magnitudeThresholdPercent: 25,
  minVolumeFloor: 10
};

/**
 * Calculates demand trend analysis between two periods.
 */
export function calculateTrends(
  previousPeriodCounts: Record<string, number>,
  currentPeriodCounts: Record<string, number>,
  config: TrendConfig = DEFAULT_CONFIG
): TrendData[] {
  const allClusters = new Set([
    ...Object.keys(previousPeriodCounts),
    ...Object.keys(currentPeriodCounts)
  ]);
  
  const trends: TrendData[] = [];
  
  for (const cluster of allClusters) {
    const prev = previousPeriodCounts[cluster] || 0;
    const curr = currentPeriodCounts[cluster] || 0;
    
    let growthPercent: number | null = null;
    let isTrending = false;
    
    if (prev > 0) {
      growthPercent = ((curr - prev) / prev) * 100;
      
      // Require both magnitude threshold AND minimum volume floor
      if (growthPercent >= config.magnitudeThresholdPercent && curr >= config.minVolumeFloor) {
        isTrending = true;
      }
    } else if (curr >= config.minVolumeFloor) {
      // If previous was 0, it's technically infinite growth, but we flag it as trending
      // if it meets the volume floor.
      isTrending = true;
    }
    
    trends.push({
      cluster,
      previousVolume: prev,
      currentVolume: curr,
      growthPercent,
      isTrending
    });
  }
  
  return trends.sort((a, b) => {
    // Sort trending first, then by highest growth, then volume
    if (a.isTrending !== b.isTrending) return a.isTrending ? -1 : 1;
    if (a.growthPercent !== null && b.growthPercent !== null) {
      return b.growthPercent - a.growthPercent;
    }
    return b.currentVolume - a.currentVolume;
  });
}

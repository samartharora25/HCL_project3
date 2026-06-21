import React, { useMemo } from 'react';
import { ParseResult } from '../lib/parsing';
import { aggregateByCluster, aggregateByLocation } from '../lib/aggregation';
import { calculateHealthScore } from '../lib/healthScore';
import { thresholdClusters } from '../lib/clustering';
import { Card, Badge } from './ui';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, Cell } from 'recharts';

export function AnalyticsDashboard({ parseResult }: { parseResult: ParseResult }) {
  const records = parseResult.validationResult.validData;

  // 1. Threshold clusters for display (combines small clusters into "Other")
  const clusterMapping = useMemo(() => thresholdClusters(records), [records]);
  
  // Apply mapping to a copy of records for aggregation
  const mappedRecords = useMemo(() => {
    return records.map(r => ({
      ...r,
      skillCluster: clusterMapping[r.skillCluster] || r.skillCluster
    }));
  }, [records, clusterMapping]);

  // 2. Aggregate metrics
  const clusterMetrics = useMemo(() => aggregateByCluster(mappedRecords), [mappedRecords]);
  const locationMetrics = useMemo(() => aggregateByLocation(mappedRecords), [mappedRecords]);

  // 3. Health Scores
  const healthScores = useMemo(() => {
    return clusterMetrics.map(metrics => ({
      cluster: metrics.cluster,
      metrics,
      health: calculateHealthScore(metrics)
    })).sort((a, b) => a.health.score - b.health.score); // Sort lowest score first
  }, [clusterMetrics]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <Card>
          <div style={{ color: 'var(--hcl-neutral-400)', fontSize: '14px', marginBottom: '8px' }}>Total Valid Records</div>
          <div style={{ fontSize: '32px', fontWeight: 600 }}>{records.length}</div>
        </Card>
        <Card>
          <div style={{ color: 'var(--hcl-neutral-400)', fontSize: '14px', marginBottom: '8px' }}>Internal Fulfillment</div>
          <div style={{ fontSize: '32px', fontWeight: 600, color: 'var(--hcl-purple)' }}>
            {Math.round((records.filter(r => r.hiringType === 'Internal').length / records.length) * 100 || 0)}%
          </div>
        </Card>
        <Card>
          <div style={{ color: 'var(--hcl-neutral-400)', fontSize: '14px', marginBottom: '8px' }}>Avg Lead Time (Internal)</div>
          <div style={{ fontSize: '32px', fontWeight: 600 }}>
            {clusterMetrics.reduce((acc, c) => acc + c.avgLeadTimeInternal * c.internalCount, 0) / 
             (records.filter(r => r.hiringType === 'Internal' && r.leadTimeDays !== null).length || 1) | 0} <span style={{fontSize: '16px', color: 'var(--hcl-neutral-400)'}}>days</span>
          </div>
        </Card>
        <Card>
          <div style={{ color: 'var(--hcl-neutral-400)', fontSize: '14px', marginBottom: '8px' }}>Avg Lead Time (External)</div>
          <div style={{ fontSize: '32px', fontWeight: 600 }}>
            {clusterMetrics.reduce((acc, c) => acc + c.avgLeadTimeExternal * c.externalCount, 0) / 
             (records.filter(r => r.hiringType === 'External' && r.leadTimeDays !== null).length || 1) | 0} <span style={{fontSize: '16px', color: 'var(--hcl-neutral-400)'}}>days</span>
          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
        
        {/* Fulfillment Health Score (RF-07) */}
        <Card>
          <h3 style={{ marginTop: 0, marginBottom: '24px' }}>Fulfillment Health Score</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--hcl-neutral-200)' }}>
                <th style={{ textAlign: 'left', padding: '12px 0' }}>Skill Cluster</th>
                <th style={{ textAlign: 'right', padding: '12px 0' }}>Score</th>
                <th style={{ textAlign: 'center', padding: '12px 0' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {healthScores.map(({ cluster, health }) => (
                <tr key={cluster} style={{ borderBottom: '1px solid var(--hcl-neutral-100)' }}>
                  <td style={{ padding: '12px 0', fontWeight: 500 }}>
                    {cluster}
                    {health.exposureMultiplier > 0 && (
                      <span style={{ marginLeft: '8px', fontSize: '12px', color: 'var(--hcl-neutral-400)' }}>
                        ({health.exposureMultiplier} open)
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '12px 0', textAlign: 'right', fontWeight: 600 }}>{health.score}</td>
                  <td style={{ padding: '12px 0', textAlign: 'center' }}>
                    <Badge variant={health.band === 'Healthy' ? 'success' : health.band === 'Watch' ? 'warning' : 'error'}>
                      {health.band}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* Lead Time Analytics (RF-08) */}
        <Card>
          <h3 style={{ marginTop: 0, marginBottom: '24px' }}>Average Lead Time</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--hcl-neutral-200)' }}>
                <th style={{ textAlign: 'left', padding: '12px 0' }}>Skill Cluster</th>
                <th style={{ textAlign: 'right', padding: '12px 0' }}>Internal (days)</th>
                <th style={{ textAlign: 'right', padding: '12px 0' }}>External (days)</th>
              </tr>
            </thead>
            <tbody>
              {clusterMetrics.sort((a, b) => b.avgLeadTimeExternal - a.avgLeadTimeExternal).map(m => (
                <tr key={m.cluster} style={{ borderBottom: '1px solid var(--hcl-neutral-100)' }}>
                  <td style={{ padding: '12px 0', fontWeight: 500 }}>{m.cluster}</td>
                  <td style={{ padding: '12px 0', textAlign: 'right' }}>{m.avgLeadTimeInternal || '-'}</td>
                  <td style={{ padding: '12px 0', textAlign: 'right' }}>{m.avgLeadTimeExternal || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

      </div>

      {/* Internal vs External Comparison (RF-06) */}
      <Card>
        <h3 style={{ marginTop: 0, marginBottom: '24px' }}>Internal vs External Mix</h3>
        <div style={{ height: '400px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={clusterMetrics} layout="vertical" margin={{ left: 150, right: 20, top: 20, bottom: 20 }}>
              <XAxis type="number" domain={[0, 100]} tickFormatter={(val) => `${val}%`} />
              <YAxis type="category" dataKey="cluster" width={140} tick={{ fontSize: 12 }} />
              <RechartsTooltip formatter={(value: number) => `${Math.round(value)}%`} />
              <Legend />
              <Bar dataKey="internalPercent" name="Internal %" stackId="a" fill="var(--hcl-purple)" />
              <Bar dataKey="externalPercent" name="External %" stackId="a" fill="var(--hcl-accent-blue)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
      
    </div>
  );
}

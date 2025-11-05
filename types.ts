
import React from 'react';

export type Language = 'python' | 'cpp';

export interface ChartData {
  chartType: 'bar' | 'line' | 'pie' | 'scatter';
  data: any[];
  dataKey: string | string[];
  xAxisKey?: string;
  angleKey?: string;
  nameKey?: string;
}

export interface Cell {
  id: string;
  content: string;
  output: string | ChartData | null;
  status: 'idle' | 'running' | 'success' | 'error';
}

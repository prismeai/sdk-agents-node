export interface AnalyticsParams {
  period?: 'day' | 'week' | 'month' | 'year';
  granularity?: 'hour' | 'day' | 'week' | 'month';
  startDate?: string;
  endDate?: string;
}

export interface AnalyticsResponse {
  conversations?: number;
  messages?: number;
  uniqueUsers?: number;
  avgResponseTime?: number;
  timeSeries?: AnalyticsDataPoint[];
  [key: string]: unknown;
}

export interface AnalyticsDataPoint {
  timestamp: string;
  conversations?: number;
  messages?: number;
  uniqueUsers?: number;
  [key: string]: unknown;
}

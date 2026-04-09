export interface StorageStats {
  totalFiles?: number;
  totalSize?: number;
  vectorStores?: number;
  totalDocuments?: number;
  [key: string]: unknown;
}

export interface StatsParams {
  period?: string;
}

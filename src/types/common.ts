/** Standard paginated list params */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/** Standard paginated response wrapper */
export interface PageResponse<T> {
  data: T[];
  total?: number;
  page?: number;
  limit?: number;
  hasMore?: boolean;
}

/** ISO 8601 timestamp string */
export type Timestamp = string;

/** Localized text — either a plain string or { en: "...", fr: "...", ... } */
export type LocalizedText = string | Record<string, string>;

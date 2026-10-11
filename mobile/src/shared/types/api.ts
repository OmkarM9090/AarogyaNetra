/**
 * API envelope types — mirror of the backend response format.
 */

export interface ApiResponse<T> {
  success: true;
  data: T;
  timestamp: string;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorBody;
  timestamp: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export type ApiKindError =
  | 'network'
  | 'timeout'
  | 'unauthorized'
  | 'validation'
  | 'not_found'
  | 'model_unavailable'
  | 'server'
  | 'unknown';

export interface NormalizedApiError {
  kind: ApiKindError;
  code: string;
  message: string;
  /** Field-level validation errors when kind === 'validation'. */
  fieldErrors?: Record<string, string>;
  status?: number;
}

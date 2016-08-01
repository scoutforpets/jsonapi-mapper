/**
 * Query Parameters map
 */
export interface QueryOpts {
  [key: string]: string;
}

/**
 * Pagination variables
 */
export interface PagOpts {
  offset: number;
  limit: number;
  total?: number;
  rowCount?: number;
}

/**
 * Data required to form links
 */
export interface LinkOpts {
  baseUrl: string;
  type: string;
  parent?: string;
  pag?: PagOpts;
  query?: QueryOpts;
}

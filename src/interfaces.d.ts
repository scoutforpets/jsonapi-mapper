import { PagOpts, QueryOpts } from './links';

//// GENERAL INTERFACES FOR MAPPERS

// Mapper
export interface Mapper {
  map(data: any, type: string, mapOpts?: MapOpts): any;
}

// Mapper Options
export interface MapOpts {
  // Relations-related
  relations?: boolean | string[];

  // Links-related
  enableLinks?: boolean;
  pagination?: PagOpts;
  query?: QueryOpts;
}

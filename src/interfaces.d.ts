import { PagOpts, QueryOpts } from './links';

//// GENERAL INTERFACES FOR MAPPERS

// Mapper
export interface Mapper {
  map(data: any, type: string, mapOpts?: MapOpts): any;
}

// Mapper Options
export interface MapOpts {}

//// BOOKSHELF INTERFACES

// Bookshelf Options
export interface BookOpts extends MapOpts {
  // Nesting-related
  relations?: boolean | string[];
  
  // Links-related
  pagination?: PagOpts;
  query?: QueryOpts;
  disableLinks?: boolean
}

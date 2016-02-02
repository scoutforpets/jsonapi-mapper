import * as serializer from 'jsonapi-serializer';

// Main interface that mappers must implement
export interface Mapper {
  map(data: any, type: string, mapperOptions: MapperOptions): any;
}

// Default mapper options
export interface MapperOptions {}

// Mapper options for bookshelf
export interface BookshelfOptions extends MapperOptions {
  includeRelations?: boolean;
  query?: QueryObj;
  pagination?: PagParams;
  relations?: boolean | string[];
}

// Pagination fields
export interface PagParams {
  offset: number;
  limit: number;
  total?: number;
}

// Query objects must be flat with string values
export interface QueryObj {
  [key: string]: string;
}

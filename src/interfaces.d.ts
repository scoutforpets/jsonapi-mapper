import * as serializer from 'jsonapi-serializer';

// Main interface that mappers must implement
export interface Mapper<T extends IMapperOptions> {
  new(baseUrl: string, serialOpts: serializer.ISerializerOptions);
  map(data: any, type: string, mapperOptions: T): any;
}

// Default mapper options
export interface IMapperOptions {}

// Mapper options for bookshelf
export interface IBookshelfOptions extends IMapperOptions {
  includeRelations?: boolean;
  query?: IQueryObj;
  pagination?: IPagParams;
  relations?: boolean | string[];
}

// Pagination fields
export interface IPagParams {
  offset: number;
  limit: number;
  total?: number;
}

// Query objects must be flat with string values
export interface IQueryObj {
  [key: string]: string;
}

import { PagOpts, QueryOpts } from './links';
import { RelationTypeOpt, RelationOpts } from './relations';

//// GENERAL INTERFACES FOR MAPPERS

// Mapper
export interface Mapper {
  map(data: any, type: string, mapOpts?: MapOpts): any;
}

// Mapper Options
export interface MapOpts {
  // Attributes-related
  omitAttrs?: (RegExp | string)[] | null;
  attributes?: string[] | null;
  keyForAttr?: (attr: string) => string;

  // Relations-related
  relations?: boolean | RelationOpts;
  typeForModel?: RelationTypeOpt;

  // Links-related
  enableLinks?: boolean;
  pagination?: PagOpts;
  query?: QueryOpts;
}

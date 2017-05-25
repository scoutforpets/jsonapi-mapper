import { PagOpts, QueryOpts } from './links';
import { RelationTypeOpt, RelationOpts } from './relations';

//// GENERAL INTERFACES FOR MAPPERS

// Mapper
export interface Mapper {
  map(data: any, type: string, mapOpts?: MapOpts): any;
}

export type AttrMatcher = RegExp | string;

export type AttributesOpt = {
  omit?: AttrMatcher[],
  include?: AttrMatcher[]
};

// Mapper Options
export interface MapOpts {
  // Attributes-related
  attributes?: AttrMatcher[] | AttributesOpt;
  keyForAttr?: (attr: string) => string;

  // Relations-related
  relations?: boolean | RelationOpts;
  typeForModel?: RelationTypeOpt;

  // Links-related
  enableLinks?: boolean;
  pagination?: PagOpts;
  query?: QueryOpts;

  // Meta-related
  meta?: { [key:string]: any };
}

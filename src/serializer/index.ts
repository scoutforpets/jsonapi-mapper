import * as jas from 'jsonapi-serializer';

export type LinkFunc = (primary: any, related?: any, parent?: any) => string;

export type Link = string | LinkFunc;

export interface LinkObj {
  self?: Link;
  related?: Link;

  first?: Link;
  last?: Link;

  prev?: Link;
  next?: Link;
}

export interface SerialOpts {
  attributes?: string[];
  ref?: string;
  included?: boolean;

  topLevelLinks?: LinkObj;
  dataLinks?: LinkObj;
  relationshipLinks?: LinkObj;
  includedLinks?: LinkObj;

  relationshipMeta?: any;
  ignoreRelationshipData?: boolean;

  keyForAttribute?: (attribute: any) => string;
  typeForAttribute?: (attribute: any) => any;
  pluralizeType?: boolean;

  meta?: any;

  // TODO improve type-checking of relationship options
  [relationships: string]: any;
}

export interface SerializerCtor {
  new(type: string, opts: SerialOpts): Serializer;
}

export interface Serializer {
  serialize(data: any): any;
}

// tslint:disable-next-line variable-name
export let Serializer: SerializerCtor = jas.Serializer;

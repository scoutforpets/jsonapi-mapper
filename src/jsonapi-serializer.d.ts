
declare module 'jsonapi-serializer' {

  type LinkFunc = (primary: any, related?: any, parent?: any) => string;

  type Link = string | LinkFunc;

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

  export class Serializer {
    constructor(type: string, opts: SerialOpts);
    serialize(data: any);
  }
}

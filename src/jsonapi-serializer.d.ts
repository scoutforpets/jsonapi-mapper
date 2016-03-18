
declare module 'jsonapi-serializer' {

  type LinkFunc = (model: any, related?: any) => string;

  module Serializer {

    type Link = string | LinkFunc;

    interface ILinkObj {
      self?: Link;
      related?: Link;

      first?: Link;
      last?: Link;

      prev?: Link;
      next?: Link;
    }

    interface ISerializerOptions {
      attributes?: string[];
      ref?: string;
      included?: boolean;

      topLevelLinks?: ILinkObj;
      dataLinks?: ILinkObj;
      relationshipLinks?: ILinkObj;
      includedLinks?: ILinkObj;

      relationshipMeta?: any;
      ignoreRelationshipData?: boolean;

      keyForAttribute?: (attribute: any) => string;
      typeForAttribute?: (attribute: any) => any;
      pluralizeType?: boolean;

      meta?: any;

      // TODO improve type-checking of relationship options
      [relationships: string]: any;
    }

  }

  class Serializer {
    constructor(type: string,
                data: any,
                options: Serializer.ISerializerOptions);
  }

  export = Serializer;
}

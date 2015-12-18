
declare module 'jsonapi-serializer' {

  type LinkFunc = (model: any, related?: any) => string;

  module Serializer {

    interface ILinkObj {
      self?: string | LinkFunc;
      related?: string | LinkFunc;
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

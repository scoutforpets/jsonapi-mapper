/**
 * Map to specify type for the passed relations
 */
export interface RelationTypeMap {
  [relationName: string]: string;
}

/**
 * Function to pass directly as the typeForAttributes option to the serializer
 */
export type RelationTypeFunction = (attribute: string) => string;

/**
 * The relationTypes option can be a function or an object
 */
export type RelationTypeOpt = RelationTypeMap | RelationTypeFunction;

/**
 * Relationship options
 */
export interface RelationOpts {
    included: boolean | string[];
    fields?: string[];
}

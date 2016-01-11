import {Data, Model, Collection} from './bookshelf-extras';
import {Model as BModel, Collection as BCollection} from 'bookshelf';
import * as serializer from 'jsonapi-serializer';
import * as inflection from 'inflection';

/**
 * Builds the relationship transform schema.
 * @param baseUrl
 * @param relationType
 * @param relationKeys
 * @param modelType
 * @param included
 * @returns serializer.ISerializerOptions
 */
export function buildRelation(baseUrl: string,
                              relationType: string,
                              relationKeys: string[],
                              modelType: string,
                              included: boolean)
: serializer.ISerializerOptions {

  // Pluralize the relation and model types to conform with the spec
  relationType = inflection.pluralize(relationType);
  modelType = inflection.pluralize(modelType);

  let baseRelationUrl: string = baseUrl + '/' + modelType + '/';

  return {
    ref: 'id',
    attributes: relationKeys,
    relationshipLinks: {
      self: function(data: Data, related: Model): string {
        return baseRelationUrl + related.id +
          '/relationships/' + relationType;
      },
      related: function(model: Data, related: Model): string {
        return baseRelationUrl + related.id +
          '/' + relationType;
      }
    },
    includedLinks: {
      self: function(model: Data, related: Model): string {
        return baseUrl + '/' + relationType + '/' + related.id;
      }
    },
    included: included
  };
}

/**
 * Retrieves data's attributes list
 * @param data
 * @returns {string[]}
 */
export function getDataAttributesList(data: Data): any {
  return _.keys(getDataAttributes(data));
}

/**
 * Retrieves data's attributes
 * @param data
 * @returns {any}
 * @private
 */
export function getDataAttributes(data: Data): any {
  // Model Case
  if (isModel(data)) {
    let m: Model = <Model> data;
    return m.attributes;

  // Collection Case
  } else if (isCollection(data)) {
    let c: Collection = <Collection> data;
    return c.models[0] && c.models[0].attributes;
  }
}

/**
 * Determines whether a Bookshelf object's data is empty.
 * @param data
 * @returns {boolean}
 */
export function isDataEmpty(data: Model | Collection): boolean {
  if (isModel(data)) {
    return false;
  } else if (isCollection(data)) {
    return (<Collection> data).length === 0;
  }
}

/**
 * Determine whether a Bookshelf object is a Model.
 * @param data
 * @returns {boolean}
 */
export function isModel(data: Data): boolean {
  return data instanceof BModel;
}

/**
 * Determine whether a Bookshelf object is a Collection.
 * @param data
 * @returns {boolean}
 */
export function isCollection(data: Data): boolean {
  return data instanceof BCollection;
}

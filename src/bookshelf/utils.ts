'use strict';

import {Data, Model, Collection} from './extras';
import * as _ from 'lodash';
import * as Serializer from 'jsonapi-serializer';
import * as inflection from 'inflection';
import * as links from './links';

/**
 * Builds the relationship transform schema.
 * @param baseUrl
 * @param modelType
 * @param relatedType
 * @param relatedKeys
 * @param included
 * @returns serializer.ISerializerOptions
 */
export function buildRelation(baseUrl: string,
                              modelType: string,
                              relatedType: string,
                              relatedKeys: string[],
                              included: boolean)
: Serializer.ISerializerOptions {

  return {
    ref: 'id',
    attributes: relatedKeys,
    relationshipLinks: links.buildRelationship(baseUrl, modelType, relatedType),
    includedLinks: links.buildSelf(baseUrl, modelType),
    included: included
  };
}

/**
 * Retrieves data's attributes list
 * omiting _id and _type attributes
 * @param data
 * @returns {string[]}
 */
export function getDataAttributesList(data: Data): any {
  return _.keys(getDataAttributes(data)).filter((name: string) =>
    name !== 'id' &&
    !_.endsWith(name, '_id') &&
    !_.endsWith(name, '_type')
  );
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
 * Determine whether a Bookshelf object is a Model.
 * @param data
 * @returns {boolean}
 */
export function isModel(data: Data): boolean {
  // Is-not-a-Duck-typing
  return (<Collection> data).models === undefined;
}

/**
 * Determine whether a Bookshelf object is a Collection.
 * @param data
 * @returns {boolean}
 */
export function isCollection(data: Data): boolean {
  // Duck-typing
  return (<Collection> data).models !== undefined;
}

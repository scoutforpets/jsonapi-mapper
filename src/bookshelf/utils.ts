'use strict';

import {Data, Model, isModel, Collection, isCollection} from './extras';
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
                              included: boolean,
                              disableLinks: boolean)
: Serializer.ISerializerOptions {

  let r: any = {
    ref: 'id',
    attributes: relatedKeys,
    included: included
  };

  if(!disableLinks) {
      r.relationshipLinks = links.buildRelationship(baseUrl, modelType, relatedType);
      r.includedLinks = links.buildSelf(baseUrl, modelType, relatedType);
  }

  return r;
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
  // Undefined case
  if (!data) return {};

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
 * Convert a bookshelf model or collection to
 * json adding the id attribute if missing
 * @param data
 * @returns {any}
 */
export function toJSON(data: Data): any {

  let json: any = (data && data.toJSON()) || null;

  // Nothing to convert
  if (_.isNull(json)) {
    return json;

  // Model case
  } else if (isModel(data)) {

    // Assign the id for the model if it's not present already
    if (!_.has(json, 'id')) { json.id = data.id; }

    // Loop over model relations to call toJSON recursively on them
    _.forOwn(data.relations, function (rel: Data, relName: string): void {
      json[relName] = toJSON(rel);
    });

  // Collection case
  } else if (isCollection(data)) {
    // Run a recursive toJSON on each model of the collection
    for (let index: number = 0; index < data.length; ++index) {
      json[index] = toJSON(data.models[index]);
    }
  }

  return json;
}

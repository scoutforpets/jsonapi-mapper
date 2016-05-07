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
    includedLinks: links.buildSelf(baseUrl, modelType, relatedType),
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
export function toJSON(data: any): any {

  let json: any = (data && data.toJSON()) || null;

  if (_.isNull(json)) { return json; }

  // Model case
  if (_.isPlainObject(json)) {

    if (!_.has(json, 'id')) { json.id = data.id; }

    // Loop over data relations to fill the relationships objects
    // and the included array
    _.forOwn(data.relations, function (relModel: Model, relName: string): void {

      if (!_.has(json[relName], 'id')) { json[relName].id = relModel.id; }

      // Loop over nested relations, if they exist
      _.forOwn(relModel.relations, function (nestedRelModel: Model, nestedRelName: string): void {

          // `toJSON()` method isn't recursive, so need to convert nested relation to JSON explicitly
          json[relName][nestedRelName] = nestedRelModel.toJSON();

          if (!_.has(json[relName][nestedRelName], 'id')) { json[relName][nestedRelName].id = nestedRelModel.id; }
      });
    });

  // Collection case
  } else if (_.isArray(json) && json.length > 0) {

    let noId: boolean = !_.has(json[0], 'id');

    // Explicit for loop to iterate
    // over collection models and json array
    for (let index: number = 0; index < json.length; ++index) {

      // IIFE to avoid let to var transformation errors
      ((i: number) => {
        if (noId) { json[i].id = data.models[i].id; }

        // Loop over data relations to fill the relationships objects
        // and the included array
        _.forOwn(data.models[i].relations, (relModel: Model, relName: string): void => {
          if (!_.has(json[i][relName], 'id')) { json[i][relName].id = relModel.id; }

          // Loop over nested relations, if they exist
          _.forOwn(relModel.relations, function (nestedRelModel: Model, nestedRelName: string): void {

              // `toJSON()` method isn't recursive, so need to convert nested relation to JSON explicitly
              json[i][relName][nestedRelName] = nestedRelModel.toJSON();

              if (!_.has(json[i][relName][nestedRelName], 'id')) { json[i][relName][nestedRelName].id = nestedRelModel.id; }
          });
        });

      })(index);
    }

  }

  return json;
}

/**
 * Determine whether a Bookshelf object is a Model.
 * @param data
 * @returns {boolean}
 */
export function isModel(data: Data): boolean {
  if (!data) return false;
  // Is-not-a-Duck-typing
  return (<Collection> data).models === undefined;
}

/**
 * Determine whether a Bookshelf object is a Collection.
 * @param data
 * @returns {boolean}
 */
export function isCollection(data: Data): boolean {
  if (!data) return false;
  // Duck-typing
  return (<Collection> data).models !== undefined;
}

'use strict';

import * as _ from 'lodash';
import * as inflection from 'inflection';
import * as Qs from 'qs';
import * as Serializer from 'jsonapi-serializer';

import {Data, Model, isModel, Collection, isCollection} from './extras';
import * as I from '../interfaces.d';
import * as utils from './utils';

/**
 * Generates the top level links object.
 * @param baseUrl
 * @param type
 * @param query
 * @param pag
 * @returns any TODO LINKS OBJECT
 */
export function buildTop(
    baseUrl: string,
    type: string,
    pag?: I.PagParams,
    query?: I.QueryObj)
    : Serializer.ILinkObj {

  let obj: Serializer.ILinkObj = {
    self: baseUrl + '/' + inflection.pluralize(type)
  };

  // Add pagination if given, total records is greater than 0 
  // and total records is less than limit.
  if (pag &&
      pag.total > 0 &&
      pag.total > pag.limit) {
      _.assign(obj, buildPagination(baseUrl, type, pag, query));
  }

  return obj;
}

/**
 * Generates pagination links for a collection.
 * @param baseUrl
 * @param type
 * @param pag
 * @param query
 * @returns any TODO PAGINATION LINKS OBJECT
 */
export function buildPagination(
    baseUrl: string,
    type: string,
    pag: I.PagParams,
    query: any = {})
    : Serializer.ILinkObj {

  let baseLink: string = baseUrl + '/' + inflection.pluralize(type);

  query = _.omit(query, 'page');
  let queryStr: string = Qs.stringify(query, {encode: false});

  return {
    first: function(): string {

      return baseLink +
        '?page[limit]=' + pag.limit +
        '&page[offset]=0' +
        queryStr;

    },

    prev: function(): string {
      // No previous if its the first
      if (pag.offset === 0) return null;

      return baseLink +
        '?page[limit]=' + pag.limit +
        '&page[offset]=' + (pag.offset - pag.limit) +
        queryStr;
    },

    next: function(collection: Collection): string {
      // No next if its the last
      if (collection.length < pag.limit ||
        (pag.total && pag.offset + pag.limit >= pag.total)) return null;

      return baseLink +
        '?page[limit]=' + pag.limit +
        '&page[offset]=' + (pag.offset + pag.limit) +
        queryStr;
    },

    last: function(): string {
      // No last if no total to compare
      if (!pag.total) return null;

      return baseLink +
        '?page[limit]=' + pag.limit +
        '&page[offset]=' + (pag.total - pag.limit) +
        queryStr;
    }
  };
}

/**
 * Generates the resource's url.
 * @param baseUrl
 * @param modelType
 * @param query
 * @returns {{self: (function(any, any): string)}}
 */
export function buildSelf(baseUrl: string, modelType: string, relatedType: string, query?: any): Serializer.ILinkObj {
  return {
    self: function(parent: Data, current: Data): string {

      let type: string = relatedType || modelType;
      let link: string = baseUrl + '/' +
        inflection.pluralize(type);

      // If a model
      if (isModel(current)) {
        return link + '/' + current.id; // TODO ADD QUERY PARAMS AND PAGINATION
      // If collection
      } else if (isCollection(current)) {
        return link;
      }
    }
  };
}

/**
 * Generates the relationship links inside the primary resource
 * @param baseUrl
 * @param modelType
 * @param relatedType
 * @param query
 * @returns {{self: (function(Data): string), related: (function(Data): string)}}
 */
export function buildRelationship(baseUrl: string, modelType: string, relatedType: string, query?: any): Serializer.ILinkObj {
  return {
    self: function(model: Data, related: Data): string {

      let data: Data = model[modelType] || model;

      let link: string = baseUrl + '/' +
        inflection.pluralize(modelType);

      // Primary data is expected to be a model
      link += '/' + (<Model> data).id;

      // Add relationship url component
      link += '/relationships/' + relatedType;

      return link;
    },
    related: function(model: Data, related: Data): string {

      let data: Data = model[modelType] || model;

      let link: string = baseUrl + '/' +
        inflection.pluralize(modelType);

      // Primary data is expected to be a model
      link += '/' + (<Model> data).id;

      // Add relationship url component
      link += '/' + relatedType;

      return link;
    }
  };
}

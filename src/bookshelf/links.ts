'use strict';

import * as _ from 'lodash';
import * as inflection from 'inflection';
import * as Qs from 'qs';
import * as Serializer from 'jsonapi-serializer';

import {Data, Model, isModel, Collection, isCollection} from './extras';
import * as I from '../interfaces.d';
import * as utils from './utils';

import { assign, omit, isEmpty } from 'lodash';
import { pluralize } from 'inflection';
import { stringify } from 'qs';

import { LinkOpts } from "../links";
import { LinkObj } from 'jsonapi-serializer2';

/**
 * Creates top level links object, for primary data and pagination links
 */
export function topLinks(opts: LinkOpts): LinkObj {
  let { baseUrl, type, pag } = opts;

  let obj: LinkObj = {
    self: baseUrl + '/' + pluralize(type)
  };

  // Build pagination if available
  if (pag) {

    // Support Bookshelf's built-in paging parameters
    if (pag.rowCount) pag.total = pag.rowCount;
    
    // Only add pagination links when more than 1 page
    if (pag.total > 0 && pag.total > pag.limit) {
      assign(obj, pagLinks(opts));
    }
  }
  
  return obj;
}

/**
 * Create links object, for pagination links
 */
export function pagLinks(opts: LinkOpts): LinkObj {
  let { baseUrl, type, pag, query } = opts;
  let { offset, limit, total } = pag;
  
  // All links are based on the resource type
  let baseLink: string = baseUrl + '/' + pluralize(type);
  
  // Stringify the query string without page element
  let queryStr: string = stringify(omit(query, 'page'), {encode: false});

  let obj: LinkObj = {} as LinkObj;

  // Add leading pag links if not at the first page
  if (offset > 0) {
    obj.first = function() {
      return baseLink +
        '?page[limit]=' + limit +
        '&page[offset]=' + '0' +
        queryStr;
    };
    
    obj.prev = function() {
      return baseLink +
        '?page[limit]=' + limit +
        '&page[offset]=' + (offset - limit) +
        queryStr;
    };
  }
  
  // Add trailing pag links if not at the last page
  if (total && (offset + limit < total)) {
    obj.next = function() {
      return baseLink +
        '?page[limit]=' + limit +
        '&page[offset]=' + (offset + limit) +
        queryStr;
    };
    
    obj.last = function() {
      // TODO FIX OVERLAP BETWEEN LAST AND NEXT ELEMENTS
      return baseLink +
        '?page[limit]=' + limit +
        '&page[offset]=' + (total - limit) + 
        queryStr;
    }
  }
  
  return !isEmpty(obj) ? obj : undefined;
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

import * as _ from 'lodash';
import * as inflection from 'inflection';
import * as Qs from 'qs';
import * as Serializer from 'jsonapi-serializer';

import {Data, Model, Collection} from './bookshelf-extras';
import * as inters from '../../interfaces';
import * as utils from './utils';


/**
 * Generates the top level links object.
 * @param baseUrl
 * @param type
 * @param queryParams
 * @param pag
 * @returns any TODO LINKS OBJECT
 */
export function buildTop(baseUrl: string, type: string, queryParams?: any, pag?: inters.IPagParams): Serializer.ILinkObj {
  let obj: Serializer.ILinkObj = buildSelf(baseUrl, type, queryParams);

  // Add pagination if given
  if (pag) _.assign(obj, buildPagination(baseUrl, type, queryParams, pag));

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
export function buildPagination(baseUrl: string,
                                type: string,
                                query: any = {},
                                pag: inters.IPagParams): any {

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
 * @param queryParams
 * @returns {{self: (function(any, any): string)}}
 */
export function buildSelf(baseUrl: string, modelType: string, queryParams?: any): Serializer.ILinkObj {
  return {
    self: function(data: Data): string {

      let link: string = baseUrl + '/' +
        inflection.pluralize(modelType);

      // If a model
      if (utils.isModel(data)) {
        let model: Model = <Model> data;

        return link + '/' + model.id; // TODO ADD QUERY PARAMS AND PAGINATION

      // If collection
      } else if (utils.isCollection(data)) {
        return link;
      }
    }
  };
}

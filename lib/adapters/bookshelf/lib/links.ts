import * as inflection from 'inflection';
import * as Qs from 'qs';
import * as Serializer from 'jsonapi-serializer';
import {Collection} from './bookshelf-extras';

interface IPagParams {
  offset: number;
  limit: number;
  total?: number;
}

/**
 * Generates the top level links object.
 * @param baseUrl
 * @param type
 * @param queryParams
 * @returns any TODO LINKS OBJECT
 */
export function buildTop(baseUrl: string, type: string, queryParams: any): Serializer.ILinkObj {
  return buildSelf(baseUrl, type, queryParams);
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
                                pag: IPagParams,
                                query: any = {}): any {

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
export function buildSelf(baseUrl: string, modelType: string, queryParams: any): Serializer.ILinkObj {
  return {
    // TODO IMPROVE ANY TYPE
    self: function(data: any): string {

      let link: string = baseUrl + '/' +
        inflection.pluralize(modelType);

      // TODO CHECK LOGIC BEHIND
      // If an id was specified
      if (data && data.id) {
        return link + '/' + data.id;

        // If just the model
      } else if (data) {
        return undefined;

        // If nothing
      } else {
        return link;
      }
    }
  };
}

import * as inflection from 'inflection';
import * as Qs from 'qs';

// TODO CHECK IF NEEDED EXPORT
interface IPagParams {
  offset: number;
  limit: number;
  total?: number;
}

export function pagination(baseUrl: string,
                           type: string,
                           pag: IPagParams,
                           query: any = {}) {

  let baseLink: string = baseUrl + '/' + inflection.pluralize(type);
  query = _.omit(query, 'page');
  let queryStr = Qs.stringify(query, {encode: false});

  return {
    first: function() {

      return baseLink +
        '?page[limit]=' + pag.limit +
        '&page[offset]=0' +
        queryStr;

    },

    prev: function() {
      // No previous if its the first
      if (pag.offset === 0) return null;

      return baseLink +
        '?page[limit]=' + pag.limit +
        '&page[offset]=' + (pag.offset - pag.limit) +
        queryStr;
    },

    next: function(model) {
      // No next if its the last
      if (model.length < pag.limit ||
        (pag.total && pag.offset + pag.limit >= pag.total)) return null;

      return baseLink +
        '?page[limit]=' + pag.limit +
        '&page[offset]=' + (pag.offset + pag.limit) +
        queryStr;
    },

    last: function(dataSet, model) {

      if (pag.total) {

        // base url for the collection
        var link = baseLink;

        link += '?page[limit]=' + pag.limit;
        link += '&page[offset]=' + (pag.total - pag.limit);

        return link;

      } else {
        return null;
      }
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
export function buildSelfLink(baseUrl, modelType, queryParams) {
  return {
    self: function(model: any, related: any): string {

      let link: string = baseUrl + '/' +
        inflection.pluralize(modelType);

      // TODO CHECK LOGIC BEHIND
      // If an id was specified
      if (model && model.id) {
        return link + '/' + model.id;

        // If just the model
      } else if (model) {
        return undefined;

        // If nothing
      } else {
        return link;
      }
    }
  };
}

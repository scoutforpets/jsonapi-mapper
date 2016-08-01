'use strict';

import { assign, omit, isEmpty } from 'lodash';
import { pluralize as plural } from 'inflection';
import { stringify } from 'qs';

import { Model } from './extras';
import { LinkOpts } from "../links";
import { LinkObj } from 'jsonapi-serializer';

/**
 * Creates top level links object, for primary data and pagination links.
 */
export function topLinks(opts: LinkOpts): LinkObj {
  let { baseUrl, type, pag } = opts;

  let obj: LinkObj = {
    self: baseUrl + '/' + plural(type)
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
 * Create links object, for pagination links.
 * Since its used only inside other functions in this model, its not exported
 */
function pagLinks(opts: LinkOpts): LinkObj {
  let { baseUrl, type, pag, query } = opts;
  let { offset, limit, total } = pag;

  // All links are based on the resource type
  let baseLink: string = baseUrl + '/' + plural(type);

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
      // TODO FIX: The last page can overlap with the next page
      return baseLink +
        '?page[limit]=' + limit +
        '&page[offset]=' + (total - limit) +
        queryStr;
    }
  }

  return !isEmpty(obj) ? obj : undefined;
}

/**
 * Creates links object for a resource, as a related one if related type was specified.
 * This function is both used for dataLinks and relationshipLinks
 * TODO split in 2 separate functions
 */
export function resourceLinks(opts: LinkOpts): LinkObj {
  let { baseUrl, type, parent } = opts;

  // Case when the resource is related
  if (parent) {
    let baseLink: string = baseUrl + '/' + plural(parent);

    return {
      self: function(model: Model) {
        return baseLink + '/' + model.id + '/relationships/' + type;
      },
      related: function(model: Model) {
        return baseLink + '/' + model.id + '/' + type;
      }
    };

  // Simple case when the resource is primary
  } else {
    let baseLink: string = baseUrl + '/' + plural(type);

    return {
      // TODO FIX: Is not guaranteed to be a Model (could be a collection)
      self: function(model: Model) {
        return baseLink + '/' + model.id;
      }
    };
  }
}

/**
 * Creates links object for a related resource, to be used for the included's array
 */
export function includedLinks(opts: LinkOpts): LinkObj {
  let { baseUrl, type } = opts;
  let baseLink: string = baseUrl + '/' + plural(type);

  return {
    self: function(parent: Model, model: Model) {
      return baseLink + '/' + model.id;
    }
  }
}

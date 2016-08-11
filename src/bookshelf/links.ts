'use strict';

import { assign, omit, isEmpty } from 'lodash';
import { pluralize as plural } from 'inflection';
import { stringify as queryParams } from 'qs';

import { Model } from './extras';
import { LinkOpts, PagOpts, QueryOpts } from '../links';
import { LinkObj } from 'jsonapi-serializer';

function urlConcat(...parts: string[]): string {
  return parts.join('/');
}

/**
 * Creates top level links object, for primary data and pagination links.
 */
export function topLinks(linkOpts: LinkOpts): LinkObj {
  let { baseUrl, type, pag }: LinkOpts = linkOpts;

  let obj: LinkObj = {
    self: urlConcat(baseUrl, plural(type))
  };

  // Build pagination if available
  if (pag) {

    // Support Bookshelf's built-in paging parameters
    if (pag.rowCount) {
      pag.total = pag.rowCount;
    }

    // Only add pagination links when more than 1 page
    if (pag.total > 0 && pag.total > pag.limit) {
      assign(obj, pagLinks(linkOpts));
    }
  }

  return obj;
}

/**
 * Create links object, for pagination links.
 * Since its used only inside other functions in this model, its not exported
 */
function pagLinks(linkOpts: LinkOpts): LinkObj {
  let { baseUrl, type, pag, query }: LinkOpts = linkOpts;
  let { offset, limit, total }: PagOpts = pag;

  // All links are based on the resource type
  let baseLink: string = urlConcat(baseUrl, plural(type));

  // Stringify the query string without page element
  query = omit(query, ['page', 'page[limit]', 'page[offset]']) as QueryOpts;
  baseLink = baseLink + '?' + queryParams(query, {encode: false});

  let obj: LinkObj = {} as LinkObj;

  // Add leading pag links if not at the first page
  if (offset > 0) {
    obj.first = () => {
      let page: any = {page: {limit, offset: 0}};
      return baseLink + queryParams(page, {encode: false});
    };

    obj.prev = () => {
      let page: any = {page: {limit, offset: offset - limit}};
      return baseLink + queryParams(page, {encode: false});
    };
  }

  // Add trailing pag links if not at the last page
  if (total && (offset + limit < total)) {
    obj.next = () => {
      let page: any = {page: {limit, offset: offset + limit}};
      return baseLink + queryParams(page, {encode: false});
    };

    obj.last = () => {
      // Avoiding overlapping with the penultimate page
      let lastLimit: number = (total - (offset % limit)) % limit;
      // If the limit fits perfectly in the total, reset it to the original
      lastLimit = lastLimit === 0 ? limit : lastLimit;

      let lastOffset: number = total - lastLimit;
      let page: any = {page: {limit: lastLimit, offset: lastOffset }};
      return baseLink + queryParams(page, {encode: false});
    };
  }

  return !isEmpty(obj) ? obj : undefined;
}

/**
 * Creates links object for a resource, as a related one if related type was specified.
 * This function is both used for dataLinks and relationshipLinks
 */
export function dataLinks(linkOpts: LinkOpts): LinkObj {
  let { baseUrl, type }: LinkOpts = linkOpts;
  let baseLink: string = urlConcat(baseUrl, plural(type));

  return {
    // FIXME: Is not guaranteed to be a Model (could be a collection)
    self: function(resource: any): string {
      return urlConcat(baseLink, resource.id);
    }
  };
}

/**
 * Creates links object for a relationship
 * This function is both used for dataLinks and relationshipLinks
 */
export function relationshipLinks(linkOpts: LinkOpts, related: string): LinkObj {
  let { baseUrl, type }: LinkOpts = linkOpts;
  let baseLink: string = urlConcat(baseUrl, plural(type));

  return {
    self: function(resource: any, current: any, parent: any): string {
      return urlConcat(baseLink, parent.id, 'relationships', related);
    },
    related: function(resource: any, current: any, parent: any): string {
      return urlConcat(baseLink, parent.id, related);
    }
  };
}

/**
 * Creates links object for a related resource, to be used for the included's array
 */
export function includedLinks(linkOpts: LinkOpts): LinkObj {
  let { baseUrl, type }: LinkOpts = linkOpts;
  let baseLink: string = urlConcat(baseUrl, plural(type));

  return {
    self: function(primary: Model, current: Model): string {
      return urlConcat(baseLink, current.id);
    }
  };
}

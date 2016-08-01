/**
 * The main purpose of this module is to provide utility functions
 * that follows the restrictions of the Bookshelf/Mapper/Serializer APIs
 * with the goal of simplifying the logic of the main 'map' method.
 */

'use strict';

import { assign, clone, forOwn, has, isNull, keys } from 'lodash';
import { typeCheck } from 'type-check';

import { SerialOpts } from 'jsonapi-serializer';
import { BookOpts } from '../interfaces';
import { LinkOpts } from '../links';
import { topLinks, resourceLinks } from './links';
import { Data, Model, isModel} from './extras';

/**
 * Main structure used through most utility and recurse functions
 */
export interface Information {
  bookOpts: BookOpts,
  linkOpts: LinkOpts,
}

/**
 * Flag to indicate if processing is recursive or not
 */
type DataLevel = 'primary' | 'related';

/**
 * Sets the top level links on the template
 */
export function setTopLinks(info: Information, template: SerialOpts) {
  let { bookOpts, linkOpts } = info;
  if (!bookOpts.disableLinks) {
    template.topLevelLinks = topLinks(linkOpts);
  }
}

/**
 * Recursively adds data-related properties to the
 * template to be sent to the serializer
 */
export function processData(info: Information, data: Data, level: DataLevel): SerialOpts {
  let { bookOpts, linkOpts } = info;
  let sample: Model = getSample(data);

  // There is nothing to process without sample
  if (!sample) return undefined;

  let template: SerialOpts = {};

  // Add reference on nested resources
  if (level === 'related') template.ref = 'id';

  // Add list of valid attributes
  template.attributes = getAttrsList(sample);

  // Add links (self and related)
  // TODO MISSING RELATIONSHIP LINKS
  template.dataLinks = resourceLinks(linkOpts);

  // Serializer process for Model relations
  if (isModel(data)) {
    forOwn(data.relations, (relData: Data, relName: string): void => {
      if (!relationAllowed(bookOpts, relName)) return;

      // TODO AVOID DUPLICATES WHY?
      // TODO VERIFY ANY OTHER CHECKS NEEDED

      let name: string = relationName(bookOpts, relName);
      let newLinkOpts: LinkOpts = assign<LinkOpts, any, LinkOpts>(clone(linkOpts), { type: relName });

      template[name] = processData({ bookOpts, linkOpts: newLinkOpts}, relData, 'related');
      template.attributes.push(name);
    });

  // Serializer process for Collection relations
  } else {
    forOwn(data.models[0], (relData: Data, relName: string): void => {
      if (!relationAllowed(bookOpts, relName)) return;

      // TODO AVOID DUPLICATES WHY?
      // TODO VERIFY ANY OTHER CHECKS NEEDED

      let name: string = relationName(bookOpts, relName);
      let newLinkOpts: LinkOpts = assign<LinkOpts, any, LinkOpts>(clone(linkOpts), { type: relName });

      template[name] = processData({ bookOpts, linkOpts: newLinkOpts}, relData, 'related');
      template.attributes.push(name);
    });
  }

  return template;
}

/**
 * Get model sample from data to generate a template
 */
function getSample(data: Data): Model {
  if (!data) return undefined;
  if (isModel(data)) return data;
  else return data.models[0];
}

/**
 * Retrieve model's attribute names
 * following filtering rules
 */
function getAttrsList(data: Model): any {
  let attrs: string[] = keys(data.attributes);

  let restricted: RegExp[] = [
    /^id$/,
    /[_-]id$/,
    /[_-]type$/,
  ];

  // Only return attributes that doesn't match any pattern
  return attrs.filter((attr: string) => {
    return !restricted.some((pattern: RegExp) => attr.search(pattern) >= 0);
  });
}

/**
 * Based on Bookshelf options, determine if a relation must be included
 */
function relationAllowed(bookOpts: BookOpts, relName: string) {
  let { relations } = bookOpts;

  return relations === true || (typeCheck('[String]', relations) &&
    (relations as string[]).some((rel: string) => rel === relName));
}

/**
 * Based on Bookshelf options, determine the relation name
 */
function relationName(bookOpts: BookOpts, relName: string) {
  // TODO THIS METHOD EXISTS FOR A NEW FEATURE TO DEFINE CUSTOM RELATION NAMES
  return relName;
}

/**
 * Convert a bookshelf model or collection to
 * json adding the id attribute if missing
 */
export function toJSON(data: Data): any {

  // TODO CHECK IF SUPERFLUOUS
  let json: any = (data && data.toJSON()) || null;

  // Nothing to convert
  if (isNull(json)) {
    return json;

  // Model case
  } else if (isModel(data)) {

    // Assign the id for the model if it's not present already
    if (!has(json, 'id')) { json.id = data.id; }

    // Loop over model relations to call toJSON recursively on them
    forOwn(data.relations, function (rel: Data, relName: string): void {
      json[relName] = toJSON(rel);
    });

  // Collection case
  } else {
    // Run a recursive toJSON on each model of the collection
    for (let index: number = 0; index < data.length; ++index) {
      json[index] = toJSON(data.models[index]);
    }
  }

  return json;
}

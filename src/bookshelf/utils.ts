/**
 * The main purpose of this module is to provide utility functions
 * that follows the restrictions of the Bookshelf/Mapper/Serializer APIs
 * with the goal of simplifying the logic of the main 'map' method.
 */

'use strict';

import { assign, clone, forOwn, has, isNull, keys, merge, reduce } from 'lodash';
import { typeCheck } from 'type-check';

import { SerialOpts } from 'jsonapi-serializer';
import { LinkOpts } from '../links';
import { topLinks, dataLinks, relationshipLinks, includedLinks } from './links';
import { BookOpts, Data, Model, isModel, isCollection } from './extras';

/**
 * Main structure used through most utility and recursive functions
 */
export interface Information {
  bookOpts: BookOpts;
  linkOpts: LinkOpts;
}

/**
 * Start the data processing with top level information,
 * then handle resources recursively in processResource
 */
export function processData(info: Information, data: Data): SerialOpts {
  let { bookOpts, linkOpts }: Information = info;
  let { enableLinks }: BookOpts = bookOpts;

  let template: SerialOpts = processResource(info, data);

  if (enableLinks) {
    template.dataLinks = dataLinks(linkOpts);
    template.topLevelLinks = topLinks(linkOpts);
  }

  return template;
}

/**
 * Recursively adds data-related properties to the
 * template to be sent to the serializer
 */
export function processResource(info: Information, data: Data): SerialOpts {
  let { bookOpts, linkOpts }: Information = info;
  let { enableLinks }: BookOpts = bookOpts;
  let sample: Model = getSample(data);

  let template: SerialOpts = {};

  // Add list of valid attributes
  template.attributes = getAttrsList(sample);

  // Nested relations (recursive) template generation
  forOwn(sample.relations, (relData: Data, relName: string): void => {
    if (!relationAllowed(bookOpts, relName)) { return; }

    // TODO VERIFY ANY OTHER CHECKS NEEDED

    let relLinkOpts: LinkOpts = assign<LinkOpts, any, LinkOpts>(clone(linkOpts), {type: relName});
    let relTemplate: SerialOpts = processResource({bookOpts, linkOpts: relLinkOpts}, relData);
    relTemplate.ref = 'id'; // Add reference in nested resources

    // Related links
    if (enableLinks) {
      relTemplate.relationshipLinks = relationshipLinks(linkOpts, relName);
      relTemplate.includedLinks = includedLinks(relLinkOpts);
    }

    template[relName] = relTemplate;
    template.attributes.push(relName);
  });

  return template;
}

/**
 * Get model sample from data to generate a template
 * Notice this method is quite type-hacky and is meant for solving null issues
 */
function getSample(data: Data): Model {
  if (isModel(data)) {
    return data;
  } else if (isCollection(data)) {
    return data.reduce(merge, {} as Model);
  } else {
    return {} as Model;
  }
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
    /[_-]type$/
  ];

  // Only return attributes that don't match any pattern
  return attrs.filter((attr: string) => {
    return !restricted.some((pattern: RegExp) => attr.search(pattern) >= 0);
  });
}

/**
 * Based on Bookshelf options, determine if a relation must be included
 */
function relationAllowed(bookOpts: BookOpts, relName: string): boolean {
  let { relations }: BookOpts = bookOpts;

  return relations === true ||
    (typeCheck('[String]', relations) &&
      (relations as string[]).some((rel: string) => rel === relName));
}

/**
 * Convert a bookshelf model or collection to
 * json adding the id attribute if missing
 */
export function toJSON(data: Data): any {

  let json: any = null;

  if (isModel(data)) {
    json = data.serialize({shallow: true}); // serialize without the relations

    // Assign the id for the model if it's not present already
    if (!has(json, 'id')) { json.id = data.id; }

    // Loop over model relations to call toJSON recursively on them
    forOwn(data.relations, function (relData: Data, relName: string): void {
      json[relName] = toJSON(relData);
    });

  } else if (isCollection(data)) {
    // Run a recursive toJSON on each model of the collection
    json = data.map(toJSON);
  }

  return json;
}

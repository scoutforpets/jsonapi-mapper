/**
 * The main purpose of this module is to provide utility functions
 * that follows the restrictions of the Bookshelf/Mapper/Serializer APIs
 * with the goal of simplifying the logic of the main 'map' method.
 */

'use strict';

import { assign, clone, includes, intersection, isNil, forOwn, has, keys, mapValues, merge } from 'lodash';

import { SerialOpts } from 'jsonapi-serializer';
import { LinkOpts } from '../links';
import { RelationOpts } from '../relations';
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
 * then handle resources recursively in processSample
 */
export function processData(info: Information, data: Data): SerialOpts {
  let { bookOpts: { enableLinks }, linkOpts }: Information = info;

  let template: SerialOpts = processSample(info, sample(data));

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
function processSample(info: Information, sample: Model): SerialOpts {
  let { bookOpts, linkOpts }: Information = info;
  let { enableLinks }: BookOpts = bookOpts;

  let template: SerialOpts = {};

  // Add list of valid attributes
  template.attributes = getAttrsList(sample);

  // Nested relations (recursive) template generation
  forOwn(sample.relations, (relSample: Model, relName: string): void => {
    if (!relationAllowed(bookOpts, relName)) { return; }

    let relLinkOpts: LinkOpts = assign<LinkOpts, any, LinkOpts>(clone(linkOpts), {type: relName});
    let relTemplate: SerialOpts = processSample({bookOpts, linkOpts: relLinkOpts}, relSample);
    relTemplate.ref = 'id'; // Add reference in nested resources

    // Related links
    if (enableLinks) {
      relTemplate.relationshipLinks = relationshipLinks(linkOpts, relName);
      relTemplate.includedLinks = includedLinks(relLinkOpts);
    }

    // Include links as compound document
    if (!includeAllowed(bookOpts, relName)) {
        relTemplate.included = false;
    }

    template[relName] = relTemplate;
    template.attributes.push(relName);
  });

  return template;
}

/**
 * Convert any data into a model representing
 * a complete sample to be used in the template generation
 */
function sample(data: Data): Model {
  if (isModel(data)) {
    const cloned: Model = clone(data);
    cloned.relations = mapValues(data.relations, sample);
    return cloned;
  } else if (isCollection(data)) {
    return data.reduce(mergeModel, {} as Model);
  } else {
    return {} as Model;
  }
}

/**
 * Merge two models into a representation of both
 */
function mergeModel(main: Model, toMerge: Model): Model {
  const sampled: Model = sample(toMerge);
  main.attributes = merge(main.attributes, sampled.attributes);
  main.relations = merge(main.relations, sampled.relations);
  return main;
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

  if (typeof relations === 'boolean') {
    return relations;
  } else {
    let { fields }: RelationOpts = relations;
    return isNil(fields) || includes(fields, relName);
  }
}

/**
 * Based on Bookshelf options, determine if a relation must be included
 */
function includeAllowed(bookOpts: BookOpts, relName: string): boolean {
  let { relations }: BookOpts = bookOpts;

  if (typeof relations === 'boolean') {
    return relations;
  } else {
    let { fields, included }: RelationOpts = relations;

    if (typeof included === 'boolean') {
      return included;
    } else {
      // If included is an array, only allow relations that are in that array
      let allowed: string[] = included;

      if (! isNil(fields)) {
        // If fields specified, ensure that the included relations
        // are listed as one of the relations to be serialized
        allowed = intersection(fields, included);
      }

      return includes(allowed, relName);
    }
  }
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

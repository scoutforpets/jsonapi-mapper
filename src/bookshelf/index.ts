'use strict';

import { assign, identity } from 'lodash';
import { pluralize as plural } from 'inflection';
import { SerialOpts, Serializer } from 'jsonapi-serializer';
import { Mapper, MapOpts } from '../interfaces';
import { Data, BookOpts } from './extras';
import { LinkOpts } from '../links';

import { Information, processData, toJSON } from './utils';

/**
 * Mapper class for Bookshelf sources
 */
export default class Bookshelf implements Mapper {

  /**
   * Standard constructor
   */
  constructor(public baseUrl: string, public serialOpts?: SerialOpts) { }

  /**
   * Maps bookshelf data to a JSON-API 1.0 compliant object
   *
   * The `any` type data source is set for typing compatibility, but must be removed if possible
   * TODO fix data any type
   */
  map(data: Data | any, type: string, mapOpts: MapOpts = {}): any {

    // Set default values for the options
    const {
      attributes,
      keyForAttr = identity,
      relations = true,
      typeForModel = (attr: string) => plural(attr),
      enableLinks = true,
      pagination,
      query
    }: MapOpts = mapOpts;

    const bookOpts: BookOpts = {
      attributes, keyForAttr,
      relations, typeForModel,
      enableLinks, pagination, query
    };

    const linkOpts: LinkOpts = { baseUrl: this.baseUrl, type, pag: pagination };

    const info: Information = { bookOpts, linkOpts };
    const template: SerialOpts = processData(info, data);

    const typeForAttribute: (attr: string) => string =
      typeof typeForModel === 'function'
        ? typeForModel
        : (attr: string) =>  typeForModel[attr] || plural(attr);  // pluralize when falsy

    // Override the template with the provided serializer options
    assign(template, { typeForAttribute, keyForAttribute: keyForAttr }, this.serialOpts);

    // Return the data in JSON API format
    const json: any = toJSON(data);
    return new Serializer(type, template).serialize(json);
  }
}

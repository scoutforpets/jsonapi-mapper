'use strict';

import { assign, defaultsDeep } from 'lodash';
import { SerialOpts, Serializer } from 'jsonapi-serializer';
import { Mapper } from '../interfaces';
import { Data, BookOpts } from './extras';
import { LinkOpts } from '../links';
import { RelationTypeOpt, RelationTypeFunction } from '../relations';

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
  map(data: Data | any, type: string, bookOpts: BookOpts = {}): any {

    let linkOpts: LinkOpts = { baseUrl: this.baseUrl, type, pag: bookOpts.pagination };

    // Set default values for the options
    defaultsDeep(bookOpts, {relations: { included: true }, enableLinks: true, omitAttrs: []});

    let info: Information = { bookOpts, linkOpts };

    let template: SerialOpts = processData(info, data);

    let relationTypes: RelationTypeOpt = bookOpts.relationTypes || {};
    function typeForAttribute(attr: string): string {
      // if typeForAttribute returns undefined, the serializer
      // omits the result and handles pluralization
      if (typeof relationTypes === 'object') {
        return relationTypes[attr];
      } else {
        return (relationTypes as RelationTypeFunction)(attr);
      }
    }

    // Override the template with the provided serializer options
    assign(template, { typeForAttribute }, this.serialOpts);

    // Return the data in JSON API format
    let json: any = toJSON(data);
    return new Serializer(type, template).serialize(json);
  }
}

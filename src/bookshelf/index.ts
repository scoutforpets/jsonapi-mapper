'use strict';

//// TODO NEW IMPORTS

import { assign } from 'lodash';
import { SerialOpts, Serializer } from 'jsonapi-serializer';
import { pluralize as plural } from 'inflection';
import { Mapper } from '../interfaces';
import { Data, BookOpts } from './extras';
import { LinkOpts } from '../links';
import { RelationTypeOpt, RelationTypeMap, RelationTypeFunction } from '../relations';

import * as utils from './utils';
import { Information } from './utils';

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
    bookOpts = assign({relations: true, enableLinks: true}, bookOpts);

    let info: Information = { bookOpts, linkOpts };

    let template: SerialOpts = utils.processData(info, data);

    let relationTypes: RelationTypeOpt = bookOpts.relationTypes || {};
    function typeForAttribute(attr: string): string {
      if (typeof relationTypes === 'object') {
        return relationTypes[attr] || plural(attr);
      } else {
        return (relationTypes as RelationTypeFunction)(attr) || plural(attr);
      }
    }

    // Override the template with the provided serializer and type options
    assign(template, this.serialOpts, { typeForAttribute });

    // Return the data in JSON API format
    let json: any = utils.toJSON(data);
    return new Serializer(type, template).serialize(json);
  }
}

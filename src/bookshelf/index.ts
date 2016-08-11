'use strict';

//// TODO NEW IMPORTS

import { assign } from 'lodash';
import { SerialOpts, Serializer } from 'jsonapi-serializer';
import { Mapper } from '../interfaces';
import { Data, BookOpts } from './extras';
import { LinkOpts } from '../links';

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
  map(data: Data | any, type: string, bookOpts: BookOpts = {relations: true}): any {

    let linkOpts: LinkOpts = { baseUrl: this.baseUrl, type, pag: bookOpts.pagination };
    let info: Information = { bookOpts, linkOpts };

    let template: SerialOpts = utils.processData(info, data);

    // Override the template with the provided serializer options
    assign(template, this.serialOpts);

    // Return the data in JSON API format
    let json: any = utils.toJSON(data);
    return new Serializer(type, template).serialize(json);
  }
}

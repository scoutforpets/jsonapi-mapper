'use strict';

//// TODO NEW IMPORTS

import { assign } from 'lodash';
import { SerialOpts, Serializer } from 'jsonapi-serializer2';
import { Mapper, BookOpts } from '../interfaces';
import { Data } from "./extras";

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
   */
  map(data: Data, type: string, bookOpts: BookOpts = {relations: true}): any {
    
    let template: SerialOpts = {};
    let linkOpts = { baseUrl: this.baseUrl, type, pag: bookOpts.pagination };
    let info: Information = { template, bookOpts, linkOpts };

    utils.setTopLinks(info);
    utils.processData(info, data, 'primary');

    // Override the template with the provided serializer options
    assign(template, this.serialOpts);

    // Return the data in JSON API format
    let json : any = utils.toJSON(data);
    return new Serializer(type, template).serialize(json);
  }
}

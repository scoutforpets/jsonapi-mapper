'use strict';

import { assign, defaultsDeep } from 'lodash';
import { pluralize as plural } from 'inflection';
import { SerialOpts, Serializer } from 'jsonapi-serializer';
import { Mapper } from '../interfaces';
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
  map(data: Data | any, type: string, bookOpts: BookOpts = {}): any {

    let linkOpts: LinkOpts = { baseUrl: this.baseUrl, type, pag: bookOpts.pagination };

    // Set default values for the options
    defaultsDeep(bookOpts, {
      relations: { included: true },
      enableLinks: true,
      omitAttrs: [],
      typeForModel: (attr: string) => plural(attr)
    });

    let info: Information = { bookOpts, linkOpts };

    let template: SerialOpts = processData(info, data);

    let { typeForModel }: BookOpts = bookOpts;
    let typeForAttribute: (attr: string) => string;

    if (typeof typeForModel === 'function') {
      typeForAttribute = typeForModel as ((attr: string) => string); // XXX remove `as ...` in typescript 2
    } else {
      // if the typeForModel object returns a falsy value, pluralize the attribute
      typeForAttribute = (attr: string) =>  typeForModel[attr] || plural(attr);
    }

    // Override the template with the provided serializer options
    assign(template, { typeForAttribute }, this.serialOpts);

    // Return the data in JSON API format
    let json: any = toJSON(data);
    return new Serializer(type, template).serialize(json);
  }
}

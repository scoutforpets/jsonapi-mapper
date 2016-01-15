'use strict';

import * as _ from 'lodash';
import * as validator from  'validator';

import * as Serializer from 'jsonapi-serializer';
import * as adapters from './lib/adapters/adapters';
import * as inters from './lib/interfaces.d';

class OhMyJSONAPI {

  private adapter: inters.IAdapter;
  private baseUrl: string;
  private serializerOptions: any;

  /**
   * Constructor that initializes a new instance of ohMyJSONAPI
   * with the desired adapter. If no adapter is passed
   * @param  {[type]} adapterName [description]
   * @param baseUrl
   * @param serializerOptions
   * @return {[type]}         [description]
   */
  constructor(adapterName: string, baseUrl: string, serializerOptions: any) {

    // Lookup and set the adapter if it exists
    this.adapter = _lookupAdapter(adapterName);

    // Trim and set the baseUrl, if it exists.
    this.baseUrl = validator.isURL(baseUrl) ? _.trimRight(baseUrl, '/') : '';

    // Set default serializer options.
    this.serializerOptions = serializerOptions;
  }

  /**
   * Provides access to a new instance of the raw serializer. For more information
   * on options, please see https://github.com/SeyZ/jsonapi-serializer.
   * @param type
   * @param data
   * @param options
   */
  static serializer(type: string, data: any, options: Serializer.ISerializerOptions): Serializer {
    return new Serializer(type, data, options);
  }

  /**
   * Serializes the data using the specified adapter.
   * @param  {[type]} data this will
   * @param  {[type]} type [description]
   * @param options
   * @return {[type]}      [description]
   */
  toJSONAPI(data: any, type: string, options: inters.IAdapterOptions = {}): any {
    if (!data) { throw new Error('toJSONAPI(): `data` is required.'); }
    if (!type) { throw new Error('toJSONAPI(): `type` is required.'); }

    // Use adapter serializer or raw serializer depending if it was set
    if (this.adapter) {
      return this.adapter(data, type, this.baseUrl, this.serializerOptions, options);
    } else {
      return OhMyJSONAPI.serializer(type, data, this.serializerOptions);
    }
  }
}

/**
 * Looks up and returns the specified Adapter.
 * @param adapterName
 * @private
 */
function _lookupAdapter(adapterName: string): inters.IAdapter {
  let adapter: inters.IAdapter = adapters[adapterName];
  if (!adapter) {
    throw new Error('Invalid adapter. Please choose from [bookshelf]');
  }
  return adapter;
}

export = OhMyJSONAPI;

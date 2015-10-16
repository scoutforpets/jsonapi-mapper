var _ = require('lodash'),
    adapters = require('./lib/adapters/'),
    JSONAPISerializer = require('jsonapi-serializer');

/**
 * Constructor that initializes a new instance of ohMyJSONAPI
 * with the desired adapter.
 * @param  {[type]} adapter [description]
 * @return {[type]}         [description]
 */
function OhMyJSONAPI(adapter, baseUrl, serializerOptions) {
  if (!adapter) {
    throw new Error('OhMyJSONAPI(): a valid adapter must be specified.');
  }
  this._adapter = _lookupAdapter(adapter);
  this._baseUrl =  _.trimRight(baseUrl, '/');
  this._serializerOptions = serializerOptions;
}

/**
 * Serializes the data using the specified adapter.
 * @param  {[type]} data this will
 * @param  {[type]} type [description]
 * @return {[type]}      [description]
 */
OhMyJSONAPI.prototype.toJSONAPI = function(data, type, includeRelations) {
  if (!type) { throw new Error('toJSONAPI(): `type` is required.')}
  if (!data) { throw new Error('toJSONAPI(): `data` is required.')}

  return this._adapter(data, type, this._baseUrl, this._serializerOptions, includeRelations);
}

/**
 * Provides access to a new instance of the raw serializer. For more information
 * on options, please see https://github.com/SeyZ/jsonapi-serializer.
 * @param  {[type]} type    [description]
 * @param  {[type]} data    [description]
 * @param  {[type]} options [description]
 * @return {[type]}         [description]
 */
OhMyJSONAPI.prototype.serializer = function(type, data, options) {
  return new JSONAPISerializer(type, data, options);
}

/**
 * Looks up and returns the specified Adapter.
 * @param  {[type]} adapter [description]
 * @return {[type]}         [description]
 */
function _lookupAdapter(adapter) {
  if (adapters[adapter]) {
    return adapters[adapter];
  } else {
    throw new Error('Invalid adapter. Please choose from [bookshelf]');
  }
}

module.exports = OhMyJSONAPI;

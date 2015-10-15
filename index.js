var _ = require('lodash'),
    adapters = require('./lib/adapters/');

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
OhMyJSONAPI.prototype.toJSONAPI = function(data, type) {
  // if (!type) { throw new Error('toJSONAPI(): `type` is required.')}
  if (!data) {
    throw new Error('toJSONAPI(): `data` is required.')
  }
  return this._adapter(data, type, this._baseUrl, this._serializerOptions);
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

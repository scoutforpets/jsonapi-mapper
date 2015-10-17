var _ = require('lodash'),
    adapters = require('./lib/adapters/'),
    JSONAPISerializer = require('jsonapi-serializer');

/**
 * Constructor that initializes a new instance of ohMyJSONAPI
 * with the desired adapter. If no adapter is passed
 * @param  {[type]} adapter [description]
 * @return {[type]}         [description]
 */
function OhMyJSONAPI(adapter, baseUrl, serializerOptions) {

  // Lookup and set the adapter if it exists.
  var adapter = _lookupAdapter(adapter);
  this._adapter = adapter ? adapter : null;

  // Trim and set the baseUrl, if it exists.
  this._baseUrl =  baseUrl !== undefined ? _.trimRight(baseUrl, '/') : null;

  // Set default serializer options.
  this._serializerOptions = _.assign({
    includeRelations: true
  }, serializerOptions);
}

/**
 * Serializes the data using the specified adapter.
 * @param  {[type]} data this will
 * @param  {[type]} type [description]
 * @return {[type]}      [description]
 */
OhMyJSONAPI.prototype.toJSONAPI = function(data, type, includeRelations) {
  if (!data) { throw new Error('toJSONAPI(): `data` is required.')}
  if (!type) { throw new Error('toJSONAPI(): `type` is required.')}

  // If an adapter was set, use it, otherwise, pass
  // everything to the raw serializer.
  if (this._adapter) {
      return this._adapter(data, type, this._baseUrl, this._serializerOptions, includeRelations);
  } else {
    return this.serializer(type, data, this._serializerOptions);
  }
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
  if (adapter) {
    if (adapters[adapter]) {
      return adapters[adapter];
    } else {
      throw new Error('Invalid adapter. Please choose from [bookshelf]');
    }
  }
}

module.exports = OhMyJSONAPI;

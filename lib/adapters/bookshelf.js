var _ = require('lodash'),
  inflection = require('inflection'),
  JSONAPISerializer = require('jsonapi-serializer'),
  Qs = require('qs');

/**
 * The Bookshelf Adapter builds a set of template from a
 * Bookshelf Collection or Model to be passed to the JSONAPISerializer.
 * @param {[type]} data              [description]
 * @param {[type]} type              [description]
 * @param {[type]} baseUrl           [description]
 * @param {[type]} serializerOptions [description]
 */
function BookshelfAdapter(data, type, baseUrl, serializerOptions, options) {

  var template = {};

  // assign a default to options if none exist
  options = _.assign({}, options);

  // Add any meta data passed in serializerOptions.
  if (serializerOptions.meta) {
    template.meta = serializerOptions.meta;
  }

  // Is data a Bookshelf Collection? If no, then it's a Bookshelf Model.
  var isCollection = _isCollection(data);

  // If the data is a Bookshelf Collection, add the top-level links
  // object that describes the Collection's location.
  if (isCollection) {
    template.topLevelLinks = _buildTopLevelLinks(baseUrl, type, options.query);

    // If there are pagination parameters, build the proper pagination links.
    if (!_isDataEmpty(data) &&
        !_.isEmpty(options.pagination) &&
        data.length >= options.pagination.limit) {
      template.topLevelLinks = _.assign(template.topLevelLinks, _buildPaginationLinks(baseUrl, type, options.pagination, options.query));
    }
  }

  // Check to see if there is any data to process. If not, return an empty,
  // yet compliant, payload.
  if (!_isDataEmpty(data)) {

    // In order to generate the necessary transform schema for the serializer,
    // we only need a single instance of the Bookshelf Model. If data is a Collection
    // pluck the first model to use as a template. Otherwise, just use data as the Model.
    var model = null;

    if (isCollection) {
      model = data.models[0];
    } else {
      model = data;
    }

    // Build the link for each resource.
    template.dataLinks = _buildSelfLink(baseUrl, type);

    // Get top-level attributes from the Model.
    var topLevelAttributes = _.keys(model.attributes);

    // If the Model has any relations, we need to run through them and build a
    // relationships object to pass to the serializer.
    var relations = {};

    // Include relations in the response unless passed directly to the adapter.
    // Default is true.
    var included;

    if (options.includeRelations !== undefined) {
      included = options.includeRelations;
    } else {
      included = serializerOptions.include;
    }

    var relationAttributes = null,
      relationKeys = null;

    _.forOwn(model.relations, function(relationValue, relationType) {

      // Since there is a relation, we need to add the relation key to
      // the top level attributes to form an association.
      topLevelAttributes.push(relationType);

      if (isCollection) {

        _.forEach(data.models, function(r) {

          var relationModels = r.relations[relationType];

          // Retrieve the attributes/keys from the relation.
          if (_.isArray(relationModels.models) && relationModels.models.length > 0) {

            // Handles many-to relationship.
            relationAttributes = _getRelationAttributes(relationModels.models[0]);

            // Break the loop as soon as a suitable template has been found.
            return false;

          } else if (!_.isEmpty(relationModels.attributes)) {

            // Handle one-to relationship.
            relationAttributes = _getRelationAttributes(relationModels);

            return false;
          }

        });

      } else {

        // Retrieve the attributes from the relation.
        relationAttributes = _getRelationAttributes(relationValue);
      }

      // Get the keys needed to build the transform schema.
      relationKeys = _.keys(relationAttributes);

      // Build the transform schema for the relation.
      relations[relationType] =
        _buildRelation(baseUrl, relationType, relationKeys, type, included);

    });

    // Add the attributes to the schema now that relations have been added.
    template.attributes = topLevelAttributes;

    // Add each of the relation transforms to the primary schema.
    _.forOwn(relations, function(value, relation) {
      template[relation] = relations[relation];
    })

    // Add any serializer template to the schema.
    _.assign(template, serializerOptions);

    // Return the data in JSON API format.
    return new JSONAPISerializer(type, data.toJSON(), template);
  }

  // Return an empty JSON API-compliant response.
  return new JSONAPISerializer(type, isCollection ? [] : null, template);
}

/**
 * Generates the top level links object.
 * @param  {[type]} baseUrl [description]
 * @param  {[type]} type    [description]
 * @return {[type]}         [description]
 */
function _buildTopLevelLinks(baseUrl, type, queryParams) {
  return _buildSelfLink(baseUrl, type, queryParams);
}

/**
 * Generates pagination links for a collection.
 * @param  {[type]} baseUrl [description]
 * @param  {[type]} type    [description]
 * @return {[type]}         [description]
 */
function _buildPaginationLinks(baseUrl, type, pagination, queryParams) {

  var baseLink = baseUrl + '/' + inflection.pluralize(type);

  // exclude any existing paging parameters when generating pagination links
  if(!_.isEmpty(queryParams)) {
    queryParams = _.omit(queryParams, 'page');
  }

  return {

    first: function(dataSet, model) {

      // base url for the collection
      var link = baseLink;

      link += '?page[limit]=' + pagination.limit;

      if (!_.isEmpty(queryParams)) {
        link += '&' + Qs.stringify(queryParams, {
          encode: false
        });
      }

      return link;
    },

    prev: function(dataSet, model) {

      if (pagination.offset == 0) {
        return null;
      }

      // base url for the collection
      var link = baseLink;

      link += '?page[limit]=' + pagination.limit;
      link += '&page[offset]=' + (pagination.offset - pagination.limit);

      if (!_.isEmpty(queryParams)) {
        link += '&' + Qs.stringify(queryParams, {
          encode: false
        });
      }

      return link;
    },

    next: function(dataSet, model) {

      if (dataSet.length < pagination.limit) {
        return null;
      } else {

        // base url for the collection
        var link = baseLink;

        link += '?page[limit]=' + pagination.limit;
        link += '&page[offset]=' + (pagination.offset + pagination.limit);

        if (!_.isEmpty(queryParams)) {
          link += '&' + Qs.stringify(queryParams, {
            encode: false
          });
        }

        return link;
      }
    },

    last: function(dataSet, model) {

      if (pagination.total) {

        // base url for the collection
        var link = baseLink;

        link += '?page[limit]=' + pagination.limit;
        link += '&page[offset]=' + (pagination.total - pagination.limit);

        return link;

      } else {
        return null;
      }
    }
  };
}

/**
 * Generates the resource's url.
 * @param  {[type]} baseUrl [description]
 * @param  {[type]} type    [description]
 * @param  {[type]} id      [description]
 * @return {[type]}         [description]
 */
function _buildSelfLink(baseUrl, modelType, queryParams) {
  return {
    self: function(dataSet, model) {

      // base url for the collection
      var link = baseUrl + '/' + inflection.pluralize(modelType);

      if (model) {

        // if an id was specified, append it to the link
        if (model.id !== null) {
          link += '/' + model.id;

          return link;
        }

        return null;
      } else {
        return link;
      }
    }
  };
}

/**
 * Builds the relationship transform schema.
 * @param  {[type]} baseUrl      [description]
 * @param  {[type]} relationType [description]
 * @param  {[type]} modelType    [description]
 * @param  {[type]} id           [description]
 * @param  {[type]} relationKeys [description]
 * @param  {[type]} included     [description]
 * @return {[type]}              [description]
 */
function _buildRelation(baseUrl, relationType, relationKeys, modelType, included) {

  // pluralize the relation and model types to conform with the spec
  relationType = inflection.pluralize(relationType);
  modelType = inflection.pluralize(modelType);

  var baseRelationUrl = baseUrl + '/' + modelType + '/';

  return {
    ref: 'id',
    attributes: relationKeys,
    relationshipLinks: {
      self: function(dataSet, model) {
        return baseRelationUrl + dataSet.id + '/relationships/' + relationType;
      },
      related: function(dataSet, model) {
        return baseRelationUrl + dataSet.id + '/' + relationType;
      }
    },
    includedLinks: {
      self: function(dataSet, model) {
        return baseUrl + '/' + relationType + '/' + model.id;
      }
    },
    included: included
  }
}

/**
 * Retrieves a relation's attributes depending on the
 * type of relationship (one, many).
 * @param  {[type]} relation [description]
 * @return {[type]}          [description]
 */
function _getRelationAttributes(relation) {
  if (relation.models !== undefined &&
    relation.models.length > 0) {

    // treat as many
    return relation.models[0].attributes;

  } else if (relation.attributes !== undefined) {

    // treat as one
    return relation.attributes;

  }
}

/**
 * Determine whether Bookshelf object is a Collection.
 * @param  {[type]}  data [description]
 * @return {Boolean}      [description]
 */
function _isCollection(data) {
  if (data.models !== undefined) {
    return true;
  } else {
    return false
  }
}

/**
 * Determines whether a Bookshelf Model's relationships are empty.
 * @param  {[type]}  relation [description]
 * @return {Boolean}          [description]
 */
function _isDataEmpty(data) {
  if (data.attributes !== undefined ||
    (data.models !== undefined && data.length > 0)) {
    return false;
  }
  return true;
}

module.exports = BookshelfAdapter;

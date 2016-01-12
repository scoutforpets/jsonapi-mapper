'use strict';

import * as _ from 'lodash';
import * as inflection from 'inflection';
import * as Serializer from 'jsonapi-serializer';
import * as qs from 'qs';

import {Data, Model, Collection} from './bookshelf-extras';
import {Model as BModel, Collection as BCollection} from 'bookshelf';
import * as links from './links';
import * as utils from './utils';

interface QueryObj {
  [key: string]: string;
}

interface adapterOpts {
  query?: QueryObj;
  pagination?: links.IPagParams;
}

export default function BookshelfAdapter(data: Data,
                                         type: string,
                                         baseUrl: string,
                                         serializerOptions: Serializer.ISerializerOptions,
                                         options: adapterOpts = {}): any {

  // TODO ADD meta property of serializerOptions TO template

  let template: Serializer.ISerializerOptions = {};

  // Build links objects
  template.topLevelLinks = links.buildTop(baseUrl, type, options.query, options.pagination);
  template.dataLinks = links.buildSelf(baseUrl, type, options.query);

  // Serializer process for a Model
  if (utils.isModel(data)) {
    let model: Model = <Model> data;

    // Add list of valid attributes
    template.attributes = utils.getDataAttributesList(model);

    // Add relations
    _.forOwn(model.relations, function(relModel: Model, relName: string): void {

      // Add relation to attribute list
      template.attributes.push(relName);

      // Add relation serialization
      template[relName] = utils.buildRelation(baseUrl, relName, utils.getDataAttributesList(relModel), type, true);

    });

  // Serializer process for a Collection
  } else if (utils.isCollection(data)) {
    let model: Model = (<Collection> data).first();

    // Add list of valid attributes
    template.attributes = utils.getDataAttributesList(model);

    // Add relations TODO (HOW MANY TO MANY?)
  }

  // Override the template with the provided serializer options
  _.assign(template, serializerOptions);

  // Return the data in JSON API format
  return new Serializer(type, JSON.stringify(data), template);
}
